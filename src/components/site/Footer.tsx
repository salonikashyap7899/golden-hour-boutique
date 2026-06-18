import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="mt-32 bg-foreground text-background">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-20 grid gap-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="text-display text-3xl tracking-[0.18em]">MAISON</div>
          <p className="mt-5 text-sm text-background/70 max-w-xs leading-relaxed">
            An editorial house for considered objects — silk, cashmere, leather, gold.
            Shipped from our atelier in Mumbai.
          </p>
          <form className="mt-8 relative max-w-sm">
            <input
              type="email"
              placeholder="Your email"
              className="w-full bg-transparent border-b border-background/30 focus:border-accent outline-none text-sm py-3 placeholder:text-background/40 transition-colors"
            />
            <button type="button" className="absolute right-0 top-1/2 -translate-y-1/2 text-eyebrow text-accent">
              Subscribe
            </button>
          </form>
        </div>
        {[
          { h: "Shop", items: [["Women", "women"], ["Men", "men"], ["Accessories", "accessories"], ["All", null]] as const },
          { h: "House", items: [["Atelier", null], ["Journal", null], ["Sustainability", null], ["Press", null]] as const },
          { h: "Care", items: [["Contact", null], ["Shipping", null], ["Returns", null], ["FAQ", null]] as const },
        ].map((col) => (
          <div key={col.h}>
            <div className="text-eyebrow text-background/60">{col.h}</div>
            <ul className="mt-5 space-y-3 text-sm">
              {col.items.map(([label, cat]) => (
                <li key={label}>
                  {cat ? (
                    <Link to="/shop" search={{ category: cat }} className="link-underline">{label}</Link>
                  ) : (
                    <span className="text-background/70">{label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-background/10">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-6 flex flex-col md:flex-row items-center justify-between text-xs text-background/50">
          <div>© {new Date().getFullYear()} Maison Atelier. All rights reserved.</div>
          <div className="mt-3 md:mt-0 flex gap-6">
            <span>Privacy</span><span>Terms</span><span>Cookies</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
