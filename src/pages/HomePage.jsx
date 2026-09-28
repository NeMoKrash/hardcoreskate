import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'
import StickerBadge from '../components/StickerBadge'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { coverImage } from '../lib/products'

// Fanned stack: offset/rotate/stack-order for up to 3 hero decks.
const STACK_STYLES = [
  '-translate-x-10 sm:-translate-x-16 md:-translate-x-24 -rotate-12 z-10',
  'rotate-2 z-30',
  'translate-x-10 sm:translate-x-16 md:translate-x-24 rotate-12 z-20',
]

const SOCIALS = [
  { name: 'INSTAGRAM', url: 'https://www.instagram.com/hardcore_skate.co/?utm_source=ig_web_button_share_sheet' },
]

// The wordmark texture tiled at a fixed pixel size (not object-cover, which
// stretched it to fill each section and blew the letters up huge). `mono`
// desaturates it for the darker product sections; the hero keeps it red.
function MonogramTexture({ opacity = 0.05, mono = true }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${mono ? 'grayscale' : ''}`}
      style={{
        backgroundImage: 'url(/image.png)',
        backgroundRepeat: 'repeat',
        backgroundSize: '1100px auto',
        opacity,
      }}
    />
  )
}

// A couple of soft blurred glow spots per section, like scattered LED accent
// lighting — echoes the hero's glow-edge but at varied spots so sections
// don't all feel lit the same way. Fixed (not JS-random) so it's stable
// across re-renders/hydration, just hand-picked to look varied.
const GLOW_LAYOUTS = [
  [
    { top: '-12%', left: '12%', size: 420, color: 'rgba(255,45,71,0.22)' },
    { bottom: '-18%', right: '8%', size: 360, color: 'rgba(255,255,255,0.06)' },
  ],
  [
    { top: '8%', right: '6%', size: 380, color: 'rgba(255,45,71,0.18)' },
    { bottom: '-14%', left: '18%', size: 400, color: 'rgba(255,255,255,0.05)' },
  ],
  [
    { top: '-10%', right: '28%', size: 440, color: 'rgba(255,45,71,0.16)' },
    { bottom: '2%', left: '-6%', size: 320, color: 'rgba(255,255,255,0.06)' },
  ],
]

function AmbientGlow({ variant = 0 }) {
  const spots = GLOW_LAYOUTS[variant % GLOW_LAYOUTS.length]
  return (
    <>
      {spots.map((spot, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            top: spot.top,
            bottom: spot.bottom,
            left: spot.left,
            right: spot.right,
            width: spot.size,
            height: spot.size,
            background: `radial-gradient(circle, ${spot.color} 0%, transparent 70%)`,
            filter: 'blur(20px)',
          }}
        />
      ))}
    </>
  )
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white/5 h-[420px] sm:h-[480px] animate-pulse" />
      ))}
    </div>
  )
}

export default function HomePage({ products, loading }) {
  const [dropRef, dropVisible] = useScrollReveal()
  const [archiveRef, archiveVisible] = useScrollReveal()
  const [aboutTextRef, aboutTextVisible] = useScrollReveal()
  const [aboutImgRef, aboutImgVisible] = useScrollReveal()
  const [contactRef, contactVisible] = useScrollReveal()

  const currentProducts = products.filter((p) => !p.archived)
  const archivedProducts = products.filter((p) => p.archived)

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="bg-background text-on-background font-body-md antialiased pt-[50px] md:pt-[62px] overflow-x-hidden">

      {/* Герой — на главном экране видео дропа */}
      <header className="relative w-full overflow-hidden bg-ink flex flex-col items-center justify-center px-4 py-16 sm:py-20"
        style={{ minHeight: 'clamp(560px, 92vh, 940px)' }}>
        <div className="absolute inset-0 z-0">
          <MonogramTexture opacity={0.18} mono={false} />
          <div className="absolute inset-0 bg-ink/60" />
          <div className="glow-edge" />
        </div>

        <div className="absolute top-4 left-4 z-10">
          <div className="bg-black/70 text-white/70 px-3 py-1 border border-white/20 inline-block font-label-bold uppercase tracking-widest text-[11px]">
            СЕЗОН // 02
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-3xl">
          <h1
            data-text="HARDCORE_CO"
            className="glitch-text font-headline-xl text-white uppercase leading-[0.95] tracking-tight mb-8 sm:mb-10"
          >
            HARDCORE_CO
          </h1>

          <div className="relative w-full flex justify-center items-center h-[220px] sm:h-[320px] md:h-[380px]">
            {currentProducts.slice(0, 3).map((product, i) => {
              const img = coverImage(product)
              if (!img) return null
              return (
                <img
                  key={product.id}
                  src={img}
                  alt={product.name}
                  className={`absolute h-full w-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.6)] ${STACK_STYLES[i % STACK_STYLES.length]}`}
                />
              )
            })}
          </div>

          <p className="font-body-md text-white/45 mt-8 mb-6 max-w-md">
            Ограниченная партия. Смотреть сейчас!
          </p>

          <button
            onClick={() => scrollTo('drop')}
            className="inline-flex items-center justify-center font-label-bold text-black bg-white px-6 py-3.5 border border-white hover:bg-transparent hover:text-white transition-colors duration-150 uppercase tracking-widest"
          >
            СМОТРЕТЬ НОВЫЙ ДРОП
          </button>
        </div>

        <StickerBadge className="absolute bottom-5 right-5 sm:bottom-8 sm:right-8 z-10" />
      </header>

      {/* Дроп */}
      <section ref={dropRef} className={`reveal ${dropVisible ? 'is-visible' : ''} relative py-14 sm:py-24 px-4 sm:px-8 md:px-margin border-b border-white/10 bg-surface overflow-hidden`} id="drop">
        <MonogramTexture opacity={0.06} />
        <AmbientGlow variant={0} />
        <div className="relative max-w-[1440px] mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 sm:mb-14 gap-2">
            <div>
              <h2 className="font-headline-lg text-primary uppercase leading-none tracking-tight">Завоз свежака</h2>
            </div>
          </div>

          {loading && products.length === 0 ? (
            <ProductGridSkeleton />
          ) : currentProducts.length === 0 ? (
            <div className="border border-white/10 p-10 text-center">
              <p className="font-body-lg text-white/40">Товары скоро появятся здесь</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 sm:gap-x-10 sm:gap-y-20">
              {currentProducts.map((product, i) => (
                <div key={product.id} className={`animate-fade-up delay-${Math.min(i + 1, 5)}`}>
                  <ProductCard product={product} index={i} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Старый дроп — распродан, оставлен только для вида */}
      {archivedProducts.length > 0 && (
        <section ref={archiveRef} className={`reveal ${archiveVisible ? 'is-visible' : ''} relative py-14 sm:py-24 px-4 sm:px-8 md:px-margin border-b border-white/10 bg-ink overflow-hidden`} id="archive">
          <MonogramTexture opacity={0.06} />
          <AmbientGlow variant={1} />
          <div className="relative max-w-[1440px] mx-auto">
            <div className="mb-10 sm:mb-14">
              <h2 className="font-headline-lg text-white/50 uppercase leading-none tracking-tight">Предыдущий дроп</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 sm:gap-x-10 sm:gap-y-20 opacity-70">
              {archivedProducts.map((product, i) => (
                <div key={product.id} className={`animate-fade-up delay-${Math.min(i + 1, 5)}`}>
                  <ProductCard product={product} index={i} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* О нас */}
      <section className="relative py-16 sm:py-28 px-4 sm:px-8 md:px-margin border-b border-white/10 bg-surface-container-low overflow-hidden" id="brand">
        <MonogramTexture opacity={0.1} mono={false} />
        <AmbientGlow variant={2} />
        <div className="relative max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16 items-stretch">
          <div ref={aboutTextRef} className={`reveal reveal-left ${aboutTextVisible ? 'is-visible' : ''} lg:col-span-6 flex flex-col justify-center`}>
            <div className="font-label-bold uppercase tracking-widest text-white/35 mb-4 text-xs">
              О нас
            </div>
            <h2 className="font-headline-lg text-primary uppercase mb-5 leading-tight tracking-tight">
              Сделано скейтерами<br />для скейтеров
            </h2>
            <p className="font-body-lg text-white/55 mb-8 leading-relaxed max-w-xl">
              HARDCORE_CO — казахстанский скейт-бренд. Свежайшие деки, небольшие
              тиражи. Делаем то, на чём катаем сами.
            </p>
            <div className="flex gap-8 font-label-bold uppercase tracking-widest text-xs text-white/40">
              <div className="flex flex-col gap-1">
                <span className="text-accent text-lg font-headline-md">02</span>
                Дроп
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-accent text-lg font-headline-md">KZ</span>
                Алматы
              </div>
            </div>
          </div>

          <div ref={aboutImgRef} className={`reveal reveal-right ${aboutImgVisible ? 'is-visible' : ''} lg:col-span-5 lg:col-start-8 relative`}>
            <div className="relative border border-white/10">
              <video
                src="/almaty.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover min-h-[220px] sm:min-h-[380px]"
              />
              <div className="absolute inset-0 vignette-edge" />
              <div className="absolute bottom-3 left-3 bg-black/80 text-white/70 px-3 py-2 border border-white/15 font-label-bold uppercase text-[10px] tracking-widest">
                АЛМАТЫ, КАЗАХСТАН
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Контакт */}
      <section ref={contactRef} className={`reveal ${contactVisible ? 'is-visible' : ''} py-14 sm:py-24 px-4 sm:px-8 md:px-margin bg-ink border-b border-white/10`} id="contact">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-8">
          <div className="md:col-span-12 mb-2 sm:mb-6">
            <h2 className="font-headline-lg text-primary uppercase tracking-tight">Написать нам</h2>
          </div>

          <div className="md:col-span-7 border border-white/10 p-5 sm:p-10 flex flex-col justify-between">
            <form className="flex flex-col gap-6 h-full">
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="font-label-bold text-white/50 uppercase tracking-widest text-xs">
                  Почта
                </label>
                <input id="email" type="email" placeholder="куда ответить?"
                  className="bg-transparent border-b border-white/20 focus:border-accent text-primary font-body-lg px-1 py-3 placeholder-white/25 transition-colors outline-none" />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <label htmlFor="message" className="font-label-bold text-white/50 uppercase tracking-widest text-xs">
                  Сообщение
                </label>
                <textarea id="message" placeholder="что произошло, чем можем помочь?"
                  className="bg-transparent border-b border-white/20 focus:border-accent text-primary font-body-lg px-1 py-3 placeholder-white/25 transition-colors outline-none h-full min-h-[120px] resize-none" />
              </div>
              <button type="button"
                className="font-label-bold text-black bg-white px-6 py-3.5 border border-white hover:bg-accent hover:border-accent hover:text-white transition-colors uppercase tracking-widest self-start">
                ОТПРАВИТЬ
              </button>
            </form>
          </div>

          <div className="md:col-span-5 flex flex-col">
            <div className="border border-white/10 p-5 sm:p-10 flex-1 text-white">
              <h3 className="font-headline-md text-primary uppercase mb-5 tracking-tight">
                Соцсети
              </h3>
              <ul className="flex flex-col gap-1 font-label-bold uppercase tracking-widest text-sm">
                {SOCIALS.map(({ name, url }) => (
                  <li key={name}>
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="flex justify-between items-center hover:bg-white hover:text-black p-3 sm:p-4 border border-transparent hover:border-white transition-colors group">
                      <span>{name}</span>
                      <span className="material-symbols-outlined opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
