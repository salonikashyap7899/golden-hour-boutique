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

      /* ─────────────────────────────────────────────────────────
         HERO — Editorial entrance (split-line reveal)
         ───────────────────────────────────────────────────────── */
      const heroMeta     = document.querySelector<HTMLElement>(".hero-meta");
      const heroEyebrow  = document.querySelector<HTMLElement>(".hero-eyebrow");
      const heroLine1    = document.querySelector<HTMLElement>(".hero-line-1");
      const heroLine2    = document.querySelector<HTMLElement>(".hero-line-2");
      const heroLine3    = document.querySelector<HTMLElement>(".hero-line-3");
      const heroSub      = document.querySelector<HTMLElement>(".hero-sub");
      const heroCtas     = document.querySelector<HTMLElement>(".hero-ctas");
      const heroScroll   = document.querySelector<HTMLElement>(".hero-scroll");
      const heroImgWrap  = document.querySelector<HTMLElement>(".hero-img-wrap");
      const heroImgEl    = heroImgWrap?.querySelector<HTMLElement>("img");
      const heroBadge    = document.querySelector<HTMLElement>(".hero-badge");
      const heroGhost    = document.querySelector<HTMLElement>(".hero-ghost-num");
      const heroStrip    = document.querySelector<HTMLElement>(".hero-strip");

      if (heroLine1) {
        const tl = gsap.timeline({ delay: 0.08 });

        /* 1. Image wipe in from bottom */
        if (heroImgWrap) {
          tl.to(heroImgWrap, {
            clipPath: "inset(0% 0 0 0)",
            duration: 1.2,
            ease: "power4.inOut",
          }, 0);
        }
        /* Subtle image scale-down to rest position */
        if (heroImgEl) {
          tl.to(heroImgEl, {
            scale: 1,
            duration: 1.8,
            ease: "power3.out",
          }, 0.1);
        }

        /* 2. Meta bar */
        if (heroMeta) {
          tl.to(heroMeta, { opacity: 1, duration: 0.7, ease: "power2.out" }, 0.4);
        }
        /* 3. Eyebrow */
        if (heroEyebrow) {
          tl.to(heroEyebrow, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, 0.55);
        }

        /* 4. Headline lines slide up one by one */
        tl.to(heroLine1, { opacity: 1, y: "0%", duration: 0.85, ease: "power3.out" }, 0.65);
        tl.to(heroLine2, { opacity: 1, y: "0%", duration: 0.85, ease: "power3.out" }, 0.78);
        tl.to(heroLine3, { opacity: 1, y: "0%", duration: 0.85, ease: "power3.out" }, 0.91);

        /* 5. Sub-copy */
        if (heroSub) {
          tl.to(heroSub, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, 1.0);
        }
        /* 6. CTAs */
        if (heroCtas) {
          tl.to(heroCtas, { opacity: 1, y: 0, duration: 0.65, ease: "power2.out" }, 1.1);
        }
        /* 7. Scroll cue */
        if (heroScroll) {
          tl.to(heroScroll, { opacity: 1, duration: 0.6, ease: "power2.out" }, 1.25);
        }
        /* 8. Floating badge */
        if (heroBadge) {
          tl.to(heroBadge, { opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.6)" }, 1.3);
          gsap.set(heroBadge, { y: 16 });
        }
        /* 9. Ghost number */
        if (heroGhost) {
          tl.to(heroGhost, { opacity: 1, duration: 1.4, ease: "power2.out" }, 0.4);
        }
        /* 10. Gold strip */
        if (heroStrip) {
          tl.to(heroStrip, { opacity: 1, duration: 0.9, ease: "power2.out" }, 1.1);
        }

        cleanups.push(() => tl.kill());
      }

      /* ─────────────────────────────────────────────────────────
         SHOP PAGE — header reveal + sidebar + grid
         ───────────────────────────────────────────────────────── */
      const shopHeader = document.querySelector<HTMLElement>(".shop-header");
      const shopSidebar = document.querySelector<HTMLElement>(".shop-sidebar");

      if (shopHeader) {
        const tl = gsap.timeline({ delay: 0.1 });
        gsap.set(shopHeader, { opacity: 0, y: 30 });
        tl.to(shopHeader, { opacity: 1, y: 0, duration: 0.85, ease: "power3.out" });
        if (shopSidebar) {
          gsap.set(shopSidebar, { opacity: 0, x: -30 });
          tl.to(shopSidebar, { opacity: 1, x: 0, duration: 0.75, ease: "power2.out" }, "-=0.5");
        }
        cleanups.push(() => tl.kill());
      }

      /* ─────────────────────────────────────────────────────────
         PRODUCT DETAIL PAGE
         ───────────────────────────────────────────────────────── */
      const productGallery = document.querySelector<HTMLElement>(".product-gallery");
      const productInfo    = document.querySelector<HTMLElement>(".product-info");

      if (productGallery && productInfo) {
        const tl = gsap.timeline({ delay: 0.08 });
        const galleryImgs = productGallery.querySelectorAll<HTMLElement>(".gallery-img-wrap");

        gsap.set(galleryImgs, { clipPath: "inset(100% 0 0 0)", scale: 1.05 });
        gsap.set(productInfo, { opacity: 0, x: 40 });

        tl.to(galleryImgs[0], {
          clipPath: "inset(0% 0 0 0)",
          scale: 1,
          duration: 1.15,
          ease: "power4.inOut",
        }, 0);
        if (galleryImgs[1]) {
          tl.to(galleryImgs[1], {
            clipPath: "inset(0% 0 0 0)",
            scale: 1,
            duration: 1.0,
            ease: "power4.inOut",
          }, 0.22);
        }
        if (galleryImgs[2]) {
          tl.to(galleryImgs[2], {
            clipPath: "inset(0% 0 0 0)",
            scale: 1,
            duration: 1.0,
            ease: "power4.inOut",
          }, 0.38);
        }
        tl.to(productInfo, { opacity: 1, x: 0, duration: 0.9, ease: "power3.out" }, 0.35);

        cleanups.push(() => tl.kill());
      }

      /* ─────────────────────────────────────────────────────────
         SCROLL REVEAL — generic sections (Pattern 2)
         ───────────────────────────────────────────────────────── */
      const reveals = gsap.utils.toArray<HTMLElement>(".gsap-reveal");
      reveals.forEach((el) => {
        const dir   = el.dataset.dir ?? "up";
        const delay = parseFloat(el.dataset.delay ?? "0");
        const vars: gsap.TweenVars = {
          opacity: 0, duration: 0.9, ease: "power2.out", delay,
          scrollTrigger: { trigger: el, start: "top 82%", toggleActions: "play none none none" },
        };
        if (dir === "up")    vars.y = 50;
        if (dir === "left")  vars.x = -50;
        if (dir === "right") vars.x = 50;
        if (dir === "zoom")  { vars.scale = 0.87; vars.y = 24; }
        const a = gsap.from(el, vars);
        cleanups.push(() => a.kill());
      });

      /* ─────────────────────────────────────────────────────────
         STAGGERED CARD GRIDS (Pattern 5)
         ───────────────────────────────────────────────────────── */
      const cardGroups = document.querySelectorAll<HTMLElement>(".gsap-stagger-group");
      cardGroups.forEach((group) => {
        const cards = group.querySelectorAll<HTMLElement>(".gsap-card, .min-w-\\[78\\%\\], .min-w-\\[44\\%\\]");
        if (!cards.length) return;
        const a = gsap.from(cards, {
          opacity: 0, y: 50, scale: 0.94,
          duration: 0.8, stagger: 0.09,
          ease: "power2.out", force3D: true,
          scrollTrigger: { trigger: group, start: "top 80%", toggleActions: "play none none none" },
        });
        cleanups.push(() => a.kill());
      });

      /* ─────────────────────────────────────────────────────────
         SHOP PRODUCT GRID STAGGER
         ───────────────────────────────────────────────────────── */
      const shopGrid = document.querySelector<HTMLElement>(".shop-product-grid");
      if (shopGrid) {
        const cards2 = shopGrid.querySelectorAll<HTMLElement>(".gsap-card");
        if (cards2.length) {
          const a = gsap.from(cards2, {
            opacity: 0, y: 45, scale: 0.95,
            duration: 0.75, stagger: 0.065,
            ease: "power2.out", force3D: true,
            delay: 0.15,
          });
          cleanups.push(() => a.kill());
        }
      }

      /* ─────────────────────────────────────────────────────────
         STAGGERED LIST ITEMS — footer (Pattern 5)
         ───────────────────────────────────────────────────────── */
      const staggerLists = document.querySelectorAll<HTMLElement>(".gsap-stagger-list");
      staggerLists.forEach((list) => {
        const items = list.querySelectorAll<HTMLElement>(".gsap-list-item");
        if (!items.length) return;
        const a = gsap.from(items, {
          opacity: 0, x: -18, duration: 0.55, stagger: 0.07,
          ease: "power2.out",
          scrollTrigger: { trigger: list, start: "top 88%", toggleActions: "play none none none" },
        });
        cleanups.push(() => a.kill());
      });

      /* ─────────────────────────────────────────────────────────
         CLIP-PATH REVEALS
         ───────────────────────────────────────────────────────── */
      const clipEls = document.querySelectorAll<HTMLElement>(".gsap-clip");
      clipEls.forEach((el) => {
        const a = gsap.from(el, {
          clipPath: "inset(100% 0 0 0)", duration: 1.15, ease: "power4.out",
          scrollTrigger: { trigger: el, start: "top 80%", toggleActions: "play none none none" },
        });
        cleanups.push(() => a.kill());
      });

      /* ─────────────────────────────────────────────────────────
         EDITORIAL SPLIT
         ───────────────────────────────────────────────────────── */
      const editorial = document.querySelector<HTMLElement>(".gsap-editorial");
      if (editorial) {
        const img  = editorial.querySelector<HTMLElement>(".gsap-editorial-img");
        const text = editorial.querySelector<HTMLElement>(".gsap-editorial-text");
        if (img && text) {
          const tl = gsap.timeline({
            scrollTrigger: { trigger: editorial, start: "top 75%", toggleActions: "play none none none" },
          });
          tl.from(img,  { opacity: 0, x: -70, scale: 0.93, duration: 1.1, ease: "power3.out", force3D: true });
          tl.from(text, { opacity: 0, x: 70, duration: 1.1, ease: "power3.out", force3D: true }, "-=0.75");
          cleanups.push(() => tl.kill());
        }
      }

      /* ─────────────────────────────────────────────────────────
         TRUST STRIP
         ───────────────────────────────────────────────────────── */
      const trustItems = document.querySelectorAll<HTMLElement>(".gsap-trust-item");
      if (trustItems.length) {
        const a = gsap.from(trustItems, {
          opacity: 0, y: 35, scale: 0.90, duration: 0.75, stagger: 0.13,
          ease: "power2.out",
          scrollTrigger: {
            trigger: trustItems[0].closest("section") ?? trustItems[0],
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
        cleanups.push(() => a.kill());
      }

      /* ─────────────────────────────────────────────────────────
         STATS COUNTER (Pattern 6)
         ───────────────────────────────────────────────────────── */
      const counters = document.querySelectorAll<HTMLElement>(".gsap-counter");
      counters.forEach((el) => {
        const target = parseFloat(el.dataset.target ?? "0");
        const obj = { val: 0 };
        const a = gsap.to(obj, {
          val: target, duration: 2.2, ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" },
          onUpdate() { el.textContent = Number.isInteger(target) ? Math.round(obj.val).toLocaleString("en-IN") : obj.val.toFixed(1); },
        });
        cleanups.push(() => a.kill());
      });

      /* ─────────────────────────────────────────────────────────
         PARALLAX BG (Pattern 7)
         ───────────────────────────────────────────────────────── */
      const parallaxBg = document.querySelector<HTMLElement>(".gsap-parallax-bg");
      if (parallaxBg) {
        const section = parallaxBg.closest("section");
        const a = gsap.to(parallaxBg, {
          y: 140, ease: "none",
          scrollTrigger: {
            trigger: section ?? parallaxBg,
            start: "top top", end: "bottom top",
            scrub: 1.4,
          },
        });
        cleanups.push(() => a.kill());
      }

      /* ─────────────────────────────────────────────────────────
         MAGNETIC BUTTONS
         ───────────────────────────────────────────────────────── */
      const magnetics = document.querySelectorAll<HTMLElement>(".magnetic");
      magnetics.forEach((el) => {
        const strength = parseFloat(el.dataset.strength ?? "0.35");
        const onMove = (e: MouseEvent) => {
          const rect = el.getBoundingClientRect();
          const dx = e.clientX - (rect.left + rect.width / 2);
          const dy = e.clientY - (rect.top + rect.height / 2);
          gsap.to(el, { x: dx * strength, y: dy * strength, duration: 0.4, ease: "power2.out" });
        };
        const onLeave = () => gsap.to(el, { x: 0, y: 0, duration: 0.55, ease: "elastic.out(1, 0.5)" });
        el.addEventListener("mousemove", onMove);
        el.addEventListener("mouseleave", onLeave);
        cleanups.push(() => {
          el.removeEventListener("mousemove", onMove);
          el.removeEventListener("mouseleave", onLeave);
        });
      });

      /* ─────────────────────────────────────────────────────────
         RELATED PRODUCT REVEAL
         ───────────────────────────────────────────────────────── */
      const relatedSection = document.querySelector<HTMLElement>(".related-products");
      if (relatedSection) {
        const relCards = relatedSection.querySelectorAll<HTMLElement>(".gsap-card");
        if (relCards.length) {
          const a = gsap.from(relCards, {
            opacity: 0, y: 40, scale: 0.94, duration: 0.75, stagger: 0.1,
            ease: "power2.out", force3D: true,
            scrollTrigger: { trigger: relatedSection, start: "top 82%", toggleActions: "play none none none" },
          });
          cleanups.push(() => a.kill());
        }
      }

      /* ─────────────────────────────────────────────────────────
         RESIZE REFRESH
         ───────────────────────────────────────────────────────── */
      const onResize = () => ScrollTrigger.refresh();
      window.addEventListener("resize", onResize);
      cleanups.push(() => window.removeEventListener("resize", onResize));

      ScrollTrigger.refresh();
    };

    init();
    return () => cleanups.forEach((fn) => fn());
  }, []);
}
