import { Link } from 'react-router-dom'
import { SIZES, getDisplayStatus, formatPrice, coverImage } from '../lib/products'

const ROTATIONS = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2']

export default function ProductCard({ product, index = 0 }) {
  const status = getDisplayStatus(product)
  const soldOut = status === 'sold_out'
  const comingSoon = status === 'coming_soon'
  const locked = soldOut || comingSoon
  const image = coverImage(product)
  const rotation = ROTATIONS[index % ROTATIONS.length]

  return (
    <article className="group relative flex flex-col">
      <Link to={`/product/${product.id}`} className="block">
        <div
          className={`relative bg-[#efece4] p-3 pb-7 shadow-[0_10px_28px_rgba(0,0,0,0.55)] ${rotation} group-hover:rotate-0 transition-transform duration-300`}
        >
          <div className="tape -top-2.5 left-1/2 -translate-x-1/2 -rotate-1" />
          <div className="relative aspect-[3/4] overflow-hidden bg-white flex items-center justify-center">
            {image ? (
              <img
                src={image}
                alt={product.name}
                className={`h-full w-auto object-contain transition-transform duration-500 ${soldOut ? 'opacity-40' : 'group-hover:scale-[1.04]'}`}
              />
            ) : (
              <div className="font-headline-md text-black/15 uppercase">HARDCORE_CO</div>
            )}
            {soldOut && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-[3px] border-accent text-accent font-headline-md uppercase px-4 py-1.5 -rotate-12 tracking-widest">
                  SOLD OUT
                </div>
              </div>
            )}
            {comingSoon && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-[3px] border-black/70 text-black/70 font-headline-md uppercase px-4 py-1.5 -rotate-12 tracking-widest">
                  СКОРО
                </div>
              </div>
            )}
          </div>
          <div className="absolute -bottom-3 left-3 bg-black text-white/80 font-label-bold uppercase text-[9px] tracking-widest px-2 py-1">
            {String(index + 1).padStart(2, '0')}
          </div>
        </div>
      </Link>

      <div className="pt-6 flex flex-col gap-2 flex-1">
        <div>
          <h3 className="font-headline-md text-primary uppercase leading-tight">{product.name}</h3>
          <p className="font-label-bold text-white/35 uppercase tracking-widest text-[11px] mt-0.5">{product.spec}</p>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {SIZES.map(size => {
            const qty = Number(product.sizes?.[size] ?? 0)
            const empty = locked || qty <= 0
            return (
              <span key={size} className={`font-label-bold px-1.5 py-0.5 uppercase text-[10px] tracking-widest border ${empty ? 'border-white/10 text-white/20 line-through' : 'border-white/20 text-white/55'
                }`}>
                {size}
              </span>
            )
          })}
        </div>

        <div className="flex justify-between items-center mt-auto pt-2">
          <span className={`font-headline-md ${locked ? 'text-primary/35' : 'text-primary'}`}>
            {formatPrice(product.price)}₸
          </span>
          {soldOut ? (
            <span className="font-label-bold uppercase text-white/25 text-[10px] tracking-widest">SOLD OUT</span>
          ) : comingSoon ? (
            <span className="font-label-bold uppercase text-accent-glow text-[10px] tracking-widest">СКОРО</span>
          ) : (
            <Link
              to={`/product/${product.id}`}
              className="inline-flex items-center justify-center px-3 py-1.5 border border-white/25 text-white/80 font-label-bold uppercase text-[10px] tracking-widest hover:bg-white hover:text-black hover:border-white transition-colors"
            >
              ВЫБРАТЬ РАЗМЕР
            </Link>
          )}
        </div>
      </div>
    </article>
  )
}
