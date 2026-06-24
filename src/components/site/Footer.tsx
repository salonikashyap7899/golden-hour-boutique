import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-16 bg-midnight border-t border-white/[0.06]">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-20 grid gap-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="text-display text-3xl tracking-[0.20em] text-foreground">MAISON</div>
          <p className="mt-5 text-sm text-foreground/40 max-w-xs leading-[1.85]">
            An editorial house for considered objects — silk, cashmere, leather, gold.
            Shipped from our atelier in Mumbai.
          </p>
          <form className="mt-9 relative max-w-sm">
            <input
              type="email"
              placeholder="Your email"
              className="w-full bg-transparent border-b border-white/15 focus:border-accent outline-none text-sm py-3 placeholder:text-foreground/25 transition-colors text-foreground"
            />
            <button type="button" className="absolute right-0 top-1/2 -translate-y-1/2 text-eyebrow text-accent hover:text-gold-soft transition-colors">
              Subscribe
            </button>
          </form>
        </div>
        {[
          { h: "Shop",  items: [["Women","women"],["Men","men"],["Accessories","accessories"],["All",null]] as const },
          { h: "House", items: [["Atelier",null],["Journal",null],["Sustainability",null],["Press",null]] as const },
          { h: "Care",  items: [["Contact",null],["Shipping",null],["Returns",null],["FAQ",null]] as const },
        ].map((col) => (
          <div key={col.h}>
            <div className="text-eyebrow text-foreground/30 mb-6">{col.h}</div>
            <ul className="gsap-stagger-list space-y-3 text-sm">
              {col.items.map(([label, cat]) => (
                <li key={label} className="gsap-list-item">
                  {cat ? (
                    <Link to="/shop" search={{ category: cat }} className="link-underline text-foreground/50 hover:text-accent transition-colors duration-300">{label}</Link>
                  ) : (
                    <span className="text-foreground/35 hover:text-foreground/60 cursor-default transition-colors duration-300">{label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/[0.06]">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-6 flex flex-col md:flex-row items-center justify-between text-[0.68rem] text-foreground/25 tracking-[0.2em] uppercase">
          <div>© {new Date().getFullYear()} Maison Atelier. All rights reserved.</div>
          <div className="mt-3 md:mt-0 flex gap-8">
            <span className="hover:text-foreground/50 cursor-default transition-colors">Privacy</span>
            <span className="hover:text-foreground/50 cursor-default transition-colors">Terms</span>
            <span className="hover:text-foreground/50 cursor-default transition-colors">Cookies</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
