import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'
import { SIZES, STATUS_LABELS, getDisplayStatus, isSizeAvailable, formatPrice, coverImage } from '../lib/products'

export default function ProductPage({ addToCart, products, loading }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const product = products.find((p) => String(p.id) === String(id))

  if (!product) {
    return (
      <div className="bg-background text-on-background antialiased min-h-screen flex flex-col">
        <main className="flex-grow pt-[50px] md:pt-[62px] px-4 sm:px-6 md:px-margin max-w-[1200px] mx-auto w-full flex flex-col items-center justify-center text-center gap-6 py-24">
          {loading ? (
            <p className="font-body-lg text-white/40">Загружаем...</p>
          ) : (
            <>
              <p className="font-headline-lg uppercase text-primary">Товар не найден</p>
              <button
                onClick={() => navigate('/')}
                className="font-label-bold text-black bg-white px-6 py-3.5 border border-white hover:bg-transparent hover:text-white transition-colors uppercase tracking-widest"
              >
                НАЗАД В МАГАЗИН
              </button>
            </>
          )}
        </main>
        <Footer />
      </div>
    )
  }

  // Keyed by id so navigating between products remounts this view and resets
  // its local selection state, instead of syncing it back with an effect.
  return <ProductView key={id} product={product} addToCart={addToCart} navigate={navigate} />
}

function ProductView({ product, addToCart, navigate }) {
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [added, setAdded] = useState(false)

  useEffect(() => { window.scrollTo(0, 0) }, [])

  const status = getDisplayStatus(product)
  const soldOut = status === 'sold_out'
  const comingSoon = status === 'coming_soon'
  const locked = soldOut || comingSoon
  const images = product.images && product.images.length > 0 ? product.images : [null]
  const activeImage = images[selectedImage] || images[0]

  function handleAdd() {
    addToCart({ id: product.id, name: product.name, price: product.price, size: selectedSize, image: coverImage(product) })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="bg-background text-on-background antialiased min-h-screen flex flex-col">
      <main className="flex-grow pt-[50px] md:pt-[62px] pb-8 md:pb-margin px-4 sm:px-6 md:px-margin max-w-[1800px] mx-auto w-full">
        <button
          onClick={() => navigate(-1)}
          className="mt-6 mb-6 flex items-center gap-2 font-label-bold uppercase tracking-widest text-white/60 hover:text-accent transition-colors"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          НАЗАД В МАГАЗИН
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-gutter animate-fade-up">
          {/* Фото */}
          <div className="md:col-span-5 flex flex-col gap-3">
            <div className="w-full aspect-square bg-[#0e0e0e] border border-white/10 relative overflow-hidden max-h-[480px]">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={`${product.name} дека`}
                  className={`w-full h-full object-contain p-6 transition-transform duration-300 hover:scale-[1.02] ${locked ? 'opacity-35' : ''}`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-headline-md text-white/15 uppercase">HARDCORE_CO</div>
              )}
              {soldOut ? (
                <div className="absolute top-4 left-4 bg-black/80 text-white/70 font-label-bold px-3 py-1.5 border border-white/20 uppercase text-xs tracking-widest">
                  SOLD OUT
                </div>
              ) : comingSoon ? (
                <div className="absolute top-4 left-4 bg-black/80 text-white/70 font-label-bold px-3 py-1.5 border border-white/20 uppercase text-xs tracking-widest">
                  СКОРО
                </div>
              ) : (
                <div className="absolute top-4 left-4 font-label-bold text-white/40 uppercase text-xs tracking-widest">
                  НОВЫЙ ДРОП
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((img, i) => (
                  <button
                    key={img || i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 border bg-[#0e0e0e] overflow-hidden transition-colors ${selectedImage === i ? 'border-accent' : 'border-white/15 hover:border-white/35'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain p-1.5" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Детали */}
          <div className="md:col-span-7 flex flex-col gap-6 md:sticky md:top-[70px] h-fit">
            <div className="flex flex-col gap-3">
              <h1 className="font-headline-xl uppercase break-words border-b border-white/15 pb-4 leading-none">
                {product.name}
              </h1>
              <div className="flex justify-between items-end pt-1">
                <span className="font-headline-lg uppercase">{formatPrice(product.price)}₸</span>
                <span className={`font-label-bold uppercase tracking-widest ${comingSoon ? 'text-accent-glow' : 'text-white/45'}`}>
                  {STATUS_LABELS[status]}
                </span>
              </div>
            </div>

            {product.spec && (
              <div className="flex flex-wrap gap-2">
                <span className="font-label-bold text-white/50 uppercase tracking-widest border border-white/15 px-3 py-1.5 text-xs">
                  {product.spec}
                </span>
              </div>
            )}

            {!comingSoon && (
              <div className="flex flex-col gap-2">
                <span className="font-label-bold uppercase tracking-widest text-white/45 text-xs">
                  РАЗМЕР {selectedSize && <span className="text-primary ml-2">{selectedSize}</span>}
                </span>
                <div className="flex gap-2 flex-wrap">
                  {SIZES.map(size => {
                    const available = isSizeAvailable(product, size)
                    return (
                      <button
                        key={size}
                        onClick={() => available && setSelectedSize(size)}
                        disabled={!available}
                        className={`px-4 py-2 border font-label-bold uppercase tracking-widest transition-colors ${!available
                          ? 'border-white/10 text-white/20 line-through cursor-not-allowed'
                          : selectedSize === size
                            ? 'bg-accent text-white border-accent'
                            : 'bg-transparent text-primary border-white/25 hover:border-accent/60'
                          }`}
                      >
                        {size}
                        {!available && <span className="block text-[9px] font-label-bold uppercase text-white/30 leading-none mt-0.5">sold out</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {product.description && (
              <p className="font-body-lg text-white/55 leading-relaxed">
                {product.description}
              </p>
            )}

            {comingSoon && (
              <div className="border border-accent/40 px-4 py-3 font-body-md text-white/60">
                скоро в продаже — следите за дропом
              </div>
            )}

            {!locked && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleAdd}
                  disabled={!selectedSize}
                  className={`w-full border py-4 sm:py-5 flex items-center justify-center gap-3 transition-colors duration-150 ${!selectedSize
                    ? 'bg-transparent text-primary/30 border-white/15 cursor-not-allowed'
                    : added
                      ? 'bg-white text-black border-white'
                      : 'bg-accent text-white border-accent hover:bg-transparent hover:text-accent'
                    }`}
                >
                  <span className="font-headline-md uppercase tracking-[0.1em]">
                    {added ? 'ДОБАВЛЕНО' : 'В КОРЗИНУ'}
                  </span>
                  <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {added ? 'check_circle' : 'add_shopping_cart'}
                  </span>
                </button>
                {!selectedSize && (
                  <p className="font-label-bold text-white/40 uppercase tracking-widest text-center text-[11px]">
                    Выберите размер выше
                  </p>
                )}
                {added && (
                  <button
                    onClick={() => navigate('/cart')}
                    className="w-full border border-white/25 text-white/80 font-label-bold uppercase tracking-widest py-3 hover:bg-white hover:text-black hover:border-white transition-colors text-center"
                  >
                    ПЕРЕЙТИ В КОРЗИНУ →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
