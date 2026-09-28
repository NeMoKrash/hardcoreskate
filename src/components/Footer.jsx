import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="w-full px-4 sm:px-8 py-14 sm:py-20 flex flex-col items-center justify-center gap-6 text-center bg-ink text-white">
      <div
        data-text="HARDCORE_CO"
        className="glitch-text font-headline-md text-lg sm:text-xl font-bold text-white uppercase tracking-tight"
      >
        HARDCORE_CO
      </div>

      <nav className="font-label-bold uppercase tracking-widest text-xs text-white/45 flex flex-wrap justify-center items-center gap-x-1">
        <Link to="/#drop" className="hover:text-white transition-colors px-1">МАГАЗИН</Link>
        <span>,</span>
        <a
          href="https://www.instagram.com/insult_skate_team__?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors px-1"
        >
          КОМАНДА
        </a>
        <span>,</span>
        <Link to="/#contact" className="hover:text-white transition-colors px-1">КОНТАКТ</Link>
        <span>,</span>
        <a
          href="https://www.instagram.com/hardcore_skate.co/?utm_source=ig_web_button_share_sheet"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors px-1"
        >
          INSTAGRAM
        </a>
      </nav>

      <div className="font-label-bold uppercase tracking-widest text-white/25 text-[11px] border-t border-white/10 pt-6 w-full max-w-3xl flex flex-col sm:flex-row justify-between items-center gap-3">
        <span>©2026 HARDCORESKATE. ВСЕ ПРАВА ЗАЩИЩЕНЫ.</span>
        <span className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-base">public</span>
          КАЗАХСТАН
        </span>
      </div>
      <Link to="/admin" className="text-white/10 hover:text-white/35 font-label-bold text-[10px] uppercase tracking-widest transition-colors mt-2">
        admin
      </Link>
    </footer>
  )
}
