import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ArrowDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import hero from "@/assets/hero.jpg";
import catWomen from "@/assets/cat-women.jpg";
import catMen from "@/assets/cat-men.jpg";
import catAccessories from "@/assets/cat-accessories.jpg";
import { PRODUCTS } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";
import { listPublicProducts } from "@/lib/api/catalog.functions";
import { usePageAnimations } from "@/hooks/use-page-animations";

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
  { label: "Women",       to: "women",       img: catWomen,       kicker: "The Atelier collection" },
  { label: "Men",         to: "men",         img: catMen,         kicker: "Tailoring & outerwear"  },
  { label: "Accessories", to: "accessories", img: catAccessories, kicker: "Leather, silk, gold"    },
] as const;

const MARQUEE_WORDS = [
  "Silk", "·", "Cashmere", "·", "Gold", "·", "Atelier", "·",
  "Limited runs", "·", "Mumbai", "·", "Considered", "·", "Eternal", "·",
  "Silk", "·", "Cashmere", "·", "Gold", "·", "Atelier", "·",
  "Limited runs", "·", "Mumbai", "·", "Considered", "·", "Eternal", "·",
];

function Index() {
  const fetchProducts = useServerFn(listPublicProducts);
  const { data: dbProducts } = useQuery({ queryKey: ["public-products"], queryFn: () => fetchProducts(), staleTime: 30_000 });
  const merged = (() => {
    const seen = new Set<string>();
    const out: any[] = [];
    for (const p of (dbProducts ?? [])) { if (!seen.has(p.slug)) { seen.add(p.slug); out.push(p); } }
    for (const p of PRODUCTS) { if (!seen.has(p.slug)) { seen.add(p.slug); out.push(p); } }
    return out;
  })();
  const newArrivals = merged.filter((p) => p.isNew).slice(0, 8);
  const bestSellers = merged.filter((p) => p.bestSeller).slice(0, 8);

  usePageAnimations();

  return (
    <main>

      {/* ════════════════════════════════════════
          HERO — Editorial Split Screen
          ════════════════════════════════════════ */}
      <section className="relative bg-midnight overflow-hidden" style={{ minHeight: "100svh" }}>

        {/* Ghost collection number — background watermark */}
        <div
          className="hero-ghost-num pointer-events-none select-none absolute left-[-2%] bottom-[-8%]"
          aria-hidden="true"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(18rem, 38vw, 56rem)",
            fontWeight: 700,
            lineHeight: 0.85,
            letterSpacing: "-0.06em",
            color: "transparent",
            WebkitTextStroke: "1px oklch(1 0 0 / 0.045)",
            opacity: 0,
            willChange: "opacity",
          }}
        >
          26
        </div>

        {/* Top meta bar */}
        <div className="hero-meta absolute top-8 inset-x-0 px-7 lg:px-14 flex items-center justify-between z-10"
          style={{ opacity: 0 }}>
          <div className="text-eyebrow text-foreground/35 tracking-[0.35em]">Atelier · Autumn 2026</div>
          <div className="text-eyebrow text-foreground/35 tracking-[0.35em] hidden md:block">No. 01 — 12</div>
          <div className="text-eyebrow text-accent/70 tracking-[0.35em]">New collection</div>
        </div>

        {/* Main hero grid */}
        <div className="relative z-10 grid lg:grid-cols-[1fr_1fr] min-h-screen items-stretch">

          {/* ── LEFT: Typography ── */}
          <div className="flex flex-col justify-end pb-14 px-7 lg:px-14 pt-36 lg:pt-0 order-2 lg:order-1">

            {/* Eyebrow with rule */}
            <div className="hero-eyebrow flex items-center gap-5 mb-9" style={{ opacity: 0 }}>
              <div className="h-px w-12 bg-accent flex-shrink-0" />
              <div className="text-eyebrow text-accent tracking-[0.32em]">The Maison Collection</div>
            </div>

            {/* Main headline */}
            <div className="overflow-hidden mb-1">
              <h1
                className="hero-line-1 text-display leading-[0.9]"
                style={{
                  fontSize: "clamp(3.8rem, 8vw, 8.5rem)",
                  opacity: 0,
                  transform: "translateY(110%)",
                  willChange: "transform, opacity",
                }}
              >
                Quiet,
              </h1>
            </div>
            <div className="overflow-hidden mb-1">
              <h1
                className="hero-line-2 text-display leading-[0.9]"
                style={{
                  fontSize: "clamp(3.8rem, 8vw, 8.5rem)",
                  opacity: 0,
                  transform: "translateY(110%)",
                  willChange: "transform, opacity",
                }}
              >
                considered,
              </h1>
            </div>
            <div className="overflow-hidden mb-10">
              <h1
                className="hero-line-3 text-display leading-[0.9] text-gold-shimmer"
                style={{
                  fontSize: "clamp(3.8rem, 8vw, 8.5rem)",
                  opacity: 0,
                  transform: "translateY(110%)",
                  willChange: "transform, opacity",
                }}
              >
                eternal.
              </h1>
            </div>

            {/* Sub copy */}
            <p
              className="hero-sub text-[14px] leading-[1.95] text-foreground/45 max-w-sm mb-11"
              style={{ opacity: 0, transform: "translateY(20px)" }}
            >
              Hand-finished silks, Italian wool and 18K gold —<br />
              made in limited runs, from our Mumbai atelier.
            </p>

            {/* CTAs */}
            <div className="hero-ctas flex flex-wrap items-center gap-5" style={{ opacity: 0 }}>
              <Link
                to="/shop"
                className="btn-gold magnetic group"
                data-strength="0.28"
              >
                Shop collection
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/shop"
                search={{ category: "women" }}
                className="link-underline text-eyebrow text-foreground/45 hover:text-accent"
              >
                Women
              </Link>
              <Link
                to="/shop"
                search={{ category: "men" }}
                className="link-underline text-eyebrow text-foreground/45 hover:text-accent"
              >
                Men
              </Link>
            </div>

            {/* Scroll cue */}
            <div
              className="hero-scroll mt-16 hidden lg:flex items-center gap-4"
              style={{ opacity: 0 }}
            >
              <ArrowDown className="h-4 w-4 text-accent animate-bounce" />
              <div className="text-eyebrow text-foreground/25 tracking-[0.3em]">Scroll to explore</div>
            </div>
          </div>

          {/* ── RIGHT: Image ── */}
          <div
            className="hero-img-wrap relative order-1 lg:order-2 h-[56vw] lg:h-auto overflow-hidden"
            style={{ clipPath: "inset(100% 0 0 0)", willChange: "clip-path" }}
          >
            <img
              src={hero}
              alt="Aurelia silk gown — Maison atelier campaign"
              className="h-full w-full object-cover object-[62%_top] scale-[1.08]"
              style={{ willChange: "transform" }}
            />
            {/* Edge vignettes */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(180deg, oklch(0.095 0.004 55 / 0.22) 0%, transparent 25%, transparent 65%, oklch(0.095 0.004 55 / 0.55) 100%)",
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none hidden lg:block"
              style={{
                background: "linear-gradient(270deg, transparent 60%, oklch(0.095 0.004 55 / 0.35) 100%)",
              }}
            />

            {/* Floating badge */}
            <div
              className="hero-badge absolute bottom-10 left-8 lg:left-10 z-10"
              style={{ opacity: 0 }}
            >
              <div
                className="px-6 py-4 border border-white/15 backdrop-blur-md"
                style={{ background: "oklch(0.095 0.004 55 / 0.72)" }}
              >
                <div className="text-eyebrow text-accent/80 mb-1">Featured</div>
                <div className="text-sm text-foreground font-serif">Aurelia Silk Gown</div>
                <div className="text-eyebrow text-foreground/35 mt-1">₹14,500</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom accent strip */}
        <div
          className="hero-strip absolute bottom-0 inset-x-0 h-px z-10"
          style={{ background: "linear-gradient(90deg, transparent, var(--gold), transparent)", opacity: 0 }}
        />
      </section>

      {/* ── MARQUEE ── */}
      <div className="border-y border-white/[0.07] py-5 overflow-hidden bg-midnight/60">
        <div className="marquee-track">
          {MARQUEE_WORDS.map((w, i) => (
            <span
              key={i}
              className="text-eyebrow text-foreground/30 px-6 whitespace-nowrap"
              style={{ color: w === "·" ? "var(--gold)" : undefined, opacity: w === "·" ? 0.5 : undefined }}
            >
              {w}
            </span>
          ))}
        </div>
      </div>

      {/* ── NEW ARRIVALS ── */}
      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 mt-24 md:mt-32">
        <div className="gsap-reveal" data-dir="up">
          <div className="flex items-end justify-between gap-6 mb-12">
            <div>
              <div className="text-eyebrow text-accent mb-3">Just landed</div>
              <h2 className="text-display text-4xl md:text-5xl">New arrivals</h2>
            </div>
            <Link to="/shop" className="link-underline text-eyebrow text-foreground/50 hidden md:inline-block">View all</Link>
          </div>
        </div>
        <div className="gsap-stagger-group flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 -mx-6 px-6 lg:mx-0 lg:px-0 scrollbar-none">
          {newArrivals.map((p) => (
            <div key={p.id} className="min-w-[78%] sm:min-w-[44%] lg:min-w-[24%] snap-start">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 mt-28 md:mt-36">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 py-14 border-y border-white/[0.07]">
          {([
            ["28", "+", "Years of craft"],
            ["100", "%", "Handfinished"],
            ["4999", "₹", "Free shipping above"],
            ["30", "", "Day returns"],
          ] as const).map(([num, suffix, label]) => (
            <div key={label} className="text-center md:text-left">
              <div className="stat-number">
                {suffix === "₹" && <span className="text-[0.55em] mr-0.5 align-middle">₹</span>}
                <span className="gsap-counter" data-target={num}>0</span>
                {suffix !== "₹" && suffix}
              </div>
              <div className="text-eyebrow text-foreground/40 mt-3">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 mt-28 md:mt-40">
        <div className="gsap-reveal" data-dir="up">
          <div className="text-center mb-14">
            <div className="text-eyebrow text-accent mb-4">The house</div>
            <h2 className="text-display text-4xl md:text-5xl">Explore the collections</h2>
          </div>
        </div>
        <div className="gsap-stagger-group grid md:grid-cols-3 gap-4 md:gap-5">
          {CATEGORIES.map((c) => (
            <Link
              key={c.to}
              to="/shop"
              search={{ category: c.to }}
              className="gsap-card group relative block overflow-hidden bg-midnight2 aspect-[3/4]"
            >
              <img
                src={c.img}
                alt={c.label}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-[1.06]"
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 35%, oklch(0 0 0 / 0.7))" }} />
              <div className="absolute inset-x-0 bottom-0 p-8 text-foreground">
                <div className="text-eyebrow text-foreground/50 mb-2">{c.kicker}</div>
                <h3 className="text-display text-3xl md:text-4xl">{c.label}</h3>
                <div className="mt-4 flex items-center gap-2 text-eyebrow text-accent opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-2 group-hover:translate-y-0">
                  Discover <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── BEST SELLERS ── */}
      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 mt-28 md:mt-40">
        <div className="gsap-reveal" data-dir="up">
          <div className="flex items-end justify-between gap-6 mb-12">
            <div>
              <div className="text-eyebrow text-accent mb-3">House favourites</div>
              <h2 className="text-display text-4xl md:text-5xl">Best sellers</h2>
            </div>
          </div>
        </div>
        <div className="gsap-stagger-group grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-5">
          {bestSellers.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* ── EDITORIAL STORY ── */}
      <section className="gsap-editorial mt-28 md:mt-40 bg-midnight2 border-y border-white/[0.06]">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-24 md:py-36 grid md:grid-cols-2 gap-12 md:gap-24 items-center">
          <div
            className="gsap-editorial-img gsap-clip aspect-[4/5] overflow-hidden"
            style={{ willChange: "transform, opacity" }}
          >
            <img src={catWomen} alt="Atelier" loading="lazy" className="h-full w-full object-cover" />
          </div>
          <div className="gsap-editorial-text" style={{ willChange: "transform, opacity" }}>
            <div className="text-eyebrow text-accent mb-5">The house · est. 1998</div>
            <h2 className="text-display text-4xl md:text-5xl mb-7">A study in restraint.</h2>
            <p className="text-[15px] leading-[1.9] text-foreground/55 max-w-md">
              Maison began as a single atelier above a tailor's shop in Mumbai. Twenty-eight years on,
              we still make every garment in limited runs, by hand, with materials we'd be proud to wear
              ourselves — Mongolian cashmere, mulberry silk, vegetable-tanned Italian leather, 18K gold.
            </p>
            <Link to="/shop" className="btn-outline-dark mt-10 inline-flex magnetic" data-strength="0.3">
              Read our story
            </Link>
          </div>
        </div>
      </section>

      {/* ── THE CRAFT ── */}
      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 mt-28 md:mt-40">
        <div className="gsap-reveal" data-dir="up">
          <div className="text-center mb-16">
            <div className="text-eyebrow text-accent mb-4">How we make it</div>
            <h2 className="text-display text-4xl md:text-5xl">The craft</h2>
          </div>
        </div>
        <div className="gsap-stagger-group grid md:grid-cols-3 gap-0 border border-white/[0.07]">
          {([
            ["01", "Sourced with intent", "Every material travels to Mumbai from its origin — mulberry silk from Assam, cashmere from Mongolian highlands, leather from Florentine tanneries aged over 60 years."],
            ["02", "Cut & constructed by hand", "Each piece is cut on the same tables we've used since 1998. A single jacket takes up to 40 hours across eight artisans — no shortcuts, no machine finishes."],
            ["03", "Inspected, then delivered", "Before dispatch, every garment passes a 22-point atelier inspection. We ship in archival tissue and a reusable cloth bag — part of our lifetime care promise."],
          ] as const).map(([num, title, body]) => (
            <div key={num} className="p-10 md:p-12 border-b md:border-b-0 md:border-r border-white/[0.07] last:border-0">
              <div className="text-display text-6xl text-white/[0.06] mb-6 leading-none select-none">{num}</div>
              <div className="text-eyebrow text-accent mb-3">{title}</div>
              <p className="text-[14px] leading-[1.9] text-foreground/45">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MATERIALS STRIP ── */}
      <section className="mt-28 md:mt-40 bg-midnight2 border-y border-white/[0.06] py-16 md:py-20">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="gsap-reveal" data-dir="up">
            <div className="text-center mb-12">
              <div className="text-eyebrow text-accent mb-4">What we work with</div>
              <h2 className="text-display text-3xl md:text-4xl">Materials of distinction</h2>
            </div>
          </div>
          <div className="gsap-stagger-group grid grid-cols-2 md:grid-cols-4 gap-6">
            {([
              ["Mulberry Silk", "Assam, India", "Harvested by hand, woven at 300 threads per inch."],
              ["Mongolian Cashmere", "Ulaanbaatar", "Grade A, dehaired to 14 microns. Impossibly soft."],
              ["Vegetable-tanned Leather", "Florence, Italy", "60-year-old tanneries. Patinas beautifully over time."],
              ["18K Gold", "Jaipur, India", "Hallmarked. Each piece set by a single craftsperson."],
            ] as const).map(([mat, origin, desc]) => (
              <div key={mat} className="p-6 border border-white/[0.08] hover:border-accent/30 transition-colors duration-500">
                <div className="text-eyebrow text-accent/60 text-[10px] mb-3">{origin}</div>
                <div className="font-serif text-lg text-foreground/90 mb-3">{mat}</div>
                <p className="text-[12px] leading-relaxed text-foreground/40">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 mt-28 md:mt-40">
        <div className="gsap-reveal" data-dir="up">
          <div className="text-center mb-14">
            <div className="text-eyebrow text-accent mb-4">Our clients</div>
            <h2 className="text-display text-4xl md:text-5xl">Worn & loved</h2>
          </div>
        </div>
        <div className="gsap-stagger-group grid md:grid-cols-3 gap-6">
          {([
            ["The Aurelia gown arrived in the most beautiful archival packaging I've ever seen. I wore it to a gallery opening in Delhi — every person asked where it was from.", "Priya M.", "Mumbai · Regular client"],
            ["I've been buying luxury menswear for 20 years. Maison's tailoring stands up to anything from Milan. The cashmere coat is extraordinary — it only gets better with age.", "Arjun S.", "Delhi · 4 pieces owned"],
            ["Ordered the silk blouse and it arrived in two days, perfectly inspected. Returned something once — they sorted it within 24 hours, no questions, no fuss.", "Simran K.", "Bengaluru · New client"],
          ] as const).map(([quote, name, detail]) => (
            <div key={name} className="p-8 md:p-10 border border-white/[0.08] flex flex-col justify-between gap-8 hover:border-accent/20 transition-colors duration-500">
              <p className="font-serif text-[17px] leading-[1.75] text-foreground/70 italic">"{quote}"</p>
              <div>
                <div className="text-sm text-foreground/80">{name}</div>
                <div className="text-eyebrow text-foreground/30 mt-1">{detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── LOOKBOOK GRID ── */}
      <section className="mx-auto max-w-[1400px] px-6 lg:px-10 mt-28 md:mt-40">
        <div className="gsap-reveal" data-dir="up">
          <div className="flex items-end justify-between gap-6 mb-12">
            <div>
              <div className="text-eyebrow text-accent mb-3">Autumn 2026</div>
              <h2 className="text-display text-4xl md:text-5xl">The lookbook</h2>
            </div>
            <Link to="/shop" className="link-underline text-eyebrow text-foreground/50 hidden md:inline-block">Shop the edit</Link>
          </div>
        </div>
        <div className="gsap-stagger-group grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="col-span-2 row-span-2 aspect-[4/5] overflow-hidden bg-midnight2 relative group">
            <img src={catWomen} alt="Women's collection" loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.04]" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 50%, oklch(0 0 0 / 0.55))" }} />
            <div className="absolute bottom-6 left-6">
              <div className="text-eyebrow text-foreground/60 mb-1">Women</div>
              <div className="font-serif text-xl text-foreground">The Atelier Collection</div>
            </div>
          </div>
          <div className="aspect-square overflow-hidden bg-midnight2 relative group">
            <img src={catMen} alt="Men's collection" loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.04]" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, oklch(0 0 0 / 0.5))" }} />
            <div className="absolute bottom-4 left-4">
              <div className="font-serif text-base text-foreground">Men</div>
            </div>
          </div>
          <div className="aspect-square overflow-hidden bg-midnight2 relative group">
            <img src={catAccessories} alt="Accessories" loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.04]" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, oklch(0 0 0 / 0.5))" }} />
            <div className="absolute bottom-4 left-4">
              <div className="font-serif text-base text-foreground">Accessories</div>
            </div>
          </div>
          <div className="aspect-square overflow-hidden bg-midnight2 relative group">
            <img src={hero} alt="Hero campaign" loading="lazy" className="h-full w-full object-cover object-[62%_top] transition-transform duration-[1.4s] ease-out group-hover:scale-[1.04]" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, oklch(0 0 0 / 0.5))" }} />
            <div className="absolute bottom-4 left-4">
              <div className="font-serif text-base text-foreground">Evening</div>
            </div>
          </div>
          <div className="aspect-square bg-midnight2 flex items-center justify-center border border-white/[0.06] hover:border-accent/30 transition-colors duration-500 group cursor-pointer">
            <Link to="/shop" className="text-center p-6">
              <div className="font-serif text-2xl text-foreground/60 group-hover:text-foreground transition-colors duration-300">View all</div>
              <div className="text-eyebrow text-accent mt-2">Shop the edit →</div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ── */}
      <section className="mt-28 md:mt-40 bg-midnight2 border-y border-white/[0.06]">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10 py-24 md:py-32 grid md:grid-cols-2 gap-12 items-center">
          <div className="gsap-reveal" data-dir="left">
            <div className="text-eyebrow text-accent mb-5">The Maison letter</div>
            <h2 className="text-display text-4xl md:text-5xl mb-5">First to know.</h2>
            <p className="text-[14px] leading-[1.9] text-foreground/45 max-w-sm">
              New collections, atelier notes, and exclusive access — delivered when it matters. No noise, no weekly blasts. Just the things worth knowing.
            </p>
          </div>
          <div className="gsap-reveal" data-dir="right">
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 bg-transparent border border-white/20 px-5 py-3.5 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent transition-colors duration-300"
              />
              <button type="submit" className="btn-gold whitespace-nowrap">
                Subscribe
              </button>
            </form>
            <p className="text-[11px] text-foreground/25 mt-4 leading-relaxed">
              We respect your privacy. Unsubscribe at any time. No spam — ever.
            </p>
          </div>
        </div>
      </section>

      {/* ── TRUST STRIP ── */}
      <section className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-14 border-b border-white/[0.07]">
          {([
            ["Free shipping",   "On orders above ₹4,999"],
            ["Easy returns",    "30-day, no questions"],
            ["Atelier-crafted", "Made in limited runs"],
            ["Lifetime care",   "Repair & restoration"],
          ] as const).map(([h, s]) => (
            <div key={h} className="gsap-trust-item text-center md:text-left" style={{ willChange: "transform, opacity" }}>
              <div className="text-eyebrow text-accent mb-2">{h}</div>
              <div className="text-sm text-foreground/45 leading-relaxed">{s}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
