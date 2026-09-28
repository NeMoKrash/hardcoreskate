import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Navbar({ cartCount = 0 }) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleNav(id) {
    setMenuOpen(false)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/')
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 150)
    }
  }

  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-3 sm:px-5 py-3 bg-black/95 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            className="md:hidden text-white/80 hover:text-white transition-colors p-1.5"
            aria-label="Меню"
            onClick={() => setMenuOpen(v => !v)}
          >
            <span className="material-symbols-outlined text-[22px]">{menuOpen ? 'close' : 'menu'}</span>
          </button>
          <div className="hidden md:flex gap-6">
            {[['МАГАЗИН', 'drop'], ['О НАС', 'brand'], ['КОНТАКТ', 'contact']].map(([label, id]) => (
              <button
                key={id}
                onClick={() => handleNav(id)}
                className="text-white/50 hover:text-accent transition-colors uppercase font-label-bold tracking-widest"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <Link
          to="/"
          className="font-headline-md text-sm sm:text-base font-bold text-white uppercase tracking-tight"
        >
          HARDCORE_CO
        </Link>

        <button
          onClick={() => navigate('/cart')}
          className="relative text-white/80 hover:text-accent font-label-bold border border-white/15 hover:border-accent/50 px-3 py-2 flex items-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            shopping_cart
          </span>
          <span className="hidden sm:inline uppercase tracking-widest text-xs">Корзина ({cartCount})</span>
          {cartCount > 0 && (
            <span className="sm:hidden absolute -top-1.5 -right-1.5 bg-white text-black text-[10px] font-black w-4 h-4 flex items-center justify-center leading-none">
              {cartCount}
            </span>
          )}
        </button>
      </nav>

      {menuOpen && (
        <div className="fixed top-[50px] left-0 w-full z-40 bg-black border-b border-white/10 flex flex-col md:hidden">
          {[['МАГАЗИН', 'drop'], ['О НАС', 'brand'], ['НА КАТКЕ', 'reel'], ['КОНТАКТ', 'contact']].map(([label, id]) => (
            <button
              key={id}
              onClick={() => handleNav(id)}
              className="text-white/60 hover:text-accent px-6 py-4 text-left font-label-bold uppercase tracking-widest border-b border-white/5 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
