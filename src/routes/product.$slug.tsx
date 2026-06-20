import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, Minus, Plus, Star, Truck, RotateCcw, Shield, Loader2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { findProduct, formatINR, PRODUCTS, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { ProductCard } from "@/components/site/ProductCard";
import { useAuth } from "@/lib/auth";
import { toggleWishlist, isInWishlist } from "@/lib/api/wishlist.functions";
import { listReviewsForSlug, submitReview } from "@/lib/api/reviews.functions";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const product = findProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    return {
      meta: [
        { title: p ? `${p.name} — Maison` : "Product — Maison" },
        { name: "description", content: p?.description ?? "" },
        { property: "og:title", content: p?.name ?? "Product" },
        { property: "og:description", content: p?.description ?? "" },
        { property: "og:type", content: "product" },
        { property: "og:image", content: p?.image ?? "" },
      ],
      links: p ? [{ rel: "canonical", href: `/product/${p.slug}` }] : [],
      scripts: p ? [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org", "@type": "Product",
          name: p.name, description: p.description, image: [p.image], brand: { "@type": "Brand", name: p.brand },
          aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: p.reviews },
          offers: { "@type": "Offer", priceCurrency: "INR", price: p.price, availability: "https://schema.org/InStock" },
        }),
      }] : [],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-md text-center py-32 px-6">
      <h1 className="text-display text-4xl">Piece not found</h1>
      <p className="mt-3 text-sm text-muted-foreground">This piece has been retired from the collection.</p>
      <Link to="/shop" className="btn-outline-dark mt-8">Back to shop</Link>
    </div>
  ),
  component: ProductDetail,
});

function ProductDetail() {
  const { product } = Route.useLoaderData() as { product: Product };
  const navigate = useNavigate();
  const { add } = useCart();
  const [size, setSize] = useState(product.sizes[0]);
  const [color, setColor] = useState(product.colors[0].name);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"desc" | "fit" | "delivery" | "reviews">("desc");
  const [pin, setPin] = useState("");
  const [pinResult, setPinResult] = useState<string | null>(null);

  const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  const off = product.compareAt ? Math.round(100 - (product.price / product.compareAt) * 100) : 0;

  const handleAdd = (buyNow = false) => {
    add({ id: product.id, slug: product.slug, name: product.name, brand: product.brand, image: product.image, price: product.price, size, color }, qty);
    if (buyNow) navigate({ to: "/cart" });
  };

  const checkPin = () => {
    if (!/^\d{6}$/.test(pin)) { setPinResult("Enter a valid 6-digit pincode"); return; }
    const days = 2 + (parseInt(pin) % 5);
    const date = new Date(Date.now() + days * 86400000).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
    setPinResult(`Estimated delivery by ${date}`);
  };

  return (
    <main className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-8 pb-24">
      <nav className="text-eyebrow text-muted-foreground mb-8">
        <Link to="/" className="link-underline">Home</Link> ·{" "}
        <Link to="/shop" search={{ category: product.category }} className="link-underline">{product.category}</Link> · {product.name}
      </nav>

      <div className="grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-16">
        {/* Gallery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="aspect-[3/4] sm:col-span-2 overflow-hidden bg-secondary">
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          </div>
          {product.hoverImage && (
            <div className="aspect-[3/4] overflow-hidden bg-secondary">
              <img src={product.hoverImage} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="aspect-[3/4] overflow-hidden bg-secondary">
            <img src={product.image} alt="" className="h-full w-full object-cover scale-[1.4] origin-center" />
          </div>
        </div>

        {/* Info */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="text-eyebrow text-accent">{product.brand}</div>
          <h1 className="text-display text-4xl md:text-5xl mt-3">{product.name}</h1>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(product.rating) ? "fill-accent text-accent" : "text-muted-foreground"}`} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{product.rating} · {product.reviews} reviews</span>
          </div>

          <div className="mt-7 flex items-baseline gap-4">
            <span className="text-2xl">{formatINR(product.price)}</span>
            {product.compareAt && (
              <>
                <span className="text-sm text-muted-foreground line-through">{formatINR(product.compareAt)}</span>
                <span className="text-eyebrow text-accent">Save {off}%</span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Or 3 interest-free installments of {formatINR(Math.round(product.price / 3))}</p>

          <div className="mt-9">
            <div className="flex items-center justify-between mb-3">
              <div className="text-eyebrow">Colour · <span className="text-foreground normal-case tracking-normal">{color}</span></div>
            </div>
            <div className="flex gap-3">
              {product.colors.map((c) => (
                <button key={c.name} onClick={() => setColor(c.name)} aria-label={c.name}
                  className={`h-9 w-9 rounded-full border transition-all ${color === c.name ? "ring-2 ring-offset-2 ring-accent border-transparent" : "border-border hover:scale-105"}`}
                  style={{ backgroundColor: c.hex }} />
              ))}
            </div>
          </div>

          <div className="mt-7">
            <div className="flex items-center justify-between mb-3">
              <div className="text-eyebrow">Size</div>
              <button className="text-eyebrow link-underline">Size guide</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button key={s} onClick={() => setSize(s)}
                  className={`min-w-[56px] h-11 px-4 text-sm border transition-all ${size === s ? "bg-foreground text-background border-foreground" : "hairline hover:border-foreground"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-7 flex items-center gap-4">
            <div className="flex items-center border hairline">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-12 w-12 grid place-items-center hover:bg-secondary"><Minus className="h-3.5 w-3.5" /></button>
              <div className="w-10 text-center text-sm">{qty}</div>
              <button onClick={() => setQty(qty + 1)} className="h-12 w-12 grid place-items-center hover:bg-secondary"><Plus className="h-3.5 w-3.5" /></button>
            </div>
            <button onClick={() => handleAdd(false)} className="btn-outline-dark flex-1 !rounded-none h-12">Add to bag</button>
            <WishlistHeart slug={product.slug} />
          </div>
          <button onClick={() => handleAdd(true)} className="btn-gold w-full mt-3 !rounded-none">Buy now</button>

          {/* Pincode */}
          <div className="mt-8 border-y hairline py-6 space-y-4">
            <div>
              <div className="text-eyebrow mb-2">Delivery</div>
              <div className="flex gap-2">
                <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter pincode"
                  className="flex-1 bg-transparent border hairline px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors" />
                <button onClick={checkPin} className="btn-outline-dark !px-5 !py-3">Check</button>
              </div>
              {pinResult && <div className="text-xs text-muted-foreground mt-2">{pinResult}</div>}
              <div className="text-xs text-muted-foreground mt-2">Free delivery on orders above ₹4,999</div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-2 text-center">
              <div><Truck className="h-4 w-4 mx-auto text-accent" /><div className="text-[11px] mt-2 text-muted-foreground">Free shipping</div></div>
              <div><RotateCcw className="h-4 w-4 mx-auto text-accent" /><div className="text-[11px] mt-2 text-muted-foreground">30-day returns</div></div>
              <div><Shield className="h-4 w-4 mx-auto text-accent" /><div className="text-[11px] mt-2 text-muted-foreground">Lifetime care</div></div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8">
            <div className="flex gap-6 border-b hairline">
              {[["desc", "Description"], ["fit", "Size & fit"], ["delivery", "Delivery & returns"], ["reviews", `Reviews · ${product.reviews}`]].map(([k, l]) => (
                <button key={k} onClick={() => setTab(k as typeof tab)}
                  className={`text-eyebrow pb-3 -mb-px border-b transition-colors ${tab === k ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"}`}>{l}</button>
              ))}
            </div>
            <div className="text-sm leading-[1.85] text-muted-foreground py-6">
              {tab === "desc" && <p>{product.description}</p>}
              {tab === "fit" && (
                <ul className="space-y-2">
                  <li><span className="text-foreground">Fit:</span> {product.fit}</li>
                  <li><span className="text-foreground">Fabric:</span> {product.fabric}</li>
                  <li><span className="text-foreground">Care:</span> {product.care}</li>
                </ul>
              )}
              {tab === "delivery" && (
                <ul className="space-y-2">
                  <li>Complimentary shipping on orders above ₹4,999.</li>
                  <li>Express delivery available at checkout.</li>
                  <li>30-day returns. Items must be unworn with tags attached.</li>
                </ul>
              )}
              {tab === "reviews" && <ReviewsPanel slug={product.slug} />}
            </div>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-28">
          <div className="text-eyebrow text-accent mb-3">Complete the look</div>
          <h2 className="text-display text-3xl md:text-4xl mb-10">You may also love</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </main>
  );
}

function WishlistHeart({ slug }: { slug: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const check = useServerFn(isInWishlist);
  const toggle = useServerFn(toggleWishlist);
  const q = useQuery({ queryKey: ["wishlist", slug], queryFn: () => check({ data: { slug } }), enabled: !!user });
  const m = useMutation({ mutationFn: () => toggle({ data: { slug } }), onSuccess: () => q.refetch() });
  const inWish = q.data?.in_wishlist;
  return (
    <button
      aria-label="Wishlist"
      onClick={() => user ? m.mutate() : navigate({ to: "/auth" })}
      className={`h-12 w-12 border hairline grid place-items-center transition-colors ${inWish ? "text-accent border-accent" : "hover:text-accent hover:border-accent"}`}
    >
      <Heart className={`h-4 w-4 ${inWish ? "fill-accent" : ""}`} />
    </button>
  );
}

function ReviewsPanel({ slug }: { slug: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const listFn = useServerFn(listReviewsForSlug);
  const submitFn = useServerFn(submitReview);
  const q = useQuery({ queryKey: ["reviews", slug], queryFn: () => listFn({ data: { slug } }) });
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const m = useMutation({
    mutationFn: () => submitFn({ data: { slug, rating, title: title || undefined, body: body || undefined } }),
    onSuccess: () => { setOpen(false); setTitle(""); setBody(""); q.refetch(); },
    onError: (e: any) => setErr(e.message),
  });

  return (
    <div className="space-y-6">
      {q.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
        <>
          <div className="flex items-baseline gap-3">
            <span className="text-foreground text-2xl">{q.data?.rating_avg?.toFixed(1) ?? "—"}/5</span>
            <span className="text-xs">based on {q.data?.rating_count ?? 0} reviews</span>
          </div>
          <button onClick={() => user ? setOpen(true) : navigate({ to: "/auth" })} className="btn-outline-dark">Write a review</button>
          {open && (
            <div className="border hairline p-5 space-y-3">
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setRating(n)}>
                    <Star className={`h-5 w-5 ${n <= rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                  </button>
                ))}
              </div>
              <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Headline (optional)" className="w-full bg-background border hairline px-3 py-2 text-sm"/>
              <textarea value={body} onChange={(e)=>setBody(e.target.value)} rows={3} placeholder="What did you love?" className="w-full bg-background border hairline px-3 py-2 text-sm"/>
              {err && <div className="text-xs text-destructive">{err}</div>}
              <div className="flex gap-3">
                <button onClick={() => m.mutate()} disabled={m.isPending} className="btn-gold">{m.isPending ? "Sending…" : "Submit"}</button>
                <button onClick={() => setOpen(false)} className="btn-outline-dark">Cancel</button>
              </div>
            </div>
          )}
          <ul className="space-y-5">
            {q.data?.reviews.map((r) => (
              <li key={r.id} className="border-b hairline pb-5">
                <div className="flex items-center gap-2">
                  {Array.from({length:5}).map((_,i) => (
                    <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                  ))}
                  <span className="text-xs text-foreground ml-2">{r.author}</span>
                  {r.is_verified_purchase && <span className="text-[10px] uppercase tracking-widest text-accent">Verified</span>}
                </div>
                {r.title && <div className="text-sm text-foreground mt-2">{r.title}</div>}
                {r.body && <p className="mt-1">{r.body}</p>}
                <div className="text-[10px] text-muted-foreground mt-2">{new Date(r.created_at).toLocaleDateString()}</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
          </div>
        </section>
      )}
    </main>
  );
}
