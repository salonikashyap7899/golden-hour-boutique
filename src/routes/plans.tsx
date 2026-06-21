import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, Sparkles } from "lucide-react";
import { listPlans } from "@/lib/api/sellers.functions";

export const Route = createFileRoute("/plans")({
  head: () => ({
    meta: [
      { title: "Seller Plans — Maison" },
      { name: "description", content: "Pricing plans for sellers on Maison. Start free, upgrade as you grow." },
      { property: "og:title", content: "Sell on Maison — Pricing" },
    ],
  }),
  component: PlansPage,
});

function PlansPage() {
  const fn = useServerFn(listPlans);
  const { data: plans } = useQuery({ queryKey: ["plans"], queryFn: () => fn() });

  return (
    <main className="mx-auto max-w-[1400px] px-6 lg:px-10 pt-16 pb-28">
      <div className="text-center max-w-2xl mx-auto animate-fade-up">
        <div className="text-eyebrow text-accent">For sellers</div>
        <h1 className="text-display text-5xl md:text-6xl mt-4">Grow with the house</h1>
        <p className="mt-5 text-muted-foreground text-[15px] leading-relaxed">
          Start free. Scale into Pro when you outgrow it. Step into Elite for the full atelier treatment —
          featured placements, lowest commission, AI insights.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mt-14">
        {(plans ?? []).map((p: any, i: number) => {
          const featured = p.code === "pro";
          return (
            <div
              key={p.id}
              style={{ animationDelay: `${i * 80}ms` }}
              className={`relative animate-fade-up border hairline p-8 bg-card flex flex-col ${
                featured ? "ring-1 ring-accent shadow-[var(--shadow-luxe)]" : ""
              }`}
            >
              {featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-eyebrow bg-accent text-accent-foreground px-3 py-1">
                  Most popular
                </div>
              )}
              <div className="text-eyebrow text-muted-foreground">{p.name}</div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-display text-5xl">
                  ₹{(p.price_monthly / 100).toLocaleString("en-IN")}
                </span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{p.description}</p>
              <ul className="mt-6 space-y-3 text-sm flex-1">
                {(p.features ?? []).map((f: string) => (
                  <li key={f} className="flex gap-3">
                    <Check className="h-4 w-4 text-accent mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/sell"
                search={{ plan: p.code }}
                className={`mt-8 ${featured ? "btn-gold" : "btn-outline-dark"}`}
              >
                {p.code === "free" ? "Start free" : "Choose " + p.name}
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mt-20 text-center text-xs text-muted-foreground tracking-widest uppercase">
        <Sparkles className="inline h-3.5 w-3.5 mr-2 text-accent" /> Cancel any time · No setup fees
      </div>
    </main>
  );
}
