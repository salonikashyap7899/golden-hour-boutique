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
import { usePageAnimations } from "@/hooks/use-page-animations";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const local = findProduct(params.slug);
    if (local) return { product: local };
    const { getPublicProductBySlug } = await import("@/lib/api/catalog.functions");
    const remote = await getPublicProductBySlug({ data: { slug: params.slug } });
    if (!remote) throw notFound();
    return { product: remote as unknown as Product };
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
          name: p.name, description: p.description, image: [p.image],
          brand: { "@type": "Brand", name: p.brand },
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
      <Link to="/shop" className="btn-outline-dark mt-8 inline-flex">Back to shop</Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-md text-center py-32 px-6">
      <h1 className="text-display text-3xl">Couldn't load this piece</h1>
      <p className="mt-3 text-sm text-muted-foreground">{error.message}</p>
      <Link to="/shop" className="btn-outline-dark mt-8 inline-flex">Back to shop</Link>
    </div>
  ),
  component: ProductDetail,
});

function ProductDetail() {
  const { product } = Route.useLoaderData() as { product: Product };
  const navigate = useNavigate();
  const { add } = useCart();
  const [size, setSize]   = useState(product.sizes[0]);
  const [color, setColor] = useState(product.colors[0].name);
  const [qty, setQty]     = useState(1);
  const [tab, setTab]     = useState<"desc" | "fit" | "delivery" | "reviews">("desc");
  const [pin, setPin]     = useState("");
  const [pinResult, setPinResult] = useState<string | null>(null);

  const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  const off = product.compareAt ? Math.round(100 - (product.price / product.compareAt) * 100) : 0;

  usePageAnimations();

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

      {/* Breadcrumb */}
      <nav className="text-eyebrow text-muted-foreground mb-10 flex items-center gap-2">
        <Link to="/" className="link-underline hover:text-accent transition-colors">Home</Link>
        <span className="text-foreground/20">·</span>
        <Link to="/shop" search={{ category: product.category }} className="link-underline hover:text-accent transition-colors capitalize">
          {product.category}
        </Link>
        <span className="text-foreground/20">·</span>
        <span className="text-foreground/50">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-20">

        {/* ── Gallery ── */}
        <div className="product-gallery grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            className="gallery-img-wrap aspect-[3/4] sm:col-span-2 overflow-hidden bg-midnight2"
            style={{ willChange: "clip-path" }}
          >
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
              style={{ willChange: "transform" }}
            />
          </div>
          {product.hoverImage && (
            <div
              className="gallery-img-wrap aspect-[3/4] overflow-hidden bg-midnight2"
              style={{ willChange: "clip-path" }}
            >
              <img
                src={product.hoverImage}
                alt=""
                className="h-full w-full object-cover"
                style={{ willChange: "transform" }}
              />
            </div>
          )}
          <div
            className="gallery-img-wrap aspect-[3/4] overflow-hidden bg-midnight2"
            style={{ willChange: "clip-path" }}
          >
            <img
              src={product.image}
              alt=""
              className="h-full w-full object-cover scale-[1.35] origin-center"
              style={{ willChange: "transform" }}
            />
          </div>
        </div>

        {/* ── Product Info ── */}
        <div
          className="product-info lg:sticky lg:top-28 lg:self-start space-y-0"
          style={{ opacity: 0, willChange: "opacity, transform" }}
        >
          {/* Brand + badges */}
          <div className="flex items-center justify-between">
            <div className="text-eyebrow text-accent tracking-[0.3em]">{product.brand}</div>
            {product.isNew && (
              <div className="text-eyebrow text-midnight bg-accent px-3 py-1">New</div>
            )}
          </div>

          {/* Name */}
          <h1 className="text-display text-4xl md:text-5xl mt-3 mb-5">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-3 mb-7">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(product.rating) ? "fill-accent text-accent" : "text-foreground/20"}`} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{product.rating} · {product.reviews} reviews</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-4 pb-7 border-b border-white/[0.08]">
            <span className="text-2xl font-serif">{formatINR(product.price)}</span>
            {product.compareAt && (
              <>
                <span className="text-sm text-muted-foreground line-through">{formatINR(product.compareAt)}</span>
                <span className="text-eyebrow text-accent">Save {off}%</span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Or 3 interest-free instalments of {formatINR(Math.round(product.price / 3))}
          </p>

          {/* Colour */}
          <div className="mt-9">
            <div className="flex items-center justify-between mb-3">
              <div className="text-eyebrow text-foreground/40">
                Colour · <span className="text-foreground normal-case tracking-normal">{color}</span>
              </div>
            </div>
            <div className="flex gap-3">
              {product.colors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setColor(c.name)}
                  aria-label={c.name}
                  className={`h-9 w-9 rounded-full border transition-all duration-300 ${
                    color === c.name
                      ? "ring-2 ring-offset-2 ring-offset-midnight ring-accent border-transparent scale-110"
                      : "border-white/15 hover:scale-105"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="mt-7">
            <div className="flex items-center justify-between mb-3">
              <div className="text-eyebrow text-foreground/40">Size</div>
              <button className="text-eyebrow link-underline text-foreground/35 hover:text-accent transition-colors">Size guide</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`min-w-[56px] h-11 px-4 text-sm border transition-all duration-300 ${
                    size === s
                      ? "bg-foreground text-background border-foreground"
                      : "border-white/10 hover:border-white/30 text-foreground/60"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Qty + Add */}
          <div className="mt-7 flex items-center gap-4">
            <div className="flex items-center border border-white/10">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="h-12 w-12 grid place-items-center hover:bg-secondary transition-colors"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <div className="w-10 text-center text-sm">{qty}</div>
              <button
                onClick={() => setQty(qty + 1)}
                className="h-12 w-12 grid place-items-center hover:bg-secondary transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              onClick={() => handleAdd(false)}
              className="btn-outline-dark flex-1 !rounded-none h-12 text-[0.7rem]"
            >
              Add to bag
            </button>
            <WishlistHeart slug={product.slug} />
          </div>
          <button
            onClick={() => handleAdd(true)}
            className="btn-gold w-full mt-3 !rounded-none magnetic"
            data-strength="0.2"
          >
            Buy now
          </button>

          {/* Pincode */}
          <div className="mt-9 border-y border-white/[0.08] py-7 space-y-5">
            <div>
              <div className="text-eyebrow text-foreground/35 mb-3">Delivery estimate</div>
              <div className="flex gap-2">
                <input
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter pincode"
                  className="flex-1 bg-transparent border border-white/10 focus:border-accent px-4 py-3 text-sm outline-none transition-colors text-foreground placeholder:text-foreground/25"
                />
                <button onClick={checkPin} className="btn-outline-dark !px-5 !py-3 text-[0.68rem]">Check</button>
              </div>
              {pinResult && <div className="text-xs text-accent mt-2">{pinResult}</div>}
              <div className="text-xs text-muted-foreground mt-2">Free delivery on orders above ₹4,999</div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <Truck className="h-4 w-4 mx-auto text-accent" />
                <div className="text-[11px] mt-2 text-muted-foreground">Free shipping</div>
              </div>
              <div>
                <RotateCcw className="h-4 w-4 mx-auto text-accent" />
                <div className="text-[11px] mt-2 text-muted-foreground">30-day returns</div>
              </div>
              <div>
                <Shield className="h-4 w-4 mx-auto text-accent" />
                <div className="text-[11px] mt-2 text-muted-foreground">Lifetime care</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8">
            <div className="flex gap-6 border-b border-white/[0.08] overflow-x-auto scrollbar-none">
              {([
                ["desc",    "Description"],
                ["fit",     "Size & fit"],
                ["delivery","Delivery"],
                ["reviews", `Reviews · ${product.reviews}`],
              ] as const).map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`text-eyebrow pb-3 -mb-px border-b flex-shrink-0 transition-all duration-300 ${
                    tab === k
                      ? "border-accent text-accent"
                      : "border-transparent text-muted-foreground hover:text-foreground/60"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <div className="text-sm leading-[1.9] text-muted-foreground py-6">
              {tab === "desc" && <p>{product.description}</p>}
              {tab === "fit" && (
                <ul className="space-y-2.5">
                  <li><span className="text-foreground">Fit:</span> {product.fit}</li>
                  <li><span className="text-foreground">Fabric:</span> {product.fabric}</li>
                  <li><span className="text-foreground">Care:</span> {product.care}</li>
                </ul>
              )}
              {tab === "delivery" && (
                <ul className="space-y-2.5">
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

      {/* ── Related Products ── */}
      {related.length > 0 && (
        <section className="related-products mt-28 md:mt-36">
          <div className="gsap-reveal mb-10" data-dir="up">
            <div className="text-eyebrow text-accent mb-3">Complete the look</div>
            <h2 className="text-display text-3xl md:text-4xl">You may also love</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-5">
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
  const check  = useServerFn(isInWishlist);
  const toggle = useServerFn(toggleWishlist);
  const q = useQuery({ queryKey: ["wishlist", slug], queryFn: () => check({ data: { slug } }), enabled: !!user });
  const m = useMutation({ mutationFn: () => toggle({ data: { slug } }), onSuccess: () => q.refetch() });
  const inWish = q.data?.in_wishlist;
  return (
    <button
      aria-label="Wishlist"
      onClick={() => user ? m.mutate() : navigate({ to: "/auth" })}
      className={`h-12 w-12 border grid place-items-center transition-all duration-300 ${
        inWish ? "text-accent border-accent bg-accent/10" : "border-white/10 hover:text-accent hover:border-accent"
      }`}
    >
      <Heart className={`h-4 w-4 ${inWish ? "fill-accent" : ""}`} />
    </button>
  );
}

function ReviewsPanel({ slug }: { slug: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const listFn   = useServerFn(listReviewsForSlug);
  const submitFn = useServerFn(submitReview);
  const q = useQuery({ queryKey: ["reviews", slug], queryFn: () => listFn({ data: { slug } }) });
  const [open, setOpen]   = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody]   = useState("");
  const [err, setErr]     = useState<string | null>(null);
  const m = useMutation({
    mutationFn: () => submitFn({ data: { slug, rating, title: title || undefined, body: body || undefined } }),
    onSuccess: () => { setOpen(false); setTitle(""); setBody(""); q.refetch(); },
    onError: (e: any) => setErr(e.message),
  });

  return (
    <div className="space-y-6">
      {q.isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-accent" />
      ) : (
        <>
          <div className="flex items-baseline gap-3">
            <span className="text-foreground font-serif text-2xl">{q.data?.rating_avg?.toFixed(1) ?? "—"}/5</span>
            <span className="text-xs text-muted-foreground">based on {q.data?.rating_count ?? 0} reviews</span>
          </div>
          <button
            onClick={() => user ? setOpen(true) : navigate({ to: "/auth" })}
            className="btn-outline-dark text-[0.68rem] !py-2.5 !px-5"
          >
            Write a review
          </button>
          {open && (
            <div className="border border-white/[0.1] p-6 space-y-4 bg-midnight2">
              <div className="flex gap-1.5">
                {[1,2,3,4,5].map((n) => (
                  <button key={n} onClick={() => setRating(n)}>
                    <Star className={`h-5 w-5 ${n <= rating ? "fill-accent text-accent" : "text-foreground/20"}`} />
                  </button>
                ))}
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Headline (optional)"
                className="w-full bg-background border border-white/10 focus:border-accent px-3 py-2.5 text-sm outline-none transition-colors"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                placeholder="What did you love?"
                className="w-full bg-background border border-white/10 focus:border-accent px-3 py-2.5 text-sm outline-none resize-none transition-colors"
              />
              {err && <div className="text-xs text-destructive">{err}</div>}
              <div className="flex gap-3">
                <button onClick={() => m.mutate()} disabled={m.isPending} className="btn-gold text-[0.68rem]">
                  {m.isPending ? "Sending…" : "Submit"}
                </button>
                <button onClick={() => setOpen(false)} className="btn-outline-dark text-[0.68rem]">Cancel</button>
              </div>
            </div>
          )}
          <ul className="space-y-6">
            {q.data?.reviews.map((r) => (
              <li key={r.id} className="border-b border-white/[0.07] pb-6">
                <div className="flex items-center gap-2 flex-wrap">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3 w-3 ${i < r.rating ? "fill-accent text-accent" : "text-foreground/20"}`} />
                  ))}
                  <span className="text-xs text-foreground ml-1">{r.author}</span>
                  {r.is_verified_purchase && (
                    <span className="text-[10px] uppercase tracking-widest text-accent">Verified</span>
                  )}
                </div>
                {r.title && <div className="text-sm text-foreground mt-2">{r.title}</div>}
                {r.body && <p className="mt-1 text-muted-foreground">{r.body}</p>}
                <div className="text-[10px] text-muted-foreground mt-2">
                  {new Date(r.created_at).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
