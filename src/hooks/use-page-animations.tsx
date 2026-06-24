import { useEffect } from "react";

export function usePageAnimations() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let cleanup: (() => void)[] = [];

    const init = async () => {
      const { gsap } = await import("@/lib/gsap-setup");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");

      if (prefersReduced) {
        gsap.globalTimeline.timeScale(0.01);
        return;
      }

      /* ── HERO ENTRANCE TIMELINE (Pattern 1) ── */
      const heroEyebrow = document.querySelector<HTMLElement>(".hero-eyebrow");
      const heroTitle   = document.querySelector<HTMLElement>(".hero-title");
      const heroSub     = document.querySelector<HTMLElement>(".hero-subtitle");
      const heroCtas    = document.querySelector<HTMLElement>(".hero-ctas");

      if (heroTitle) {
        const els = [heroEyebrow, heroTitle, heroSub, heroCtas].filter(Boolean) as HTMLElement[];
        gsap.set(els, { opacity: 0, y: 30 });

        const tl = gsap.timeline({ delay: 0.15 });
        if (heroEyebrow) tl.to(heroEyebrow, { duration: 0.7, opacity: 1, y: 0, ease: "power2.out" });
        tl.to(heroTitle,  { duration: 1.0, opacity: 1, y: 0, ease: "power3.out" }, "-=0.45");
        if (heroSub)  tl.to(heroSub,  { duration: 0.8, opacity: 1, y: 0, ease: "power2.out" }, "-=0.55");
        if (heroCtas) tl.to(heroCtas, { duration: 0.7, opacity: 1, y: 0, ease: "power2.out" }, "-=0.45");
        cleanup.push(() => tl.kill());
      }

      /* ── SCROLL REVEAL — sections (Pattern 2) ── */
      const reveals = gsap.utils.toArray<HTMLElement>(".gsap-reveal");
      reveals.forEach((el) => {
        const dir   = (el.dataset.dir as string) ?? "up";
        const delay = parseFloat(el.dataset.delay ?? "0");
        const fromVars: gsap.TweenVars = {
          opacity: 0,
          duration: 0.85,
          ease: "power2.out",
          delay,
          scrollTrigger: {
            trigger: el,
            start: "top 82%",
            toggleActions: "play none none none",
          },
        };
        if (dir === "up")    fromVars.y = 44;
        if (dir === "left")  fromVars.x = -44;
        if (dir === "right") fromVars.x = 44;
        if (dir === "zoom")  { fromVars.scale = 0.88; fromVars.y = 20; }

        const anim = gsap.from(el, fromVars);
        cleanup.push(() => anim.kill());
      });

      /* ── STAGGERED CARD GRIDS (Pattern 5) ── */
      const cardGroups = document.querySelectorAll<HTMLElement>(".gsap-stagger-group");
      cardGroups.forEach((group) => {
        const cards = group.querySelectorAll<HTMLElement>(".gsap-card");
        if (!cards.length) return;
        const anim = gsap.from(cards, {
          opacity: 0,
          y: 40,
          scale: 0.94,
          duration: 0.75,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: group,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
        cleanup.push(() => anim.kill());
      });

      /* ── STAGGERED LIST ITEMS (Pattern 5 — footer/nav) ── */
      const staggerLists = document.querySelectorAll<HTMLElement>(".gsap-stagger-list");
      staggerLists.forEach((list) => {
        const items = list.querySelectorAll<HTMLElement>(".gsap-list-item");
        if (!items.length) return;
        const anim = gsap.from(items, {
          opacity: 0,
          x: -18,
          duration: 0.55,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: list,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
        cleanup.push(() => anim.kill());
      });

      /* ── PARALLAX HERO BG (Pattern 7) ── */
      const parallaxBg = document.querySelector<HTMLElement>(".gsap-parallax-bg");
      if (parallaxBg) {
        const anim = gsap.to(parallaxBg, {
          y: 120,
          ease: "none",
          scrollTrigger: {
            trigger: parallaxBg.closest("section") ?? parallaxBg,
            start: "top top",
            end: "bottom top",
            scrub: 1.2,
          },
        });
        cleanup.push(() => anim.kill());
      }

      /* ── PARALLAX TEXT (floats slower than scroll) ── */
      const parallaxText = document.querySelector<HTMLElement>(".gsap-parallax-text");
      if (parallaxText) {
        const anim = gsap.to(parallaxText, {
          y: -60,
          ease: "none",
          scrollTrigger: {
            trigger: parallaxText.closest("section") ?? parallaxText,
            start: "top top",
            end: "bottom top",
            scrub: 1,
          },
        });
        cleanup.push(() => anim.kill());
      }

      /* ── COUNTER ANIMATION (Pattern 6 — trust strip) ── */
      const counters = document.querySelectorAll<HTMLElement>(".gsap-counter");
      counters.forEach((el) => {
        const target = parseFloat(el.dataset.target ?? "0");
        const anim = gsap.to(el, {
          innerText: target,
          duration: 2,
          snap: { innerText: target % 1 === 0 ? 1 : 0.1 },
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
        cleanup.push(() => anim.kill());
      });

      /* ── EDITORIAL SECTION — pinned reveal ── */
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
          tl.from(img,  { opacity: 0, x: -60, scale: 0.94, duration: 1, ease: "power3.out" });
          tl.from(text, { opacity: 0, x: 60, duration: 1, ease: "power3.out" }, "-=0.7");
          cleanup.push(() => tl.kill());
        }
      }

      /* ── TRUST STRIP ITEMS ── */
      const trustItems = document.querySelectorAll<HTMLElement>(".gsap-trust-item");
      if (trustItems.length) {
        const anim = gsap.from(trustItems, {
          opacity: 0,
          y: 30,
          scale: 0.92,
          duration: 0.7,
          stagger: 0.12,
          ease: "power2.out",
          scrollTrigger: {
            trigger: trustItems[0].closest("section") ?? trustItems[0],
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
        cleanup.push(() => anim.kill());
      }

      ScrollTrigger.refresh();
    };

    init();

    return () => {
      cleanup.forEach((fn) => fn());
    };
  }, []);
}
