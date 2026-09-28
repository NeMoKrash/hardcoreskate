import express from 'express'
import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import multer from 'multer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, 'data')
const DB_PATH = path.join(DATA_DIR, 'db.json')
const SQLITE_PATH = path.join(DATA_DIR, 'shop.sqlite')
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads')

await fs.mkdir(UPLOADS_DIR, { recursive: true })

let DB = null
let useJsonFallback = false

try {
    const Database = (await import('better-sqlite3')).default
    DB = new Database(SQLITE_PATH)
    DB.exec(`CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`)
} catch (error) {
    useJsonFallback = true
    console.warn('[db] better-sqlite3 unavailable, falling back to JSON file storage:', error.message)
}

const SIZES = ['8.25"', '8.5"']
const STATUSES = ['in_stock', 'sold_out', 'coming_soon']

const DEFAULT_PRODUCTS = [
    {
        id: '1',
        name: 'LEOPARD CLASSIC',
        spec: 'КАНАДСКИЙ КЛЁН',
        description: 'Фирменная дека HARDCORE_CO с авторским дизайном. Семь слоёв канадского клёна — жёсткий поп, средний конкейв под любой стиль катания. Свежая с завода, нигде не валялась.',
        price: 26900,
        status: 'in_stock',
        gripTape: true,
        images: ['/skate_design.png'],
        sizes: { '8.25"': 10, '8.5"': 10 },
        order: 0,
    },
    {
        id: '2',
        name: 'VIOLET CLASSIC',
        spec: 'КАНАДСКИЙ КЛЁН',
        description: 'Фирменная дека HARDCORE_CO — прямо как название. Семь слоёв канадского клёна, высокий конкейв под трюки. Свежая с завода, нигде не валялась.',
        price: 26900,
        status: 'in_stock',
        gripTape: true,
        images: ['/deck_detail1.png'],
        sizes: { '8.25"': 10, '8.5"': 10 },
        order: 1,
    },
    {
        id: '3',
        name: 'INSULT CLASSIC',
        spec: 'КАНАДСКИЙ КЛЁН',
        description: 'Эта дека посвящена команде ИНСУЛЬТ — ребята только набирают обороты и уже делают своё. Семь слоёв канадского клёна, свежая прямо с завода, ни разу не ездили. Если следишь за командой — сам знаешь зачем брать.',
        price: 26900,
        status: 'in_stock',
        gripTape: true,
        images: ['/deck_detail2.png'],
        sizes: { '8.25"': 10, '8.5"': 10 },
        order: 2,
    },
]

function sanitizeSizes(input) {
    const out = {}
    for (const size of SIZES) {
        const v = Number(input?.[size])
        out[size] = Number.isFinite(v) && v > 0 ? Math.floor(v) : 0
    }
    return out
}

function sanitizeImages(input) {
    if (!Array.isArray(input)) return []
    return input.filter((img) => typeof img === 'string' && img.trim()).map((img) => img.trim())
}

function normalizeProduct(raw, fallbackOrder) {
    const id = raw?.id !== undefined && raw?.id !== null ? String(raw.id) : String(fallbackOrder + 1)
    return {
        id,
        name: typeof raw?.name === 'string' && raw.name.trim() ? raw.name.trim() : 'НОВАЯ ДЕКА',
        spec: typeof raw?.spec === 'string' ? raw.spec.trim() : '',
        description: typeof raw?.description === 'string' ? raw.description.trim() : '',
        price: Number.isFinite(Number(raw?.price)) && Number(raw.price) >= 0 ? Math.round(Number(raw.price)) : 0,
        status: STATUSES.includes(raw?.status) ? raw.status : 'in_stock',
        gripTape: typeof raw?.gripTape === 'boolean' ? raw.gripTape : true,
        archived: typeof raw?.archived === 'boolean' ? raw.archived : false,
        images: sanitizeImages(raw?.images),
        sizes: sanitizeSizes(raw?.sizes),
        order: Number.isFinite(Number(raw?.order)) ? Number(raw.order) : fallbackOrder,
        updatedAt: typeof raw?.updatedAt === 'string' ? raw.updatedAt : null,
    }
}

function migrateProductsFromLegacyStock(data) {
    const stock = data?.stock && typeof data.stock === 'object' ? data.stock : {}
    return DEFAULT_PRODUCTS.map((product) => ({
        ...product,
        sizes: sanitizeSizes(stock[product.id] ?? stock[Number(product.id)] ?? product.sizes),
    }))
}

function createInitialDb() {
    return {
        products: DEFAULT_PRODUCTS.map((p, i) => normalizeProduct(p, i)),
        orders: [],
        productsUpdatedAt: null,
    }
}

function normalizeDb(data) {
    let productsSource
    if (Array.isArray(data?.products) && data.products.length > 0) {
        productsSource = data.products
    } else if (data?.stock && typeof data.stock === 'object') {
        productsSource = migrateProductsFromLegacyStock(data)
    } else {
        productsSource = DEFAULT_PRODUCTS
    }

    const products = productsSource
        .map((p, i) => normalizeProduct(p, i))
        .sort((a, b) => a.order - b.order)

    return {
        products,
        orders: Array.isArray(data?.orders) ? data.orders : [],
        productsUpdatedAt: data?.productsUpdatedAt || null,
    }
}

async function readDb() {
    try {
        if (useJsonFallback) {
            try {
                const file = await fs.readFile(DB_PATH, 'utf-8')
                return normalizeDb(JSON.parse(file))
            } catch (error) {
                if (error.code === 'ENOENT') {
                    const initial = createInitialDb()
                    await writeDb(initial)
                    return initial
                }
                throw error
            }
        }

        const row = DB.prepare('SELECT value FROM app_state WHERE key = ?').get('main')
        if (!row) {
            const initial = createInitialDb()
            await writeDb(initial)
            return initial
        }
        return normalizeDb(JSON.parse(row.value))
    } catch (error) {
        if (error.code === 'ENOENT') {
            const initial = createInitialDb()
            await writeDb(initial)
            return initial
        }
        throw error
    }
}

async function writeDb(data) {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true })
    const payload = JSON.stringify(data, null, 2)

    if (useJsonFallback) {
        await fs.writeFile(DB_PATH, payload, 'utf-8')
        return
    }

    DB.prepare('INSERT INTO app_state (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run('main', payload)
}

function buildOrderMessage(cart) {
    return cart.map((item) => `${item.name} ${item.size ? `(${item.size})` : ''} x${item.qty}`).join(', ')
}

function nextProductId(products) {
    let max = 0
    for (const p of products) {
        const n = parseInt(p.id, 10)
        if (Number.isFinite(n) && n > max) max = n
    }
    return String(max + 1)
}

// ---- Admin auth ----
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '248f4e8c90e3473f7108560ea6a404c9a53953d18a2528f142a72392b7a4d49b'
const SESSION_TTL_MS = 12 * 60 * 60 * 1000
const sessions = new Map()

function sha256Hex(input) {
    return crypto.createHash('sha256').update(input, 'utf-8').digest('hex')
}

function createSession() {
    const token = crypto.randomBytes(32).toString('hex')
    sessions.set(token, Date.now() + SESSION_TTL_MS)
    return token
}

function isValidSession(token) {
    if (!token) return false
    const expires = sessions.get(token)
    if (!expires) return false
    if (Date.now() > expires) {
        sessions.delete(token)
        return false
    }
    return true
}

function requireAdmin(req, res, next) {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!isValidSession(token)) {
        return res.status(401).json({ message: 'Требуется авторизация' })
    }
    next()
}

// ---- Uploads ----
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'])
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || '').toLowerCase()
        const safeExt = ALLOWED_EXT.has(ext) ? ext : ''
        cb(null, `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${safeExt}`)
    },
})

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024, files: 8 },
    fileFilter: (req, file, cb) => {
        const ok = /^image\/(jpeg|png|webp|gif|avif)$/.test(file.mimetype)
        cb(ok ? null : new Error('Неподдерживаемый тип файла'), ok)
    },
})

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const sseClients = new Set()

app.options('/api/*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.sendStatus(204)
})

function broadcastProducts(products) {
    const payload = `data: ${JSON.stringify(products)}\n\n`
    for (const res of sseClients) {
        try {
            res.write(payload)
        } catch {
            // ignore failed client
        }
    }
}

// ---- Public product routes ----
app.get('/api/products', async (req, res) => {
    const db = await readDb()
    res.json(db.products)
})

app.get('/api/products/stream', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders && res.flushHeaders()

    try {
        const db = await readDb()
        res.write(`data: ${JSON.stringify(db.products)}\n\n`)
    } catch {
        res.write(`data: []\n\n`)
    }

    sseClients.add(res)
    req.on('close', () => {
        sseClients.delete(res)
    })
})

// ---- Admin auth routes ----
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body || {}
    if (typeof password !== 'string' || !password || sha256Hex(password) !== ADMIN_PASSWORD_HASH) {
        return res.status(401).json({ message: 'Неверный пароль' })
    }
    const token = createSession()
    res.json({ token })
})

app.post('/api/admin/logout', requireAdmin, (req, res) => {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (token) sessions.delete(token)
    res.json({ ok: true })
})

app.get('/api/admin/session', requireAdmin, (req, res) => {
    res.json({ ok: true })
})

// ---- Admin product CRUD ----
app.post('/api/admin/products', requireAdmin, async (req, res) => {
    const db = await readDb()
    const id = nextProductId(db.products)
    const now = new Date().toISOString()
    const product = normalizeProduct({ ...(req.body || {}), id, images: [], order: db.products.length, updatedAt: now }, db.products.length)
    db.products.push(product)
    db.productsUpdatedAt = now
    await writeDb(db)
    broadcastProducts(db.products)
    res.status(201).json({ product, products: db.products })
})

app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
    const db = await readDb()
    const idx = db.products.findIndex((p) => p.id === req.params.id)
    if (idx === -1) return res.status(404).json({ message: 'Товар не найден' })

    const existing = db.products[idx]
    const now = new Date().toISOString()
    const merged = normalizeProduct(
        {
            ...existing,
            ...req.body,
            id: existing.id,
            images: existing.images,
            order: existing.order,
            updatedAt: now,
        },
        idx
    )
    db.products[idx] = merged
    db.productsUpdatedAt = now
    await writeDb(db)
    broadcastProducts(db.products)
    res.json({ product: merged, products: db.products })
})

app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
    const db = await readDb()
    const idx = db.products.findIndex((p) => p.id === req.params.id)
    if (idx === -1) return res.status(404).json({ message: 'Товар не найден' })

    const [removed] = db.products.splice(idx, 1)
    db.products.forEach((p, i) => { p.order = i })
    db.productsUpdatedAt = new Date().toISOString()
    await writeDb(db)

    for (const img of removed.images || []) {
        if (img.startsWith('/uploads/')) {
            fs.unlink(path.join(UPLOADS_DIR, path.basename(img))).catch(() => {})
        }
    }

    broadcastProducts(db.products)
    res.json({ products: db.products })
})

app.post('/api/admin/products/reorder', requireAdmin, async (req, res) => {
    const { order } = req.body || {}
    if (!Array.isArray(order)) return res.status(400).json({ message: 'Неверный порядок' })

    const db = await readDb()
    const byId = new Map(db.products.map((p) => [p.id, p]))
    const reordered = order.map((id) => byId.get(String(id))).filter(Boolean)
    for (const p of db.products) {
        if (!reordered.includes(p)) reordered.push(p)
    }
    reordered.forEach((p, i) => { p.order = i })
    db.products = reordered
    db.productsUpdatedAt = new Date().toISOString()
    await writeDb(db)
    broadcastProducts(db.products)
    res.json({ products: db.products })
})

// ---- Admin image management ----
app.post('/api/admin/products/:id/images', requireAdmin, upload.array('images', 8), async (req, res) => {
    const db = await readDb()
    const product = db.products.find((p) => p.id === req.params.id)
    if (!product) return res.status(404).json({ message: 'Товар не найден' })

    const newPaths = (req.files || []).map((f) => `/uploads/${f.filename}`)
    product.images = [...product.images, ...newPaths]
    product.updatedAt = new Date().toISOString()
    db.productsUpdatedAt = product.updatedAt
    await writeDb(db)
    broadcastProducts(db.products)
    res.json({ product, products: db.products })
})

app.delete('/api/admin/products/:id/images', requireAdmin, async (req, res) => {
    const { image } = req.body || {}
    if (!image) return res.status(400).json({ message: 'Не указано изображение' })

    const db = await readDb()
    const product = db.products.find((p) => p.id === req.params.id)
    if (!product) return res.status(404).json({ message: 'Товар не найден' })

    product.images = product.images.filter((img) => img !== image)
    product.updatedAt = new Date().toISOString()
    db.productsUpdatedAt = product.updatedAt
    await writeDb(db)

    if (image.startsWith('/uploads/')) {
        fs.unlink(path.join(UPLOADS_DIR, path.basename(image))).catch(() => {})
    }

    broadcastProducts(db.products)
    res.json({ product, products: db.products })
})

app.put('/api/admin/products/:id/images/cover', requireAdmin, async (req, res) => {
    const { image } = req.body || {}
    if (!image) return res.status(400).json({ message: 'Не указано изображение' })

    const db = await readDb()
    const product = db.products.find((p) => p.id === req.params.id)
    if (!product) return res.status(404).json({ message: 'Товар не найден' })
    if (!product.images.includes(image)) return res.status(400).json({ message: 'Изображение не найдено у товара' })

    product.images = [image, ...product.images.filter((img) => img !== image)]
    product.updatedAt = new Date().toISOString()
    db.productsUpdatedAt = product.updatedAt
    await writeDb(db)
    broadcastProducts(db.products)
    res.json({ product, products: db.products })
})

// Multer / upload error handler
app.use((err, req, res, next) => {
    if (err) {
        return res.status(400).json({ message: err.message || 'Ошибка загрузки файла' })
    }
    next()
})

// ---- Orders ----
app.post('/api/orders', async (req, res) => {
    const { cart } = req.body
    if (!Array.isArray(cart) || cart.length === 0) {
        return res.status(400).json({ message: 'Корзина пуста' })
    }

    const db = await readDb()

    const order = {
        id: `order_${Date.now()}`,
        createdAt: new Date().toISOString(),
        cart,
        total: cart.reduce((sum, item) => sum + item.price * item.qty, 0),
        message: buildOrderMessage(cart),
        status: 'submitted',
    }

    db.orders.push(order)
    await writeDb(db)

    res.json({ order })
})

app.get('/api/orders', requireAdmin, async (req, res) => {
    const db = await readDb()
    res.json(db.orders)
})

app.all('/api/*', (req, res) => {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        return res.sendStatus(204)
    }
    return res.status(404).json({ message: 'API endpoint not found', path: req.path, method: req.method })
})

app.use('/uploads', express.static(UPLOADS_DIR))

const staticPath = path.join(__dirname, 'dist')
app.use(express.static(staticPath))
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
        return next()
    }
    res.sendFile(path.join(staticPath, 'index.html'), (err) => {
        if (err) next(err)
    })
})

// keep-alive heartbeat to connected SSE clients
setInterval(() => {
    for (const res of sseClients) {
        try { res.write(':heartbeat\n\n') } catch { /* ignore dead connection */ }
    }
}, 30000)

// periodically clean up expired sessions
setInterval(() => {
    const now = Date.now()
    for (const [token, expires] of sessions) {
        if (now > expires) sessions.delete(token)
    }
}, 60 * 60 * 1000)

const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '0.0.0.0'
app.listen(PORT, HOST, () => {
    console.log(`Server started on http://${HOST}:${PORT}`)
})
