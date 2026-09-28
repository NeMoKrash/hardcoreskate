import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'

const WA_NUMBER = '77771221530'
const TG_USERNAME = 'igsoc'

function buildOrderMessage(cart) {
  const lines = cart.map(
    (item) => `- ${item.name}${item.size ? ` (${item.size})` : ''} x${item.qty} — ${(item.price * item.qty).toLocaleString('ru-RU')}₸`
  )
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  return `Здравствуйте, хочу заказать:\n${lines.join('\n')}\nИтого: ${total.toLocaleString('ru-RU')}₸`
}

export default function CartPage({ cart, removeFromCart, updateQty, onOrderPlaced, clearCart }) {
  const navigate = useNavigate()
  const [tgCopied, setTgCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [orderError, setOrderError] = useState(null)

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const message = buildOrderMessage(cart)

  async function submitOrder() {
    if (!cart.length) return false

    setSaving(true)
    setOrderError(null)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart }),
      })

      const data = await response.json()
      if (!response.ok) {
        setOrderError(data.message || 'Не удалось отправить заказ')
        return false
      }

      if (typeof onOrderPlaced === 'function') {
        onOrderPlaced()
      }
      if (typeof clearCart === 'function') {
        clearCart()
      }
      return true
    } catch (error) {
      console.error('Order submit failed:', error)
      setOrderError('Ошибка сети. Попробуйте ещё раз.')
      return false
    } finally {
      setSaving(false)
    }
  }

  async function handleWhatsApp() {
    const saved = await submitOrder()
    if (!saved) return
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }

  async function handleTelegram() {
    const saved = await submitOrder()
    if (!saved) return
    navigator.clipboard.writeText(message).catch(() => { })
    setTgCopied(true)
    setTimeout(() => setTgCopied(false), 3000)
    window.open(`https://t.me/${TG_USERNAME}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col antialiased">
      <main className="flex-grow pt-[50px] md:pt-[62px] px-4 sm:px-6 md:px-margin pb-16 max-w-[1600px] mx-auto w-full">
        <button
          onClick={() => navigate(-1)}
          className="mt-6 mb-6 flex items-center gap-2 font-label-bold uppercase tracking-widest text-white/60 hover:text-accent transition-colors"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          НАЗАД В МАГАЗИН
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          {/* Товары */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <h1 className="font-headline-lg uppercase border-b border-white/15 pb-4">
              КОРЗИНА ({cart.reduce((n, i) => n + i.qty, 0)})
            </h1>

            {cart.length === 0 ? (
              <div className="border border-white/10 p-10 sm:p-16 text-center">
                <p className="font-body-lg text-white/40 mb-8">Корзина пуста</p>
                <button
                  onClick={() => navigate('/')}
                  className="font-label-bold text-black bg-white px-6 py-3.5 border border-white hover:bg-transparent hover:text-white transition-colors uppercase tracking-widest"
                >
                  СМОТРЕТЬ ДРОП
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {cart.map((item) => (
                  <div key={item.cartKey} className="flex flex-col sm:flex-row gap-4 border-b border-white/10 pb-5">
                    <div className="w-full sm:w-32 md:w-40 aspect-square border border-white/10 bg-white flex-shrink-0 overflow-hidden">
                      {item.image
                        ? <img src={item.image} alt={item.name} className="w-full h-full object-contain p-2" />
                        : <div className="w-full h-full flex items-center justify-center bg-surface-container">
                          <span className="font-headline-lg text-on-surface-variant uppercase text-4xl">{item.name[0]}</span>
                        </div>
                      }
                    </div>
                    <div className="flex flex-col justify-between flex-grow">
                      <div>
                        <h3 className="font-headline-md uppercase mb-1">{item.name} ДЕКА</h3>
                        <p className="font-label-bold text-white/40 uppercase">
                          {item.size ?? '—'}
                        </p>
                      </div>
                      <div className="flex items-end justify-between mt-4 sm:mt-0">
                        <div className="flex items-center border border-white/15">
                          <button onClick={() => updateQty(item.cartKey, -1)} className="px-3 py-1.5 font-headline-md hover:bg-accent hover:text-white transition-colors">-</button>
                          <span className="px-4 py-1.5 font-label-bold">{item.qty}</span>
                          <button onClick={() => updateQty(item.cartKey, 1)} className="px-3 py-1.5 font-headline-md hover:bg-accent hover:text-white transition-colors">+</button>
                        </div>
                        <div className="text-right">
                          <span className="font-headline-md block">{(item.price * item.qty).toLocaleString('ru-RU')}₸</span>
                          <button
                            onClick={() => removeFromCart(item.cartKey)}
                            className="font-label-bold underline decoration-1 uppercase text-white/40 hover:text-white mt-1.5"
                          >
                            УДАЛИТЬ
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Оформление */}
          <div className="lg:col-span-5">
            <div className="border border-white/15 p-5 sm:p-8 lg:sticky lg:top-[70px] flex flex-col gap-6">
              <h2 className="font-headline-md uppercase border-b border-white/15 pb-3">ОФОРМЛЕНИЕ</h2>

              <div className="flex flex-col gap-2.5">
                <h3 className="font-label-bold uppercase tracking-widest text-white/40 mb-1">ИТОГО</h3>
                <div className="flex justify-between font-body-md text-white/70">
                  <span>Подитог</span><span>{subtotal.toLocaleString('ru-RU')}₸</span>
                </div>
                <div className="flex justify-between font-body-md text-white/70">
                  <span>Доставка</span><span>БЕСПЛАТНО</span>
                </div>
                <div className="flex justify-between font-headline-md uppercase text-primary border-t border-accent/40 pt-3 mt-1">
                  <span>СУММА</span><span>{subtotal.toLocaleString('ru-RU')}₸</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <p className="font-label-bold uppercase tracking-widest text-white/40">ОФОРМИТЬ ЧЕРЕЗ:</p>

                <button
                  onClick={handleWhatsApp}
                  disabled={cart.length === 0 || saving}
                  className="w-full flex items-center justify-center gap-3 font-label-bold uppercase tracking-widest text-black bg-[#25D366] px-6 py-3.5 hover:brightness-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-black flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WHATSAPP
                </button>

                <div>
                  <button
                    onClick={handleTelegram}
                    disabled={cart.length === 0 || saving}
                    className="w-full flex items-center justify-center gap-3 font-label-bold uppercase tracking-widest text-white bg-[#229ED9] px-6 py-3.5 hover:brightness-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                    TELEGRAM
                  </button>
                  {tgCopied && (
                    <p className="text-center font-label-bold uppercase tracking-widest text-[#229ED9] text-[11px] mt-1.5">
                      СООБЩЕНИЕ СКОПИРОВАНО — ВСТАВЬТЕ В ЧАТ
                    </p>
                  )}
                </div>

                {orderError && (
                  <p className="text-center font-label-bold uppercase tracking-widest text-error text-[11px]">
                    {orderError}
                  </p>
                )}

                <p className="font-label-bold text-white/35 text-[11px] uppercase tracking-widest leading-relaxed">
                  Мы свяжемся для подтверждения заказа и оплаты.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
