import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, X } from "lucide-react";
import { PRODUCTS, type Category } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";
import { listPublicProducts } from "@/lib/api/catalog.functions";
import { usePageAnimations } from "@/hooks/use-page-animations";

type Search = { category?: Category | "all"; sort?: "newest" | "price-asc" | "price-desc" | "popular" };

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    category: (["women", "men", "accessories", "all"] as const).includes(s.category as never)
      ? (s.category as Search["category"])
      : undefined,
    sort: (["newest", "price-asc", "price-desc", "popular"] as const).includes(s.sort as never)
      ? (s.sort as Search["sort"])
      : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop the Maison collection" },
      { name: "description", content: "Browse the full Maison collection — Women, Men and Accessories." },
      { property: "og:title", content: "Shop — Maison" },
      { property: "og:description", content: "Browse the Maison collection." },
    ],
    links: [{ rel: "canonical", href: "/shop" }],
  }),
  component: Shop,
});

const CAT_LABEL: Record<string, string> = { women: "Women", men: "Men", accessories: "Accessories", all: "All" };

function Shop() {
  const { category = "all", sort = "newest" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [priceMax, setPriceMax] = useState(100000);
  const fetchProducts = useServerFn(listPublicProducts);
  const { data: dbProducts } = useQuery({ queryKey: ["public-products"], queryFn: () => fetchProducts(), staleTime: 30_000 });

  const items = useMemo(() => {
    const seen = new Set<string>();
    const all: any[] = [];
    for (const p of (dbProducts ?? [])) { if (!seen.has(p.slug)) { seen.add(p.slug); all.push(p); } }
    for (const p of PRODUCTS) { if (!seen.has(p.slug)) { seen.add(p.slug); all.push(p); } }
    let list = category === "all" || !category ? all : all.filter((p) => p.category === category);
    list = list.filter((p) => p.price <= priceMax);
    switch (sort) {
      case "price-asc":  list = [...list].sort((a, b) => a.price - b.price); break;
      case "price-desc": list = [...list].sort((a, b) => b.price - a.price); break;
      case "popular":    list = [...list].sort((a, b) => b.reviews - a.reviews); break;
      default:           list = [...list].sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew));
    }
    return list;
  }, [category, sort, priceMax, dbProducts]);

  usePageAnimations();

  return (
    <main className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-12 pb-24">

      {/* ── Shop header ── */}
      <div className="shop-header border-b border-white/[0.08] pb-10 mb-10">
        <nav className="text-eyebrow text-muted-foreground">
          <Link to="/" className="link-underline hover:text-accent transition-colors">Home</Link>
          <span className="mx-2 text-foreground/20">·</span>
          Shop
        </nav>
        <div className="mt-5 flex items-end justify-between">
          <div>
            <h1 className="text-display text-5xl md:text-6xl">{CAT_LABEL[category] ?? "All"}</h1>
            <p className="text-eyebrow text-muted-foreground mt-3">
              {items.length} {items.length === 1 ? "piece" : "pieces"}
            </p>
          </div>
          <div className="hidden md:flex gap-3">
            {(["all", "women", "men", "accessories"] as const).map((c) => (
              <button
                key={c}
                onClick={() => navigate({ search: (p: Search) => ({ ...p, category: c }) })}
                className={`text-eyebrow px-5 py-2.5 border transition-all duration-300 ${
                  (category ?? "all") === c
                    ? "border-accent text-accent bg-accent/[0.06]"
                    : "border-white/10 text-foreground/40 hover:border-white/25 hover:text-foreground/65"
                }`}
              >
                {CAT_LABEL[c]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[230px_1fr] gap-10">

        {/* ── Filters Sidebar ── */}
        <aside className="shop-sidebar space-y-10 lg:sticky lg:top-28 lg:self-start">
          {/* Mobile category */}
          <div className="lg:hidden">
            <div className="text-eyebrow text-foreground/40 mb-4">Category</div>
            <div className="flex flex-wrap gap-2">
              {(["all", "women", "men", "accessories"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => navigate({ search: (p: Search) => ({ ...p, category: c }) })}
                  className={`text-eyebrow px-4 py-2 border transition-all duration-300 ${
                    (category ?? "all") === c
                      ? "border-accent text-accent"
                      : "border-white/10 text-foreground/40"
                  }`}
                >
                  {CAT_LABEL[c]}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop category list */}
          <div className="hidden lg:block">
            <div className="text-eyebrow text-foreground/35 mb-5">Category</div>
            <ul className="gsap-stagger-list space-y-3 text-sm">
              {(["all", "women", "men", "accessories"] as const).map((c) => (
                <li key={c} className="gsap-list-item">
                  <button
                    onClick={() => navigate({ search: (p: Search) => ({ ...p, category: c }) })}
                    className={`link-underline transition-colors duration-300 ${
                      (category ?? "all") === c ? "text-foreground font-medium" : "text-muted-foreground hover:text-accent"
                    }`}
                  >
                    {CAT_LABEL[c]}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Price range */}
          <div>
            <div className="text-eyebrow text-foreground/35 mb-5">
              Price · up to ₹{priceMax.toLocaleString("en-IN")}
            </div>
            <input
              type="range" min={10000} max={100000} step={1000}
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-full accent-[color:var(--gold)]"
            />
            <div className="flex justify-between text-[10px] text-foreground/25 mt-1.5 tracking-wider">
              <span>₹10,000</span>
              <span>₹1,00,000</span>
            </div>
          </div>

          {/* Active filters */}
          {category && category !== "all" && (
            <div>
              <div className="text-eyebrow text-foreground/35 mb-4">Active</div>
              <button
                onClick={() => navigate({ search: (p: Search) => ({ ...p, category: "all" as const }) })}
                className="inline-flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase border border-white/10 px-3 py-2 hover:border-accent hover:text-accent transition-all duration-300"
              >
                {CAT_LABEL[category]} <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </aside>

        {/* ── Product Grid ── */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="text-eyebrow text-foreground/30">
              Sorted by
            </div>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => navigate({ search: (p: Search) => ({ ...p, sort: e.target.value as Search["sort"] }) })}
                className="appearance-none bg-transparent border border-white/10 pl-4 pr-10 py-2.5 text-eyebrow text-foreground/60 cursor-pointer focus:outline-none focus:border-accent transition-colors hover:border-white/25"
              >
                <option value="newest">Newest</option>
                <option value="popular">Popular</option>
                <option value="price-asc">Price · low to high</option>
                <option value="price-desc">Price · high to low</option>
              </select>
              <ChevronDown className="h-3.5 w-3.5 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/40" />
            </div>
          </div>

          {items.length === 0 ? (
            <div className="py-24 text-center">
              <div className="text-display text-3xl">Nothing matches</div>
              <p className="mt-3 text-sm text-muted-foreground">Try widening your filters.</p>
            </div>
          ) : (
            <div className="shop-product-grid grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-12 md:gap-x-5">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
