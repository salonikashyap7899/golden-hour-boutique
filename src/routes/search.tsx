import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { z } from "zod";
import { Search, Sparkles } from "lucide-react";
import { aiSearchProducts } from "@/lib/api/ai-search.functions";
import { formatINR } from "@/lib/products";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => z.object({ q: z.string().optional() }).parse(s),
  head: () => ({ meta: [{ title: "Search — Maison" }, { name: "description", content: "Search the Maison collection with AI." }] }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const [query, setQuery] = useState(q ?? "");
  const fn = useServerFn(aiSearchProducts);
  const search = useMutation({ mutationFn: (text: string) => fn({ data: { q: text } }) });

  useEffect(() => { if (q) search.mutate(q); /* eslint-disable-next-line */ }, []);

  return (
    <main className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-12 pb-24">
      <div className="max-w-3xl mx-auto animate-fade-up">
        <div className="text-eyebrow text-accent flex items-center gap-2"><Sparkles className="h-3.5 w-3.5" /> AI search</div>
        <h1 className="text-display text-4xl md:text-5xl mt-3">What are you looking for?</h1>
        <form
          onSubmit={(e) => { e.preventDefault(); search.mutate(query); }}
          className="mt-8 flex gap-3 border-b-2 border-foreground pb-3"
        >
          <Search className="h-5 w-5 self-end mb-1 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Try "silk dress under 15000" or "black leather bag for office"'
            className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
          />
          <button className="btn-gold text-xs" disabled={!query || search.isPending}>
            {search.isPending ? "Searching…" : "Search"}
          </button>
        </form>
      </div>

      {search.data && (
        <div className="mt-12 animate-fade-up">
          <div className="text-eyebrow text-muted-foreground mb-6">
            {search.data.results.length} {search.data.results.length === 1 ? "piece" : "pieces"}
            {search.data.filters.max_price && ` · under ₹${search.data.filters.max_price.toLocaleString("en-IN")}`}
            {search.data.filters.category && ` · ${search.data.filters.category}`}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6">
            {search.data.results.map((p: any, i: number) => (
              <Link
                key={p.id}
                to="/product/$slug"
                params={{ slug: p.slug }}
                style={{ animationDelay: `${i * 50}ms` }}
                className="group block animate-fade-up"
              >
                <div className="aspect-[3/4] bg-secondary overflow-hidden">
                  <img src={p.product_images?.[0]?.url ?? "/products/p1.jpg"} alt={p.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="mt-3 text-sm">{p.title}</div>
                <div className="text-sm text-muted-foreground">{formatINR(Number(p.price))}</div>
              </Link>
            ))}
          </div>
          {search.data.results.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">No matches. Try a broader search.</div>
          )}
        </div>
      )}
    </main>
  );
}
