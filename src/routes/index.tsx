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
      { name: "description", content: "Silk, cashmere, leather and gold. The Maison collection of considered objects, shipped from our Mumbai atelier." },
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
  "Silk", "·", "Cashmere", "·", "18K Gold", "·", "Atelier", "·",
  "Mumbai", "·", "Limited runs", "·", "Handfinished", "·", "Eternal", "·",
  "Silk", "·", "Cashmere", "·", "18K Gold", "·", "Atelier", "·",
  "Mumbai", "·", "Limited runs", "·", "Handfinished", "·", "Eternal", "·",
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

      {/* ════════ HERO ════════ */}
      <section className="relative bg-midnight overflow-hidden" style={{ minHeight: "100svh" }}>

        {/* Ambient orbs */}
        <div className="gold-orb absolute top-[-10%] right-[15%] w-[600px] h-[600px]" style={{ "--dur": "8s", "--delay": "0s" } as any} />
        <div className="gold-orb absolute bottom-[-5%] left-[5%] w-[400px] h-[400px]" style={{ "--dur": "10s", "--delay": "2s" } as any} />

        {/* Ghost watermark */}
        <div
          className="hero-ghost-num pointer-events-none select-none absolute left-[-1%] bottom-[-10%]"
          aria-hidden="true"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(20rem, 40vw, 60rem)",
            fontWeight: 400,
            lineHeight: 0.82,
            letterSpacing: "-0.08em",
            color: "transparent",
            WebkitTextStroke: "1px oklch(1 0 0 / 0.035)",
            opacity: 0,
            willChange: "opacity",
          }}
        >
          26
        </div>

        {/* Top meta */}
        <div className="hero-meta absolute top-0 inset-x-0 px-8 lg:px-14 pt-8 flex items-start justify-between z-10" style={{ opacity: 0 }}>
          <div className="text-eyebrow text-foreground/25 tracking-[0.42em]">Atelier · Autumn 2026</div>
          <div className="text-eyebrow text-foreground/25 tracking-[0.42em] hidden md:block">Est. 1998 · Mumbai</div>
          <div className="text-eyebrow text-accent/60 tracking-[0.42em]">New collection</div>
        </div>

        {/* Main grid */}
        <div className="relative z-10 grid lg:grid-cols-[1fr_1fr] min-h-screen items-stretch">

          {/* LEFT: Typography */}
          <div className="flex flex-col justify-end pb-16 px-8 lg:px-14 pt-40 lg:pt-0 order-2 lg:order-1">

            <div className="hero-eyebrow flex items-center gap-6 mb-10" style={{ opacity: 0 }}>
              <div className="h-px w-10 bg-accent/60 flex-shrink-0" />
              <div className="text-eyebrow text-accent/80 tracking-[0.40em]">The Maison Collection</div>
            </div>

            <div className="overflow-hidden mb-1">
              <h1 className="hero-line-1 text-display text-foreground/90 leading-[0.88]"
                style={{ fontSize: "clamp(4rem, 8.5vw, 9.5rem)", opacity: 0, transform: "translateY(110%)", willChange: "transform, opacity" }}>
                Quiet,
              </h1>
            </div>
            <div className="overflow-hidden mb-1">
              <h1 className="hero-line-2 text-display text-foreground/90 leading-[0.88]"
                style={{ fontSize: "clamp(4rem, 8.5vw, 9.5rem)", opacity: 0, transform: "translateY(110%)", willChange: "transform, opacity" }}>
                considered,
              </h1>
            </div>
            <div className="overflow-hidden mb-12">
              <h1 className="hero-line-3 text-display leading-[0.88] text-gold-shimmer"
                style={{ fontSize: "clamp(4rem, 8.5vw, 9.5rem)", opacity: 0, transform: "translateY(110%)", willChange: "transform, opacity" }}>
                eternal.
              </h1>
            </div>

            <p className="hero-sub text-[13.5px] leading-[2.1] text-foreground/38 max-w-[340px] mb-12 tracking-wide"
              style={{ opacity: 0, transform: "translateY(22px)" }}>
              Hand-finished silks, Italian wool and 18K gold —<br />
              made in limited runs from our Mumbai atelier.
            </p>

            <div className="hero-ctas flex flex-wrap items-center gap-6" style={{ opacity: 0 }}>
              <Link to="/shop" className="btn-gold magnetic" data-strength="0.25">
                Shop collection
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link to="/shop" search={{ category: "women" }} className="link-underline text-eyebrow text-foreground/35 hover:text-foreground/70 transition-colors duration-500">Women</Link>
              <Link to="/shop" search={{ category: "men" }} className="link-underline text-eyebrow text-foreground/35 hover:text-foreground/70 transition-colors duration-500">Men</Link>
            </div>

            <div className="hero-scroll mt-20 hidden lg:flex items-center gap-5" style={{ opacity: 0 }}>
              <ArrowDown className="h-3.5 w-3.5 text-accent/50 animate-bounce" />
              <div className="text-eyebrow text-foreground/20 tracking-[0.36em]">Scroll to explore</div>
            </div>
          </div>

          {/* RIGHT: Image */}
          <div className="hero-img-wrap relative order-1 lg:order-2 h-[60vw] lg:h-auto overflow-hidden"
            style={{ clipPath: "inset(100% 0 0 0)", willChange: "clip-path" }}>
            <img
              src={hero}
              alt="Aurelia silk gown — Maison atelier campaign"
              className="h-full w-full object-cover object-[62%_top] scale-[1.07]"
              style={{ willChange: "transform" }}
            />
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(180deg, oklch(0.08 0.005 48 / 0.25) 0%, transparent 30%, transparent 55%, oklch(0.08 0.005 48 / 0.65) 100%)" }} />
            <div className="absolute inset-0 pointer-events-none hidden lg:block"
              style={{ background: "linear-gradient(270deg, transparent 55%, oklch(0.08 0.005 48 / 0.5) 100%)" }} />

            {/* Floating badge */}
            <div className="hero-badge absolute bottom-12 left-10 z-10" style={{ opacity: 0 }}>
              <div className="px-7 py-5 border border-white/[0.1] backdrop-blur-md"
                style={{ background: "oklch(0.08 0.005 48 / 0.78)" }}>
                <div className="text-eyebrow text-accent/70 mb-1.5 tracking-[0.35em]">Featured</div>
                <div className="font-serif text-base text-foreground/90">Aurelia Silk Gown</div>
                <div className="text-eyebrow text-foreground/30 mt-1.5">₹ 14,500</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gold rule */}
        <div className="hero-strip absolute bottom-0 inset-x-0 h-px z-10 gold-rule" style={{ opacity: 0 }} />
      </section>

      {/* ════════ MARQUEE ════════ */}
      <div className="border-y border-white/[0.055] py-[18px] overflow-hidden"
        style={{ background: "oklch(0.095 0.005 48)" }}>
        <div className="marquee-track">
          {MARQUEE_WORDS.map((w, i) => (
            <span key={i}
              className="text-eyebrow px-8 whitespace-nowrap tracking-[0.38em]"
              style={{ color: w === "·" ? "oklch(0.730 0.105 72 / 0.55)" : "oklch(1 0 0 / 0.2)" }}>
              {w}
            </span>
          ))}
        </div>
      </div>

      {/* ════════ NEW ARRIVALS ════════ */}
      <section className="mx-auto max-w-[1480px] px-8 lg:px-14 mt-32 md:mt-44">
        <div className="gsap-reveal" data-dir="up">
          <div className="flex items-end justify-between gap-6 mb-14">
            <div>
              <div className="text-eyebrow text-accent/70 mb-4 tracking-[0.40em]">Just landed</div>
              <h2 className="text-display text-5xl md:text-6xl">New arrivals</h2>
            </div>
            <Link to="/shop" className="link-underline text-eyebrow text-foreground/35 hover:text-foreground/60 transition-colors hidden md:inline-block tracking-[0.35em]">View all</Link>
          </div>
        </div>
        <div className="gsap-stagger-group flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 -mx-8 px-8 lg:mx-0 lg:px-0 scrollbar-none">
          {newArrivals.map((p) => (
            <div key={p.id} className="min-w-[80%] sm:min-w-[44%] lg:min-w-[24%] snap-start">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>

      {/* ════════ STATS ════════ */}
      <section className="mx-auto max-w-[1480px] px-8 lg:px-14 mt-36 md:mt-48">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-white/[0.065]">
          {([
            ["28", "+", "Years of craft"],
            ["100", "%", "Handfinished"],
            ["4999", "₹", "Free shipping above"],
            ["30", "", "Day returns"],
          ] as const).map(([num, suffix, label], i) => (
            <div key={label} className={`py-12 px-10 text-center border-r border-white/[0.065] last:border-r-0 ${i > 1 ? "border-t border-white/[0.065] md:border-t-0" : ""}`}>
              <div className="stat-number">
                {suffix === "₹" && <span className="text-[0.52em] mr-1 align-middle opacity-70">₹</span>}
                <span className="gsap-counter" data-target={num}>0</span>
                {suffix !== "₹" && suffix && <span className="text-[0.55em] ml-1">{suffix}</span>}
              </div>
              <div className="text-eyebrow text-foreground/30 mt-4 tracking-[0.36em]">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ COLLECTIONS ════════ */}
      <section className="mx-auto max-w-[1480px] px-8 lg:px-14 mt-36 md:mt-52">
        <div className="gsap-reveal" data-dir="up">
          <div className="text-center mb-16">
            <div className="text-eyebrow text-accent/70 mb-5 tracking-[0.42em]">The house</div>
            <h2 className="text-display text-5xl md:text-6xl">Explore the collections</h2>
          </div>
        </div>
        <div className="gsap-stagger-group grid md:grid-cols-3 gap-3">
          {CATEGORIES.map((c) => (
            <Link key={c.to} to="/shop" search={{ category: c.to }}
              className="gsap-card group relative block overflow-hidden bg-midnight2 aspect-[3/4]">
              <img src={c.img} alt={c.label} loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.8s] ease-out group-hover:scale-[1.05]" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 30%, oklch(0.08 0.005 48 / 0.78))" }} />
              <div className="absolute inset-x-0 bottom-0 p-9 text-foreground">
                <div className="text-eyebrow text-foreground/40 mb-2.5 tracking-[0.38em]">{c.kicker}</div>
                <h3 className="text-display text-3xl md:text-4xl text-foreground/92">{c.label}</h3>
                <div className="mt-5 flex items-center gap-2.5 text-eyebrow text-accent/80 opacity-0 group-hover:opacity-100 transition-all duration-600 translate-y-2 group-hover:translate-y-0 tracking-[0.35em]">
                  Discover <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ════════ BEST SELLERS ════════ */}
      <section className="mx-auto max-w-[1480px] px-8 lg:px-14 mt-36 md:mt-52">
        <div className="gsap-reveal" data-dir="up">
          <div className="flex items-end justify-between gap-6 mb-14">
            <div>
              <div className="text-eyebrow text-accent/70 mb-4 tracking-[0.40em]">House favourites</div>
              <h2 className="text-display text-5xl md:text-6xl">Best sellers</h2>
            </div>
          </div>
        </div>
        <div className="gsap-stagger-group grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12 md:gap-x-5">
          {bestSellers.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* ════════ EDITORIAL STORY ════════ */}
      <section className="mt-36 md:mt-52" style={{ background: "oklch(0.098 0.005 48)" }}>
        <div className="gsap-editorial mx-auto max-w-[1480px] px-8 lg:px-14 py-28 md:py-40 grid md:grid-cols-2 gap-14 md:gap-28 items-center">
          <div className="gsap-editorial-img gsap-clip aspect-[4/5] overflow-hidden" style={{ willChange: "transform, opacity" }}>
            <img src={catWomen} alt="Atelier" loading="lazy" className="h-full w-full object-cover" />
          </div>
          <div className="gsap-editorial-text" style={{ willChange: "transform, opacity" }}>
            <div className="text-eyebrow text-accent/70 mb-6 tracking-[0.40em]">The house · est. 1998</div>
            <h2 className="text-display text-5xl md:text-6xl mb-8">A study in<br />restraint.</h2>
            <p className="text-[14px] leading-[2.0] text-foreground/42 max-w-[380px]">
              Maison began as a single atelier above a tailor's shop in Mumbai. Twenty-eight years on,
              we still make every garment in limited runs, by hand, with materials we'd be proud to wear
              ourselves — Mongolian cashmere, mulberry silk, vegetable-tanned Italian leather, 18K gold.
            </p>
            <Link to="/shop" className="btn-outline-dark mt-12 inline-flex magnetic" data-strength="0.28">
              Read our story
            </Link>
          </div>
        </div>
      </section>

      {/* ════════ THE CRAFT ════════ */}
      <section className="mx-auto max-w-[1480px] px-8 lg:px-14 mt-36 md:mt-52">
        <div className="gsap-reveal" data-dir="up">
          <div className="text-center mb-18">
            <div className="text-eyebrow text-accent/70 mb-5 tracking-[0.42em]">How we make it</div>
            <h2 className="text-display text-5xl md:text-6xl mb-18">The craft</h2>
          </div>
        </div>
        <div className="gsap-stagger-group grid md:grid-cols-3 border border-white/[0.065]">
          {([
            ["01", "Sourced with intent", "Every material travels to Mumbai from its origin — mulberry silk from Assam, cashmere from Mongolian highlands, leather from Florentine tanneries aged over 60 years."],
            ["02", "Cut & constructed by hand", "Each piece is cut on the same tables we've used since 1998. A single jacket takes up to 40 hours across eight artisans — no shortcuts, no machine finishes."],
            ["03", "Inspected, then delivered", "Before dispatch, every garment passes a 22-point atelier inspection. We ship in archival tissue and a reusable cloth bag — part of our lifetime care promise."],
          ] as const).map(([num, title, body]) => (
            <div key={num} className="p-12 md:p-14 border-b md:border-b-0 md:border-r border-white/[0.065] last:border-0">
              <div className="text-display text-[5rem] text-white/[0.04] mb-7 leading-none select-none font-serif">{num}</div>
              <div className="text-eyebrow text-accent/70 mb-4 tracking-[0.36em]">{title}</div>
              <p className="text-[13.5px] leading-[2.0] text-foreground/36">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ MATERIALS ════════ */}
      <section className="mt-36 md:mt-52" style={{ background: "oklch(0.098 0.005 48)" }}>
        <div className="mx-auto max-w-[1480px] px-8 lg:px-14 py-24 md:py-32">
          <div className="gsap-reveal" data-dir="up">
            <div className="text-center mb-16">
              <div className="text-eyebrow text-accent/70 mb-5 tracking-[0.42em]">What we work with</div>
              <h2 className="text-display text-5xl md:text-6xl">Materials of distinction</h2>
            </div>
          </div>
          <div className="gsap-stagger-group grid grid-cols-2 md:grid-cols-4 gap-3">
            {([
              ["Mulberry Silk", "Assam, India", "Harvested by hand, woven at 300 threads per inch for unparalleled drape."],
              ["Mongolian Cashmere", "Ulaanbaatar", "Grade A, dehaired to 14 microns. Impossibly soft, impossibly warm."],
              ["Vegetable Leather", "Florence, Italy", "60-year-old tanneries. Each hide patinas beautifully over time."],
              ["18K Gold", "Jaipur, India", "Hallmarked. Each piece set by a single craftsperson, by hand."],
            ] as const).map(([mat, origin, desc]) => (
              <div key={mat} className="p-8 border border-white/[0.07] hover:border-accent/25 transition-colors duration-700">
                <div className="text-eyebrow text-foreground/25 mb-4 tracking-[0.36em]">{origin}</div>
                <div className="font-serif text-lg text-foreground/85 mb-4 leading-snug">{mat}</div>
                <p className="text-[12px] leading-[1.9] text-foreground/32">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ TESTIMONIALS ════════ */}
      <section className="mx-auto max-w-[1480px] px-8 lg:px-14 mt-36 md:mt-52">
        <div className="gsap-reveal" data-dir="up">
          <div className="text-center mb-16">
            <div className="text-eyebrow text-accent/70 mb-5 tracking-[0.42em]">Our clients</div>
            <h2 className="text-display text-5xl md:text-6xl">Worn & loved</h2>
          </div>
        </div>
        <div className="gsap-stagger-group grid md:grid-cols-3 gap-3">
          {([
            ["The Aurelia gown arrived in the most beautiful archival packaging I've ever encountered. I wore it to a gallery opening in Delhi — every person asked where it was from.", "Priya M.", "Mumbai · Regular client"],
            ["I've been buying luxury menswear for 20 years. Maison's tailoring stands up to anything from Milan. The cashmere coat is extraordinary — it only improves with age.", "Arjun S.", "Delhi · 4 pieces owned"],
            ["Ordered the silk blouse and it arrived in two days, perfectly inspected. Returned something once — they resolved it within 24 hours, no questions, no fuss.", "Simran K.", "Bengaluru · New client"],
          ] as const).map(([quote, name, detail]) => (
            <div key={name} className="p-10 md:p-12 border border-white/[0.07] flex flex-col justify-between gap-10 hover:border-accent/20 transition-colors duration-700" style={{ minHeight: "300px" }}>
              <p className="font-serif text-[17px] leading-[1.8] text-foreground/55 italic">"{quote}"</p>
              <div>
                <div className="h-px gold-rule mb-6" />
                <div className="text-sm text-foreground/70 tracking-wide">{name}</div>
                <div className="text-eyebrow text-foreground/25 mt-1.5 tracking-[0.34em]">{detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ LOOKBOOK ════════ */}
      <section className="mx-auto max-w-[1480px] px-8 lg:px-14 mt-36 md:mt-52">
        <div className="gsap-reveal" data-dir="up">
          <div className="flex items-end justify-between gap-6 mb-14">
            <div>
              <div className="text-eyebrow text-accent/70 mb-4 tracking-[0.40em]">Autumn 2026</div>
              <h2 className="text-display text-5xl md:text-6xl">The lookbook</h2>
            </div>
            <Link to="/shop" className="link-underline text-eyebrow text-foreground/30 hover:text-foreground/55 transition-colors hidden md:inline-block tracking-[0.35em]">Shop the edit</Link>
          </div>
        </div>
        <div className="gsap-stagger-group grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3" style={{ gridTemplateRows: "auto auto" }}>
          <div className="col-span-2 row-span-2 overflow-hidden bg-midnight2 relative group" style={{ aspectRatio: "4/5" }}>
            <img src={catWomen} alt="Women" loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.8s] ease-out group-hover:scale-[1.04]" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 50%, oklch(0.08 0.005 48 / 0.7))" }} />
            <div className="absolute bottom-8 left-8">
              <div className="text-eyebrow text-foreground/45 mb-2 tracking-[0.36em]">Women</div>
              <div className="font-serif text-xl text-foreground/90">The Atelier Collection</div>
            </div>
          </div>
          <div className="overflow-hidden bg-midnight2 relative group" style={{ aspectRatio: "1/1" }}>
            <img src={catMen} alt="Men" loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.8s] ease-out group-hover:scale-[1.04]" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, oklch(0.08 0.005 48 / 0.6))" }} />
            <div className="absolute bottom-5 left-5"><div className="font-serif text-base text-foreground/85">Men</div></div>
          </div>
          <div className="overflow-hidden bg-midnight2 relative group" style={{ aspectRatio: "1/1" }}>
            <img src={catAccessories} alt="Accessories" loading="lazy" className="h-full w-full object-cover transition-transform duration-[1.8s] ease-out group-hover:scale-[1.04]" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, oklch(0.08 0.005 48 / 0.6))" }} />
            <div className="absolute bottom-5 left-5"><div className="font-serif text-base text-foreground/85">Accessories</div></div>
          </div>
          <div className="overflow-hidden bg-midnight2 relative group" style={{ aspectRatio: "1/1" }}>
            <img src={hero} alt="Evening" loading="lazy" className="h-full w-full object-cover object-[62%_top] transition-transform duration-[1.8s] ease-out group-hover:scale-[1.04]" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, oklch(0.08 0.005 48 / 0.6))" }} />
            <div className="absolute bottom-5 left-5"><div className="font-serif text-base text-foreground/85">Evening</div></div>
          </div>
          <Link to="/shop" className="flex items-center justify-center border border-white/[0.07] hover:border-accent/30 transition-colors duration-700 group" style={{ aspectRatio: "1/1", background: "oklch(0.098 0.005 48)" }}>
            <div className="text-center">
              <div className="font-serif text-xl text-foreground/40 group-hover:text-foreground/65 transition-colors duration-500">View all</div>
              <div className="text-eyebrow text-accent/50 mt-2.5 group-hover:text-accent/80 transition-colors duration-500 tracking-[0.35em]">Shop the edit →</div>
            </div>
          </Link>
        </div>
      </section>

      {/* ════════ NEWSLETTER ════════ */}
      <section className="mt-36 md:mt-52" style={{ background: "oklch(0.098 0.005 48)" }}>
        <div className="mx-auto max-w-[1480px] px-8 lg:px-14 py-28 md:py-40 grid md:grid-cols-2 gap-16 items-center">
          <div className="gsap-reveal" data-dir="left">
            <div className="text-eyebrow text-accent/70 mb-6 tracking-[0.42em]">The Maison letter</div>
            <h2 className="text-display text-5xl md:text-6xl mb-6">First<br />to know.</h2>
            <p className="text-[13.5px] leading-[2.0] text-foreground/36 max-w-[340px]">
              New collections, atelier notes, and exclusive access — delivered when it matters. No noise. No weekly blasts. Only the things worth knowing.
            </p>
          </div>
          <div className="gsap-reveal" data-dir="right">
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-0">
              <input
                type="email" placeholder="your@email.com"
                className="flex-1 bg-transparent border border-white/[0.12] px-6 py-4 text-sm text-foreground placeholder:text-foreground/22 focus:outline-none focus:border-accent/40 transition-colors duration-400"
              />
              <button type="submit" className="btn-gold whitespace-nowrap">Subscribe</button>
            </form>
            <p className="text-[11px] text-foreground/20 mt-5 leading-relaxed tracking-wide">
              We respect your privacy. Unsubscribe at any time. No spam — ever.
            </p>
          </div>
        </div>
      </section>

      {/* ════════ TRUST STRIP ════════ */}
      <section className="mx-auto max-w-[1480px] px-8 lg:px-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 py-16 border-b border-white/[0.065]">
          {([
            ["Free shipping",   "On orders above ₹4,999"],
            ["Easy returns",    "30-day, no questions"],
            ["Atelier-crafted", "Made in limited runs"],
            ["Lifetime care",   "Repair & restoration"],
          ] as const).map(([h, s], i) => (
            <div key={h} className={`gsap-trust-item text-center md:text-left px-6 py-8 border-r border-white/[0.065] last:border-r-0 ${i > 1 ? "border-t border-white/[0.065] md:border-t-0" : ""}`}
              style={{ willChange: "transform, opacity" }}>
              <div className="text-eyebrow text-accent/65 mb-3 tracking-[0.38em]">{h}</div>
              <div className="text-[13px] text-foreground/32 leading-relaxed">{s}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
