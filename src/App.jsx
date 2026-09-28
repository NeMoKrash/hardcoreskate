import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import AdminPage from './pages/AdminPage'
import { getApiUrl } from './lib/api'

const CART_STORAGE_KEY = 'web_skate_cart'

function readStoredCart() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.error('Не удалось прочитать корзину из хранилища:', error)
    return []
  }
}

function writeStoredCart(cart) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  } catch (error) {
    console.error('Не удалось сохранить корзину:', error)
  }
}

export default function App() {
  const [cart, setCart] = useState(() => readStoredCart())
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)

  async function reloadProducts() {
    try {
      const response = await fetch(getApiUrl('/products'))
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) setProducts(data)
      }
    } catch (error) {
      console.error('Не удалось обновить товары:', error)
    }
  }

  useEffect(() => {
    let active = true
    async function loadProducts() {
      try {
        const response = await fetch(getApiUrl('/products'))
        if (response.ok) {
          const data = await response.json()
          if (active && Array.isArray(data)) setProducts(data)
        }
      } catch (error) {
        console.error('Не удалось загрузить товары:', error)
      } finally {
        if (active) setProductsLoading(false)
      }
    }
    loadProducts()
    return () => { active = false }
  }, [])

  // Live updates across every open tab/device via Server-Sent Events.
  useEffect(() => {
    if (typeof EventSource === 'undefined') return undefined
    const es = new EventSource(getApiUrl('/products/stream'))
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (Array.isArray(data)) setProducts(data)
      } catch {
        // ignore parse errors
      }
    }
    es.onerror = () => {
      // EventSource auto-reconnects on its own
    }
    return () => es.close()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const handleStorage = (event) => {
      if (event.key === CART_STORAGE_KEY) {
        setCart(readStoredCart())
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    writeStoredCart(cart)
  }, [cart])

  function addToCart(product) {
    setCart((prev) => {
      const key = `${product.id}_${product.size || ''}`
      const existing = prev.find((item) => item.cartKey === key)
      if (existing) {
        return prev.map((item) =>
          item.cartKey === key ? { ...item, qty: item.qty + 1 } : item
        )
      }
      return [...prev, { ...product, cartKey: key, qty: 1 }]
    })
  }

  function removeFromCart(cartKey) {
    setCart((prev) => prev.filter((item) => item.cartKey !== cartKey))
  }

  function updateQty(cartKey, delta) {
    setCart((prev) =>
      prev
        .map((item) => (item.cartKey === cartKey ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    )
  }

  function clearCart() {
    setCart([])
  }

  const cartCount = cart.reduce((n, item) => n + item.qty, 0)

  return (
    <HashRouter>
      <div className="dark">
        <div className="grain-overlay" aria-hidden="true" />
        <Navbar cartCount={cartCount} />
        <Routes>
          <Route path="/" element={<HomePage products={products} loading={productsLoading} />} />
          <Route path="/product/:id" element={<ProductPage addToCart={addToCart} products={products} loading={productsLoading} />} />
          <Route
            path="/cart"
            element={
              <CartPage
                cart={cart}
                removeFromCart={removeFromCart}
                updateQty={updateQty}
                onOrderPlaced={reloadProducts}
                clearCart={clearCart}
              />
            }
          />
          <Route path="/admin" element={<AdminPage products={products} reloadProducts={reloadProducts} loading={productsLoading} />} />
        </Routes>
      </div>
    </HashRouter>
  )
}
