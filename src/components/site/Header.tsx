import { Link } from "@tanstack/react-router";
import { Search, Heart, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";

export function Header() {
  const { count } = useCart();
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b hairline">
      <div className="hidden md:flex justify-center text-eyebrow py-2 text-muted-foreground">
        Complimentary shipping on orders above ₹4,999 · Atelier collection — new arrivals
      </div>
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10 flex items-center justify-between h-16 md:h-20">
        <nav className="hidden md:flex items-center gap-8 text-[0.78rem] tracking-[0.22em] uppercase">
          <Link to="/shop" search={{ category: "women" }} className="link-underline">Women</Link>
          <Link to="/shop" search={{ category: "men" }} className="link-underline">Men</Link>
          <Link to="/shop" search={{ category: "accessories" }} className="link-underline">Accessories</Link>
          <Link to="/shop" className="link-underline">All</Link>
        </nav>

        <Link to="/" className="absolute left-1/2 -translate-x-1/2">
          <span className="text-display text-2xl md:text-[1.75rem] tracking-[0.18em]">MAISON</span>
        </Link>

        <div className="flex items-center gap-5 text-foreground">
          <button aria-label="Search" className="hover:text-accent transition-colors"><Search className="h-[18px] w-[18px]" /></button>
          <Link to={user ? "/account" : "/auth"} aria-label="Account" className="hidden md:inline-flex hover:text-accent transition-colors">
            <User className="h-[18px] w-[18px]" />
          </Link>
          <Link to={user ? "/account" : "/auth"} aria-label="Wishlist" className="hidden md:inline-flex hover:text-accent transition-colors">
            <Heart className="h-[18px] w-[18px]" />
          </Link>
          <Link to="/cart" aria-label="Cart" className="relative hover:text-accent transition-colors">
            <ShoppingBag className="h-[18px] w-[18px]" />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-foreground text-background text-[10px] font-medium">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
