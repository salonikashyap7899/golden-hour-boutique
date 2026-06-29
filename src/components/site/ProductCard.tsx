import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useRef } from "react";
import { formatINR, type Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const off = product.compareAt ? Math.round(100 - (product.price / product.compareAt) * 100) : 0;
  const cardRef    = useRef<HTMLAnchorElement>(null);
  const imageRef   = useRef<HTMLImageElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = async () => {
    const { gsap } = await import("@/lib/gsap-setup");
    if (imageRef.current)   gsap.to(imageRef.current,   { scale: 1.08, duration: 0.65, ease: "power2.out", force3D: true });
    if (contentRef.current) gsap.to(contentRef.current, { opacity: 1,  y: 0,      duration: 0.55, ease: "power2.out" });
    if (cardRef.current)    gsap.to(cardRef.current,    { y: -6,              duration: 0.45, ease: "power2.out" });
  };

  const handleMouseLeave = async () => {
    const { gsap } = await import("@/lib/gsap-setup");
    if (imageRef.current)   gsap.to(imageRef.current,   { scale: 1, duration: 0.65, ease: "power2.out", force3D: true });
    if (contentRef.current) gsap.to(contentRef.current, { opacity: 0, y: 20, duration: 0.5, ease: "power2.out" });
    if (cardRef.current)    gsap.to(cardRef.current,    { y: 0,              duration: 0.45, ease: "power2.out" });
  };

  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group block gsap-card"
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ willChange: "transform" }}
    >
      <div className="relative overflow-hidden bg-midnight2 aspect-[3/4]">
        <img
          ref={imageRef}
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ willChange: "transform" }}
        />
        {product.hoverImage && (
          <img
            src={product.hoverImage}
            alt=""
            loading="lazy"
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          />
        )}

        {/* Subtle dark vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {product.isNew && (
            <span className="text-eyebrow bg-midnight/80 backdrop-blur-sm px-3 py-1.5 text-accent border border-accent/20">New</span>
          )}
          {off > 0 && (
            <span className="text-eyebrow bg-accent text-midnight px-3 py-1.5">−{off}%</span>
          )}
        </div>

        {/* Wishlist */}
        <button
          aria-label="Add to wishlist"
          onClick={(e) => { e.preventDefault(); }}
          className="absolute top-3 right-3 h-9 w-9 grid place-items-center rounded-full bg-midnight/70 backdrop-blur-sm border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-400 hover:border-accent hover:text-accent z-10"
        >
          <Heart className="h-3.5 w-3.5" />
        </button>

        {/* Quick view */}
        <div
          ref={contentRef}
          className="absolute inset-x-3 bottom-3 z-10"
          style={{ opacity: 0, transform: "translateY(20px)", willChange: "opacity, transform" }}
        >
          <div className="bg-midnight/85 backdrop-blur-sm text-foreground text-center text-eyebrow py-3 border border-white/10 tracking-[0.3em]">
            Quick view
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 space-y-1.5">
        <div className="text-eyebrow text-foreground/40">{product.brand}</div>
        <div className="text-[14.5px] font-serif leading-snug text-foreground">{product.name}</div>
        <div className="flex items-baseline gap-2.5 pt-0.5">
          <span className="text-[13.5px] text-foreground/80">{formatINR(product.price)}</span>
          {product.compareAt && (
            <span className="text-[12px] text-foreground/35 line-through">{formatINR(product.compareAt)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
