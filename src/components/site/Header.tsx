import { Link, useNavigate } from "@tanstack/react-router";
import { Search, Heart, ShoppingBag, User, X, Sparkles, Store } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";

export function Header() {
  const { count } = useCart();
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const nav = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-40 bg-midnight/80 backdrop-blur-xl border-b border-white/[0.07]">
        <div className="hidden md:flex justify-center text-eyebrow py-2 text-accent/70 tracking-[0.3em]">
          Complimentary shipping on orders above ₹4,999 · Atelier collection — new arrivals
        </div>
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 flex items-center justify-between h-16 md:h-20 relative">
          <nav className="hidden md:flex items-center gap-8 text-[0.72rem] tracking-[0.26em] uppercase text-foreground/70">
            <Link to="/shop" search={{ category: "women" }} className="link-underline hover:text-accent transition-colors duration-300">Women</Link>
            <Link to="/shop" search={{ category: "men" }} className="link-underline hover:text-accent transition-colors duration-300">Men</Link>
            <Link to="/shop" search={{ category: "accessories" }} className="link-underline hover:text-accent transition-colors duration-300">Accessories</Link>
            <Link to="/shop" className="link-underline hover:text-accent transition-colors duration-300">All</Link>
            <Link to="/plans" className="link-underline text-accent">Sell</Link>
          </nav>

          <Link to="/" className="absolute left-1/2 -translate-x-1/2 magnetic" data-strength="0.2">
            <span className="text-display text-2xl md:text-[1.75rem] tracking-[0.22em] text-foreground">MAISON</span>
          </Link>

          <div className="flex items-center gap-5 text-foreground/70">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="hover:text-accent transition-colors duration-300"
            >
              <Search className="h-[17px] w-[17px]" />
            </button>
            <Link to={user ? "/seller" : "/sell"} aria-label="Seller" className="hidden md:inline-flex hover:text-accent transition-colors duration-300">
              <Store className="h-[17px] w-[17px]" />
            </Link>
            <Link to={user ? "/account" : "/auth"} aria-label="Account" className="hidden md:inline-flex hover:text-accent transition-colors duration-300">
              <User className="h-[17px] w-[17px]" />
            </Link>
            <Link to={user ? "/account" : "/auth"} aria-label="Wishlist" className="hidden md:inline-flex hover:text-accent transition-colors duration-300">
              <Heart className="h-[17px] w-[17px]" />
            </Link>
            <Link to="/cart" aria-label="Cart" className="relative hover:text-accent transition-colors duration-300">
              <ShoppingBag className="h-[17px] w-[17px]" />
              {count > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-accent text-midnight text-[9px] font-semibold">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {searchOpen && (
        <div
          className="fixed inset-0 z-50 backdrop-blur-2xl animate-fade-up"
          style={{ animationDuration: ".22s", background: "oklch(0.095 0.004 55 / 0.97)" }}
        >
          <button onClick={() => setSearchOpen(false)} className="absolute top-6 right-6 hover:text-accent transition-colors" aria-label="Close">
            <X className="h-6 w-6" />
          </button>
          <div className="mx-auto max-w-3xl px-6 pt-32">
            <div className="text-eyebrow text-accent flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" /> AI search
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!q.trim()) return;
                setSearchOpen(false);
                nav({ to: "/search", search: { q } });
              }}
              className="mt-6 flex gap-3 border-b border-white/20 pb-4"
            >
              <Search className="h-6 w-6 self-end mb-1 text-foreground/40" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder='Search "silk dress under 15000"…'
                className="flex-1 bg-transparent text-2xl md:text-3xl outline-none placeholder:text-foreground/30"
              />
            </form>
            <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              {["silk dress under 10000","leather bag","gold earrings","cashmere coat","evening gown","office accessories"].map((s) => (
                <button
                  key={s}
                  onClick={() => { setSearchOpen(false); nav({ to: "/search", search: { q: s } }); }}
                  className="text-left p-3 border border-white/10 hover:border-accent hover:text-accent transition-all duration-300 text-foreground/60"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
