import { useEffect } from "react";

export function usePageAnimations() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: (() => void)[] = [];

    const init = async () => {
      const { gsap } = await import("@/lib/gsap-setup");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");

      if (prefersReduced) {
        gsap.globalTimeline.timeScale(0.01);
        return;
      }

      /* ── 1. HERO TEXT ENTRANCE — staggered slide-up (Pattern 1) ── */
      const heroEyebrow = document.querySelector<HTMLElement>(".hero-eyebrow");
      const heroTitle   = document.querySelector<HTMLElement>(".hero-title");
      const heroSub     = document.querySelector<HTMLElement>(".hero-subtitle");
      const heroCtas    = document.querySelector<HTMLElement>(".hero-ctas");
      const scrollInd   = document.querySelector<HTMLElement>(".scroll-indicator");

      if (heroTitle) {
        const els = [heroEyebrow, heroTitle, heroSub, heroCtas].filter(Boolean) as HTMLElement[];
        gsap.set(els, { opacity: 0, y: 32 });

        const tl = gsap.timeline({ delay: 0.2 });
        if (heroEyebrow) tl.to(heroEyebrow, { duration: 0.65, opacity: 1, y: 0, ease: "power2.out" });
        tl.to(heroTitle,  { duration: 1.1,  opacity: 1, y: 0, ease: "power3.out" }, "-=0.4");
        if (heroSub)  tl.to(heroSub,  { duration: 0.8, opacity: 1, y: 0, ease: "power2.out" }, "-=0.55");
        if (heroCtas) tl.to(heroCtas, { duration: 0.7, opacity: 1, y: 0, ease: "power2.out" }, "-=0.45");
        if (scrollInd) tl.to(scrollInd, { duration: 0.6, opacity: 1, ease: "power2.out" }, "-=0.2");
        cleanups.push(() => tl.kill());
      }

      /* ── 2. PARALLAX HERO BG (Pattern 7) ── */
      const parallaxBg = document.querySelector<HTMLElement>(".gsap-parallax-bg");
      if (parallaxBg) {
        const section = parallaxBg.closest("section");
        const a = gsap.to(parallaxBg, {
          y: 140,
          ease: "none",
          scrollTrigger: {
            trigger: section ?? parallaxBg,
            start: "top top",
            end: "bottom top",
            scrub: 1.4,
          },
        });
        cleanups.push(() => a.kill());
      }

      /* ── 3. SCROLL REVEAL — headings/sections (Pattern 2) ── */
      const reveals = gsap.utils.toArray<HTMLElement>(".gsap-reveal");
      reveals.forEach((el) => {
        const dir   = (el.dataset.dir ?? "up") as string;
        const delay = parseFloat(el.dataset.delay ?? "0");
        const fromVars: gsap.TweenVars = {
          opacity: 0,
          duration: 0.9,
          ease: "power2.out",
          delay,
          scrollTrigger: {
            trigger: el,
            start: "top 82%",
            toggleActions: "play none none none",
          },
        };
        if (dir === "up")    { fromVars.y = 50; }
        if (dir === "left")  { fromVars.x = -50; }
        if (dir === "right") { fromVars.x = 50; }
        if (dir === "zoom")  { fromVars.scale = 0.85; fromVars.y = 24; }
        const a = gsap.from(el, fromVars);
        cleanups.push(() => a.kill());
      });

      /* ── 4. STAGGERED CARD GRIDS (Pattern 5) ── */
      const cardGroups = document.querySelectorAll<HTMLElement>(".gsap-stagger-group");
      cardGroups.forEach((group) => {
        const cards = group.querySelectorAll<HTMLElement>(".gsap-card");
        if (!cards.length) return;
        const a = gsap.from(cards, {
          opacity: 0,
          y: 50,
          scale: 0.93,
          duration: 0.8,
          stagger: 0.1,
          ease: "power2.out",
          force3D: true,
          scrollTrigger: {
            trigger: group,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
        cleanups.push(() => a.kill());
      });

      /* ── 5. STAGGERED LIST ITEMS (Pattern 5 — footer etc) ── */
      const staggerLists = document.querySelectorAll<HTMLElement>(".gsap-stagger-list");
      staggerLists.forEach((list) => {
        const items = list.querySelectorAll<HTMLElement>(".gsap-list-item");
        if (!items.length) return;
        const a = gsap.from(items, {
          opacity: 0,
          x: -20,
          duration: 0.55,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: list,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
        cleanups.push(() => a.kill());
      });

      /* ── 6. CLIP-PATH IMAGE REVEALS ── */
      const clipEls = document.querySelectorAll<HTMLElement>(".gsap-clip");
      clipEls.forEach((el) => {
        const a = gsap.from(el, {
          clipPath: "inset(100% 0 0 0)",
          duration: 1.1,
          ease: "power4.out",
          scrollTrigger: {
            trigger: el,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
        cleanups.push(() => a.kill());
      });

      /* ── 7. EDITORIAL SPLIT REVEAL ── */
      const editorial = document.querySelector<HTMLElement>(".gsap-editorial");
      if (editorial) {
        const img  = editorial.querySelector<HTMLElement>(".gsap-editorial-img");
        const text = editorial.querySelector<HTMLElement>(".gsap-editorial-text");
        if (img && text) {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: editorial,
              start: "top 75%",
              toggleActions: "play none none none",
            },
          });
          tl.from(img,  { opacity: 0, x: -70, scale: 0.93, duration: 1.1, ease: "power3.out", force3D: true });
          tl.from(text, { opacity: 0, x: 70, duration: 1.1, ease: "power3.out", force3D: true }, "-=0.75");
          cleanups.push(() => tl.kill());
        }
      }

      /* ── 8. TRUST STRIP STAGGER ── */
      const trustItems = document.querySelectorAll<HTMLElement>(".gsap-trust-item");
      if (trustItems.length) {
        const a = gsap.from(trustItems, {
          opacity: 0,
          y: 35,
          scale: 0.90,
          duration: 0.75,
          stagger: 0.13,
          ease: "power2.out",
          scrollTrigger: {
            trigger: trustItems[0].closest("section") ?? trustItems[0],
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
        cleanups.push(() => a.kill());
      }

      /* ── 9. STATS COUNTER (Pattern 6) ── */
      const counters = document.querySelectorAll<HTMLElement>(".gsap-counter");
      counters.forEach((el) => {
        const target = parseFloat(el.dataset.target ?? "0");
        const obj = { val: 0 };
        const a = gsap.to(obj, {
          val: target,
          duration: 2.2,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" },
          onUpdate() {
            el.textContent = Number.isInteger(target)
              ? Math.round(obj.val).toString()
              : obj.val.toFixed(1);
          },
        });
        cleanups.push(() => a.kill());
      });

      /* ── 10. MAGNETIC BUTTONS ── */
      const magnetics = document.querySelectorAll<HTMLElement>(".magnetic");
      magnetics.forEach((el) => {
        const strength = parseFloat(el.dataset.strength ?? "0.35");
        const onMove = (e: MouseEvent) => {
          const rect = el.getBoundingClientRect();
          const dx = e.clientX - (rect.left + rect.width / 2);
          const dy = e.clientY - (rect.top + rect.height / 2);
          gsap.to(el, { x: dx * strength, y: dy * strength, duration: 0.4, ease: "power2.out" });
        };
        const onLeave = () => {
          gsap.to(el, { x: 0, y: 0, duration: 0.55, ease: "elastic.out(1, 0.5)" });
        };
        el.addEventListener("mousemove", onMove);
        el.addEventListener("mouseleave", onLeave);
        cleanups.push(() => {
          el.removeEventListener("mousemove", onMove);
          el.removeEventListener("mouseleave", onLeave);
        });
      });

      /* ── 11. MARQUEE HOVER PAUSE ── */
      const marquee = document.querySelector<HTMLElement>(".marquee-track");
      if (marquee) {
        const enterM = () => gsap.to(marquee, { timeScale: 0, duration: 0.5, ease: "power2.out" });
        const leaveM = () => gsap.to(marquee, { timeScale: 1, duration: 0.5, ease: "power2.in" });
        marquee.addEventListener("mouseenter", enterM);
        marquee.addEventListener("mouseleave", leaveM);
        cleanups.push(() => {
          marquee.removeEventListener("mouseenter", enterM);
          marquee.removeEventListener("mouseleave", leaveM);
        });
      }

      /* ── 12. RESIZE REFRESH ── */
      const onResize = () => ScrollTrigger.refresh();
      window.addEventListener("resize", onResize);
      cleanups.push(() => window.removeEventListener("resize", onResize));

      ScrollTrigger.refresh();
    };

    init();
    return () => cleanups.forEach((fn) => fn());
  }, []);
}
