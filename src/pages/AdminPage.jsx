import { useState, useEffect, useRef } from 'react'
import { adminFetch, getAdminToken, setAdminToken, getApiUrl } from '../lib/api'
import { SIZES, STATUS_OPTIONS } from '../lib/products'

function toDraft(product) {
  return {
    name: product.name || '',
    spec: product.spec || '',
    description: product.description || '',
    price: String(product.price ?? 0),
    status: product.status || 'in_stock',
    gripTape: !!product.gripTape,
    archived: !!product.archived,
    sizes: { ...(product.sizes || {}) },
  }
}

function LoginScreen({ onSubmit, password, setPassword, error, authLoading }) {
  return (
    <div className="bg-ink min-h-screen flex items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-[380px]">
        <div className="border border-white/15 p-8 sm:p-10 flex flex-col gap-6">
          <div>
            <div data-text="HARDCORE_CO" className="glitch-text font-headline-md text-white text-lg font-bold uppercase tracking-tight">
              HARDCORE_CO
            </div>
            <div className="text-white/35 text-[11px] font-label-bold uppercase tracking-[0.2em] mt-2">
              Панель управления
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              autoFocus
              className="bg-transparent border text-white text-base px-4 py-3 outline-none w-full box-border font-body-md transition-colors"
              style={{ borderColor: error ? '#ff2d47' : 'rgba(255,255,255,0.15)' }}
            />
            {error && (
              <div className="text-accent-glow text-[11px] font-label-bold uppercase tracking-widest">
                {error}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!password || authLoading}
            className={`border py-3.5 font-label-bold uppercase tracking-widest transition-colors ${password && !authLoading
              ? 'bg-accent text-white border-accent hover:bg-transparent hover:text-accent cursor-pointer'
              : 'bg-transparent text-white/25 border-white/15 cursor-not-allowed'
              }`}
          >
            {authLoading ? '...' : 'ВОЙТИ'}
          </button>
        </div>
      </form>
    </div>
  )
}

function ImageManager({ product, uploading, onUpload, onDelete, onSetCover }) {
  const inputRef = useRef(null)

  return (
    <div className="flex flex-col gap-2">
      <span className="font-label-bold uppercase tracking-widest text-on-surface-variant text-[11px]">
        Фотографии ({product.images.length})
      </span>
      <div className="flex flex-wrap gap-2">
        {product.images.map((img, i) => (
          <div key={img} className="relative w-20 h-20 border border-white/15 bg-white group flex-shrink-0">
            <img src={img} alt="" className="w-full h-full object-contain p-1" />
            {i === 0 && (
              <span className="absolute top-0 left-0 bg-black/80 text-white/80 text-[8px] font-label-bold uppercase px-1 py-0.5">обложка</span>
            )}
            <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
              {i !== 0 && (
                <button
                  type="button"
                  onClick={() => onSetCover(img)}
                  className="text-[9px] font-label-bold uppercase text-white/70 hover:text-white"
                >
                  сделать обложкой
                </button>
              )}
              <button
                type="button"
                onClick={() => onDelete(img)}
                className="text-[9px] font-label-bold uppercase text-white/70 hover:text-white"
              >
                удалить
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-20 h-20 border border-dashed border-white/20 hover:border-white/40 flex-shrink-0 flex flex-col items-center justify-center gap-1 text-white/40 hover:text-white/70 transition-colors disabled:opacity-40"
        >
          <span className="material-symbols-outlined text-xl">{uploading ? 'hourglass_empty' : 'add_photo_alternate'}</span>
          <span className="text-[8px] font-label-bold uppercase">{uploading ? 'ЗАГРУЗКА' : 'ДОБАВИТЬ'}</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            onUpload(e.target.files)
            e.target.value = ''
          }}
        />
      </div>
      <p className="text-white/25 text-[10px] font-label-bold uppercase tracking-widest">
        Новая партия — удалите старые фото и добавьте свежие. Первое фото = обложка карточки.
      </p>
    </div>
  )
}

// Owns its own draft/saving/upload state, seeded once from `product`. A new
// product gets a fresh instance (mounted by its own key in the list below),
// and a deleted one simply unmounts — no parent-level sync effect needed.
function ProductEditor({ product, reloadProducts, onDeleteProduct, onMove, isFirst, isLast }) {
  const [draft, setDraft] = useState(() => toDraft(product))
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  function onChange(patch) {
    setDraft((prev) => ({ ...prev, ...patch }))
    setSavedMsg('')
  }

  function onSizeChange(size, value) {
    const num = Math.max(0, parseInt(value, 10) || 0)
    setDraft((prev) => ({ ...prev, sizes: { ...prev.sizes, [size]: num } }))
    setSavedMsg('')
  }

  async function onSave() {
    setSaving(true)
    try {
      const res = await adminFetch(`/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.name,
          spec: draft.spec,
          description: draft.description,
          price: Number(draft.price) || 0,
          status: draft.status,
          gripTape: draft.gripTape,
          archived: draft.archived,
          sizes: draft.sizes,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.product) {
        setDraft(toDraft(data.product))
        setSavedMsg('СОХРАНЕНО')
        reloadProducts?.()
      } else {
        setSavedMsg(data.message || 'НЕ УДАЛОСЬ СОХРАНИТЬ')
      }
    } catch {
      setSavedMsg('ОШИБКА СЕТИ')
    } finally {
      setSaving(false)
    }
  }

  async function onUpload(fileList) {
    const files = Array.from(fileList || [])
    if (!files.length) return
    setUploading(true)
    try {
      const formData = new FormData()
      for (const file of files) formData.append('images', file)
      const res = await adminFetch(`/admin/products/${product.id}/images`, { method: 'POST', body: formData })
      const data = await res.json().catch(() => ({}))
      setSavedMsg(res.ok ? 'ФОТО ДОБАВЛЕНЫ' : (data.message || 'НЕ УДАЛОСЬ ЗАГРУЗИТЬ'))
      if (res.ok) reloadProducts?.()
    } catch {
      setSavedMsg('ОШИБКА СЕТИ ПРИ ЗАГРУЗКЕ')
    } finally {
      setUploading(false)
    }
  }

  async function onDeleteImage(image) {
    if (!window.confirm('Удалить это фото?')) return
    try {
      const res = await adminFetch(`/admin/products/${product.id}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      })
      if (res.ok) reloadProducts?.()
    } catch {
      // ignore, admin can retry
    }
  }

  async function onSetCover(image) {
    try {
      const res = await adminFetch(`/admin/products/${product.id}/images/cover`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      })
      if (res.ok) reloadProducts?.()
    } catch {
      // ignore, admin can retry
    }
  }

  async function handleDelete() {
    if (!window.confirm('Удалить товар полностью? Это действие необратимо.')) return
    setDeleting(true)
    try {
      await onDeleteProduct(product.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="border border-white/12 p-5 sm:p-8 flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => onMove(product.id, -1)} disabled={isFirst} className="w-8 h-8 border border-white/15 text-white/50 hover:border-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center">
            <span className="material-symbols-outlined text-base">arrow_upward</span>
          </button>
          <button type="button" onClick={() => onMove(product.id, 1)} disabled={isLast} className="w-8 h-8 border border-white/15 text-white/50 hover:border-white/40 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center">
            <span className="material-symbols-outlined text-base">arrow_downward</span>
          </button>
          <span className="font-label-bold text-white/25 uppercase text-[10px] tracking-widest ml-1">ID {product.id}</span>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="text-[11px] font-label-bold uppercase tracking-widest text-white/35 hover:text-white transition-colors disabled:opacity-40"
        >
          {deleting ? 'удаление...' : 'удалить товар'}
        </button>
      </div>

      <ImageManager product={product} uploading={uploading} onUpload={onUpload} onDelete={onDeleteImage} onSetCover={onSetCover} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-label-bold uppercase tracking-widest text-on-surface-variant text-[11px]">Название</span>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="bg-transparent border border-white/15 focus:border-white/50 text-primary font-headline-md px-3 py-2.5 outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-label-bold uppercase tracking-widest text-on-surface-variant text-[11px]">Материал / спецификация</span>
          <input
            type="text"
            value={draft.spec}
            onChange={(e) => onChange({ spec: e.target.value })}
            className="bg-transparent border border-white/15 focus:border-white/50 text-primary font-body-lg px-3 py-2.5 outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-label-bold uppercase tracking-widest text-on-surface-variant text-[11px]">Цена (₸)</span>
          <input
            type="number"
            min="0"
            value={draft.price}
            onChange={(e) => onChange({ price: e.target.value })}
            className="bg-transparent border border-white/15 focus:border-white/50 text-primary font-headline-md px-3 py-2.5 outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-label-bold uppercase tracking-widest text-on-surface-variant text-[11px]">Статус</span>
          <select
            value={draft.status}
            onChange={(e) => onChange({ status: e.target.value })}
            className="bg-black border border-white/15 focus:border-white/50 text-primary font-label-bold uppercase tracking-widest px-3 py-2.5 outline-none"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="font-label-bold uppercase tracking-widest text-on-surface-variant text-[11px]">Описание</span>
        <textarea
          value={draft.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          className="bg-transparent border border-white/15 focus:border-white/50 text-on-surface font-body-md px-3 py-2.5 outline-none resize-none"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="font-label-bold uppercase tracking-widest text-on-surface-variant text-[11px]">Остатки по размерам</span>
        <div className="grid grid-cols-2 gap-3">
          {SIZES.map((size) => (
            <div key={size} className="border border-white/12 p-3">
              <div className="font-label-bold text-on-surface-variant uppercase tracking-widest mb-2 text-[11px]">{size}</div>
              <input
                type="number"
                min="0"
                value={draft.sizes[size] ?? 0}
                onChange={(e) => onSizeChange(size, e.target.value)}
                className="w-full bg-transparent border-b border-white/20 focus:border-white/60 text-primary font-headline-md text-center py-1 outline-none"
              />
              <div className="font-label-bold text-on-surface-variant text-[10px] uppercase tracking-widest text-center mt-1">ШТ</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2.5 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={draft.gripTape}
            onChange={(e) => onChange({ gripTape: e.target.checked })}
            className="w-4 h-4 accent-white"
          />
          <span className="font-label-bold uppercase tracking-widest text-on-surface-variant text-[11px]">Шкурка в подарок</span>
        </label>

        <label className="flex items-center gap-2.5 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={draft.archived}
            onChange={(e) => onChange({ archived: e.target.checked })}
            className="w-4 h-4 accent-accent"
          />
          <span className="font-label-bold uppercase tracking-widest text-on-surface-variant text-[11px]">Старый дроп (архив)</span>
        </label>
      </div>

      <div className="flex items-center gap-4 pt-2 border-t border-white/10">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-6 py-3 border border-accent bg-accent text-white font-label-bold uppercase tracking-widest hover:bg-transparent hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'СОХРАНЯЮ...' : 'СОХРАНИТЬ ТОВАР'}
        </button>
        {savedMsg && (
          <span className="font-label-bold uppercase tracking-widest text-[11px] text-white/50">{savedMsg}</span>
        )}
      </div>
    </div>
  )
}

export default function AdminPage({ products, reloadProducts, loading }) {
  const [checkingSession, setCheckingSession] = useState(true)
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let active = true
    async function checkSession() {
      const token = getAdminToken()
      if (!token) {
        if (active) setCheckingSession(false)
        return
      }
      try {
        const res = await adminFetch('/admin/session')
        if (active) setAuthed(res.ok)
      } catch {
        if (active) setAuthed(false)
      } finally {
        if (active) setCheckingSession(false)
      }
    }
    checkSession()
    return () => { active = false }
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setAuthLoading(true)
    setLoginError('')
    try {
      const res = await fetch(getApiUrl('/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.token) {
        setAdminToken(data.token)
        setAuthed(true)
      } else {
        setLoginError(data.message || 'Неверный пароль')
        setPassword('')
      }
    } catch {
      setLoginError('Ошибка сети')
    }
    setAuthLoading(false)
  }

  function handleLogout() {
    adminFetch('/admin/logout', { method: 'POST' }).catch(() => {})
    setAdminToken(null)
    setAuthed(false)
  }

  async function handleDeleteProduct(id) {
    const res = await adminFetch(`/admin/products/${id}`, { method: 'DELETE' })
    if (res.ok) reloadProducts?.()
  }

  async function handleMove(id, direction) {
    const ids = products.map((p) => p.id)
    const idx = ids.indexOf(id)
    const swapIdx = idx + direction
    if (idx === -1 || swapIdx < 0 || swapIdx >= ids.length) return
    const nextOrder = [...ids]
      ;[nextOrder[idx], nextOrder[swapIdx]] = [nextOrder[swapIdx], nextOrder[idx]]
    try {
      const res = await adminFetch('/admin/products/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: nextOrder }),
      })
      if (res.ok) reloadProducts?.()
    } catch {
      // ignore, admin can retry
    }
  }

  async function handleAddProduct() {
    setCreating(true)
    try {
      const res = await adminFetch('/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'НОВАЯ ДЕКА', spec: '', description: '', price: 0, status: 'coming_soon', gripTape: true, sizes: {} }),
      })
      if (res.ok) reloadProducts?.()
    } catch {
      // ignore, admin can retry
    } finally {
      setCreating(false)
    }
  }

  if (checkingSession) {
    return <div className="bg-ink min-h-screen" />
  }

  if (!authed) {
    return <LoginScreen onSubmit={handleLogin} password={password} setPassword={setPassword} error={loginError} authLoading={authLoading} />
  }

  return (
    <div className="bg-background text-on-background min-h-screen antialiased">
      <div className="pt-[50px] md:pt-[62px] px-4 sm:px-8 pb-16 max-w-[1100px] mx-auto">
        <div className="mt-8 mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-headline-lg text-primary uppercase">ТОВАРЫ</h1>
            <p className="font-label-bold text-on-surface-variant uppercase tracking-widest mt-1 text-[11px]">
              Каждая карточка сохраняется отдельно кнопкой «СОХРАНИТЬ ТОВАР»
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="font-label-bold uppercase tracking-widest text-[11px] text-white/35 hover:text-white transition-colors"
          >
            выйти
          </button>
        </div>

        <button
          onClick={handleAddProduct}
          disabled={creating}
          className="mb-6 w-full border border-dashed border-white/20 hover:border-white/40 text-white/40 hover:text-white/70 transition-colors py-5 font-label-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <span className="material-symbols-outlined">add</span>
          {creating ? 'СОЗДАЮ...' : 'ДОБАВИТЬ ТОВАР'}
        </button>

        {loading && products.length === 0 ? (
          <p className="font-body-lg text-white/40 text-center py-10">Загружаем...</p>
        ) : (
          <div className="flex flex-col gap-6">
            {products.map((product, i) => (
              <ProductEditor
                key={product.id}
                product={product}
                reloadProducts={reloadProducts}
                onDeleteProduct={handleDeleteProduct}
                onMove={handleMove}
                isFirst={i === 0}
                isLast={i === products.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
