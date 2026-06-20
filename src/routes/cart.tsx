import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, X, ArrowRight } from "lucide-react";
import { useCart, cartKey } from "@/lib/cart";
import { formatINR } from "@/lib/products";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your bag — Maison" },
      { name: "description", content: "Review the pieces in your bag." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, subtotal, count } = useCart();
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);

  const shipping = subtotal >= 4999 || subtotal === 0 ? 0 : 250;
  const total = Math.max(0, subtotal - discount + shipping);

  const applyCoupon = () => {
    if (coupon.toUpperCase() === "MAISON10") { setDiscount(Math.round(subtotal * 0.1)); setCouponMsg("MAISON10 applied · 10% off"); }
    else { setDiscount(0); setCouponMsg("Try MAISON10"); }
  };

  if (count === 0) {
    return (
      <main className="mx-auto max-w-md text-center py-32 px-6">
        <div className="text-eyebrow text-accent">Your bag</div>
        <h1 className="text-display text-5xl mt-4">Empty for now</h1>
        <p className="mt-4 text-sm text-muted-foreground">Discover the season's new arrivals.</p>
        <Link to="/shop" className="btn-gold mt-8">Shop the collection <ArrowRight className="h-4 w-4" /></Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-12 pb-24">
      <div className="border-b hairline pb-8 mb-10">
        <div className="text-eyebrow text-accent">Your bag</div>
        <h1 className="text-display text-5xl mt-3">{count} {count === 1 ? "piece" : "pieces"}</h1>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-12">
        {/* Items */}
        <div className="space-y-8">
          {items.map((it) => {
            const k = cartKey(it);
            return (
              <div key={k} className="grid grid-cols-[110px_1fr_auto] gap-6 pb-8 border-b hairline">
                <Link to="/product/$slug" params={{ slug: it.slug }} className="aspect-[3/4] overflow-hidden bg-secondary">
                  <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                </Link>
                <div className="min-w-0">
                  <div className="text-eyebrow text-muted-foreground">{it.brand}</div>
                  <Link to="/product/$slug" params={{ slug: it.slug }} className="text-[15px] font-serif link-underline">{it.name}</Link>
                  <div className="text-xs text-muted-foreground mt-2">Size {it.size} · {it.color}</div>
                  <div className="mt-4 flex items-center gap-2 border hairline w-fit">
                    <button onClick={() => setQty(k, it.qty - 1)} className="h-9 w-9 grid place-items-center hover:bg-secondary"><Minus className="h-3 w-3" /></button>
                    <div className="w-8 text-center text-sm">{it.qty}</div>
                    <button onClick={() => setQty(k, it.qty + 1)} className="h-9 w-9 grid place-items-center hover:bg-secondary"><Plus className="h-3 w-3" /></button>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end justify-between">
                  <button onClick={() => remove(k)} aria-label="Remove" className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                  <div className="text-[15px]">{formatINR(it.price * it.qty)}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-28 lg:self-start bg-secondary p-8">
          <h2 className="text-display text-2xl mb-6">Order summary</h2>

          <div className="space-y-4">
            <div>
              <div className="text-eyebrow mb-2">Promo code</div>
              <div className="flex gap-2">
                <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Enter code"
                  className="flex-1 bg-background border hairline px-4 py-3 text-sm focus:outline-none focus:border-foreground" />
                <button onClick={applyCoupon} className="btn-outline-dark !px-4 !py-3">Apply</button>
              </div>
              {couponMsg && <div className="text-xs text-muted-foreground mt-2">{couponMsg}</div>}
            </div>

            <div className="border-t hairline pt-4 space-y-3 text-sm">
              <Row label="Subtotal" value={formatINR(subtotal)} />
              {discount > 0 && <Row label="Discount" value={`− ${formatINR(discount)}`} accent />}
              <Row label="Shipping" value={shipping === 0 ? "Complimentary" : formatINR(shipping)} />
            </div>
            <div className="border-t hairline pt-4">
              <Row label={<span className="text-display text-lg">Total</span>} value={<span className="text-display text-lg">{formatINR(total)}</span>} />
              <div className="text-xs text-muted-foreground mt-2">Inclusive of all taxes</div>
            </div>

            <Link to="/checkout" className="btn-gold w-full mt-4">Proceed to checkout <ArrowRight className="h-4 w-4" /></Link>
            <div className="text-[11px] text-center text-muted-foreground mt-3">Secured by Razorpay · OTP sign-in on next step</div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Row({ label, value, accent }: { label: React.ReactNode; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-muted-foreground">{label}</div>
      <div className={accent ? "text-accent" : ""}>{value}</div>
    </div>
  );
}
