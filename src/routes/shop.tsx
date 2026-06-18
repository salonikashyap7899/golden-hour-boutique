import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { PRODUCTS, type Category } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";

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

  const items = useMemo(() => {
    let list = category === "all" || !category ? PRODUCTS : PRODUCTS.filter((p) => p.category === category);
    list = list.filter((p) => p.price <= priceMax);
    switch (sort) {
      case "price-asc": list = [...list].sort((a, b) => a.price - b.price); break;
      case "price-desc": list = [...list].sort((a, b) => b.price - a.price); break;
      case "popular": list = [...list].sort((a, b) => b.reviews - a.reviews); break;
      default: list = [...list].sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew));
    }
    return list;
  }, [category, sort, priceMax]);

  return (
    <main className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-12 pb-24">
      {/* Header */}
      <div className="border-b hairline pb-10 mb-10">
        <nav className="text-eyebrow text-muted-foreground"><Link to="/" className="link-underline">Home</Link> · Shop</nav>
        <h1 className="text-display text-5xl md:text-6xl mt-4">{CAT_LABEL[category]}</h1>
        <p className="text-sm text-muted-foreground mt-3">{items.length} {items.length === 1 ? "piece" : "pieces"}</p>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr] gap-12">
        {/* Filters */}
        <aside className="space-y-10 lg:sticky lg:top-28 lg:self-start">
          <div>
            <div className="text-eyebrow mb-4">Category</div>
            <ul className="space-y-2 text-sm">
              {(["all", "women", "men", "accessories"] as const).map((c) => (
                <li key={c}>
                  <button
                    onClick={() => navigate({ search: (p) => ({ ...p, category: c }) })}
                    className={`link-underline ${category === c ? "text-foreground font-medium" : "text-muted-foreground"}`}
                  >
                    {CAT_LABEL[c]}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-eyebrow mb-4">Price · up to ₹{priceMax.toLocaleString("en-IN")}</div>
            <input
              type="range" min={10000} max={100000} step={1000}
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-full accent-[color:var(--gold)]"
            />
          </div>
          <div>
            <div className="text-eyebrow mb-4">Active filters</div>
            <div className="flex flex-wrap gap-2">
              {category !== "all" && (
                <button
                  onClick={() => navigate({ search: (p) => ({ ...p, category: "all" }) })}
                  className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.18em] uppercase border hairline px-3 py-1.5"
                >
                  {CAT_LABEL[category]} <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Grid */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="text-sm text-muted-foreground">Sort</div>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => navigate({ search: (p) => ({ ...p, sort: e.target.value as Search["sort"] }) })}
                className="appearance-none bg-transparent border hairline pl-4 pr-10 py-2 text-eyebrow cursor-pointer focus:outline-none focus:border-accent"
              >
                <option value="newest">Newest</option>
                <option value="popular">Popular</option>
                <option value="price-asc">Price · low to high</option>
                <option value="price-desc">Price · high to low</option>
              </select>
              <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {items.length === 0 ? (
            <div className="py-24 text-center">
              <div className="text-display text-3xl">Nothing matches</div>
              <p className="mt-3 text-sm text-muted-foreground">Try widening your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-12 md:gap-x-6">
              {items.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
