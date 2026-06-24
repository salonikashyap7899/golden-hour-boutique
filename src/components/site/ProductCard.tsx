import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useRef } from "react";
import { formatINR, type Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const off = product.compareAt ? Math.round(100 - (product.price / product.compareAt) * 100) : 0;
  const cardRef = useRef<HTMLAnchorElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = async () => {
    const { gsap } = await import("@/lib/gsap-setup");
    if (imageRef.current) gsap.to(imageRef.current, { scale: 1.08, duration: 0.6, ease: "power2.out", force3D: true });
    if (contentRef.current) gsap.to(contentRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });
    if (cardRef.current) gsap.to(cardRef.current, { y: -4, duration: 0.4, ease: "power2.out" });
  };

  const handleMouseLeave = async () => {
    const { gsap } = await import("@/lib/gsap-setup");
    if (imageRef.current) gsap.to(imageRef.current, { scale: 1, duration: 0.6, ease: "power2.out", force3D: true });
    if (contentRef.current) gsap.to(contentRef.current, { opacity: 0, y: 20, duration: 0.5, ease: "power2.out" });
    if (cardRef.current) gsap.to(cardRef.current, { y: 0, duration: 0.4, ease: "power2.out" });
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
      <div className="relative overflow-hidden bg-secondary aspect-[3/4]">
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
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {product.isNew && <span className="text-eyebrow bg-background/90 backdrop-blur px-3 py-1.5">New</span>}
          {off > 0 && <span className="text-eyebrow bg-foreground text-background px-3 py-1.5">−{off}%</span>}
        </div>
        <button
          aria-label="Add to wishlist"
          onClick={(e) => { e.preventDefault(); }}
          className="absolute top-4 right-4 h-9 w-9 grid place-items-center rounded-full bg-background/90 backdrop-blur opacity-0 group-hover:opacity-100 transition-all duration-500 hover:text-accent z-10"
        >
          <Heart className="h-4 w-4" />
        </button>
        <div
          ref={contentRef}
          className="absolute inset-x-4 bottom-4 z-10"
          style={{ opacity: 0, transform: "translateY(20px)", willChange: "opacity, transform" }}
        >
          <div className="bg-background/95 backdrop-blur text-foreground text-center text-eyebrow py-3">
            Quick view
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-1">
        <div className="text-eyebrow text-muted-foreground">{product.brand}</div>
        <div className="text-[15px] font-serif leading-snug">{product.name}</div>
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-[14px]">{formatINR(product.price)}</span>
          {product.compareAt && (
            <span className="text-[12px] text-muted-foreground line-through">{formatINR(product.compareAt)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
