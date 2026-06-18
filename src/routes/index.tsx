import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import hero from "@/assets/hero.jpg";
import catWomen from "@/assets/cat-women.jpg";
import catMen from "@/assets/cat-men.jpg";
import catAccessories from "@/assets/cat-accessories.jpg";
import { PRODUCTS } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maison — Editorial luxury, considered objects" },
      { name: "description", content: "Silk, cashmere, leather and gold. The Maison collection of considered objects, shipped from our atelier." },
      { property: "og:title", content: "Maison — Editorial luxury" },
      { property: "og:description", content: "Silk, cashmere, leather and gold. The Maison collection." },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

const CATEGORIES = [
  { label: "Women", to: "women", img: catWomen, kicker: "The Atelier collection" },
  { label: "Men", to: "men", img: catMen, kicker: "Tailoring & outerwear" },
  { label: "Accessories", to: "accessories", img: catAccessories, kicker: "Leather, silk, gold" },
] as const;

function Index() {
  const newArrivals = PRODUCTS.filter((p) => p.isNew);
  const bestSellers = PRODUCTS.filter((p) => p.bestSeller);

  return (
    <main>
      {/* HERO */}
      <section className="relative h-[88vh] min-h-[640px] w-full overflow-hidden bg-foreground">
        <img
          src={hero}
          alt="Aurelia silk gown — Maison atelier campaign"
          width={1920}
          height={1280}
          className="absolute inset-0 h-full w-full object-cover object-[70%_center] animate-ken-burns"
        />
        <div className="absolute inset-0" style={{ background: "var(--gradient-fade)" }} />
        <div className="absolute inset-0 flex items-end md:items-center">
          <div className="mx-auto max-w-[1400px] w-full px-6 lg:px-10 pb-16 md:pb-0">
            <div className="max-w-xl text-background animate-fade-up">
              <div className="text-eyebrow text-accent">Atelier · Autumn 26</div>
              <h1 className="text-display text-5xl md:text-7xl lg:text-[5.5rem] mt-5">
                Quiet,<br/> considered,<br/><em className="not-italic text-accent">eternal.</em>
              </h1>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-background/80">
                Hand-finished silks, Italian wool and 18K gold — the new Atelier collection, made in limited runs.
              </p>
              <div className="mt-9 flex flex-wrap gap-4">
                <Link to="/shop" className="btn-gold">Shop the collection <ArrowRight className="h-4 w-4" /></Link>
                <Link to="/shop" search={{ category: "women" }} className="btn-ghost-dark">Women</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 mt-24 md:mt-32">
        <div className="flex items-end justify-between gap-6 mb-10">
          <div>
            <div className="text-eyebrow text-accent">Just landed</div>
            <h2 className="text-display text-4xl md:text-5xl mt-3">New arrivals</h2>
          </div>
          <Link to="/shop" className="link-underline text-eyebrow hidden md:inline-block">View all</Link>
        </div>
        <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 px-6 lg:mx-0 lg:px-0 scrollbar-none">
          {newArrivals.map((p) => (
            <div key={p.id} className="min-w-[78%] sm:min-w-[44%] lg:min-w-[24%] snap-start">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 mt-28 md:mt-40">
        <div className="text-center mb-12">
          <div className="text-eyebrow text-accent">The house</div>
          <h2 className="text-display text-4xl md:text-5xl mt-3">Explore the collections</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {CATEGORIES.map((c) => (
            <Link
              key={c.to}
              to="/shop"
              search={{ category: c.to }}
              className="group relative block overflow-hidden bg-secondary aspect-[3/4]"
            >
              <img
                src={c.img}
                alt={c.label}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, oklch(0 0 0 / 0.55))" }} />
              <div className="absolute inset-x-0 bottom-0 p-8 text-background">
                <div className="text-eyebrow text-background/70">{c.kicker}</div>
                <h3 className="text-display text-3xl md:text-4xl mt-2">{c.label}</h3>
                <div className="mt-4 flex items-center gap-2 text-eyebrow opacity-90">
                  Discover <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 mt-28 md:mt-40">
        <div className="flex items-end justify-between gap-6 mb-10">
          <div>
            <div className="text-eyebrow text-accent">House favourites</div>
            <h2 className="text-display text-4xl md:text-5xl mt-3">Best sellers</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6">
          {bestSellers.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* EDITORIAL STORY */}
      <section className="mt-28 md:mt-40 bg-secondary">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-20 md:py-32 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="aspect-[4/5] overflow-hidden">
            <img src={catWomen} alt="Atelier" loading="lazy" className="h-full w-full object-cover" />
          </div>
          <div>
            <div className="text-eyebrow text-accent">The house · est. 1998</div>
            <h2 className="text-display text-4xl md:text-5xl mt-4">A study in restraint.</h2>
            <p className="mt-6 text-[15px] leading-[1.85] text-muted-foreground max-w-md">
              Maison began as a single atelier above a tailor's shop in Mumbai. Twenty-eight years on,
              we still make every garment in limited runs, by hand, with materials we'd be proud to wear
              ourselves — Mongolian cashmere, mulberry silk, vegetable-tanned Italian leather, 18K gold.
            </p>
            <Link to="/shop" className="btn-outline-dark mt-9">Read our story</Link>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 mt-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10 border-y hairline">
          {[
            ["Free shipping", "On orders above ₹4,999"],
            ["Easy returns", "30-day, no questions"],
            ["Atelier-crafted", "Made in limited runs"],
            ["Lifetime care", "Repair & restoration"],
          ].map(([h, s]) => (
            <div key={h} className="text-center md:text-left">
              <div className="text-eyebrow text-accent">{h}</div>
              <div className="text-sm mt-2 text-muted-foreground">{s}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
