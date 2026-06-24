import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { formatINR, type Product } from "@/lib/products";
import { useTilt } from "@/hooks/use-tilt";

export function ProductCard({ product }: { product: Product }) {
  const off = product.compareAt ? Math.round(100 - (product.price / product.compareAt) * 100) : 0;
  const { ref, onMouseMove, onMouseLeave } = useTilt(10);

  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group block"
      style={{ transformStyle: "preserve-3d" }}
      ref={ref as any}
      onMouseMove={onMouseMove as any}
      onMouseLeave={onMouseLeave as any}
    >
      <div className="relative overflow-hidden bg-secondary aspect-[3/4]" style={{ transformStyle: "preserve-3d" }}>
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.04]"
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

        <div className="tilt-shine absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300 z-10" />

        <div className="absolute top-4 left-4 flex flex-col gap-2 z-20" style={{ transform: "translateZ(20px)" }}>
          {product.isNew && <span className="text-eyebrow bg-background/90 backdrop-blur px-3 py-1.5">New</span>}
          {off > 0 && <span className="text-eyebrow bg-foreground text-background px-3 py-1.5">−{off}%</span>}
        </div>
        <button
          aria-label="Add to wishlist"
          onClick={(e) => { e.preventDefault(); }}
          className="absolute top-4 right-4 h-9 w-9 grid place-items-center rounded-full bg-background/90 backdrop-blur opacity-0 group-hover:opacity-100 transition-all duration-500 hover:text-accent z-20"
          style={{ transform: "translateZ(24px)" }}
        >
          <Heart className="h-4 w-4" />
        </button>
        <div
          className="absolute inset-x-4 bottom-4 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-20"
          style={{ transform: "translateZ(18px)" }}
        >
          <div className="bg-background/95 backdrop-blur text-foreground text-center text-eyebrow py-3">
            Quick view
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-1" style={{ transform: "translateZ(8px)" }}>
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
