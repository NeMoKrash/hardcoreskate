export default function StickerBadge({ text = 'HARDCORE_CO • KAZAKHSTAN • ', id = 'sticker-path', className = '' }) {
  return (
    <div className={`w-24 h-24 sm:w-28 sm:h-28 ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full animate-spin-slow">
        <defs>
          <path id={id} d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
        </defs>
        <circle cx="50" cy="50" r="48" fill="black" stroke="white" strokeOpacity="0.35" strokeWidth="1" />
        <text fill="white" fontSize="8" letterSpacing="1.5" fontWeight="700">
          <textPath href={`#${id}`} startOffset="0%">{text}</textPath>
        </text>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="material-symbols-outlined text-accent text-2xl sm:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          skateboarding
        </span>
      </div>
    </div>
  )
}
