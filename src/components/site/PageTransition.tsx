import { useEffect, useRef } from "react";
import { useRouter } from "@tanstack/react-router";

const STRIPS = 5;

export function PageTransition() {
  const router   = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const init = async () => {
      const { gsap } = await import("../../lib/gsap-setup.ts");
      const overlay  = overlayRef.current;
      if (!overlay) return;

      const strips = Array.from(overlay.querySelectorAll<HTMLElement>(".pt-strip"));

      gsap.set(strips, { scaleY: 0, transformOrigin: "top" });

      const coverScreen = () =>
        gsap.timeline()
          .to(strips, {
            scaleY: 1,
            duration: 0.55,
            ease: "power3.inOut",
            stagger: 0.055,
          });

      const revealScreen = () =>
        gsap.timeline()
          .set(strips, { transformOrigin: "bottom" })
          .to(strips, {
            scaleY: 0,
            duration: 0.55,
            ease: "power3.inOut",
            stagger: { each: 0.055, from: "end" },
            onComplete: () => {
              gsap.set(strips, { transformOrigin: "top", scaleY: 0 });
              isAnimating.current = false;
            },
          });

      const unsubscribe = router.subscribe("onBeforeNavigate", async () => {
        if (isAnimating.current) return;
        isAnimating.current = true;
        overlay.style.pointerEvents = "all";
        await coverScreen();
      });

      const unsubscribe2 = router.subscribe("onLoad", async () => {
        overlay.style.pointerEvents = "none";
        await revealScreen();
      });

      return () => {
        unsubscribe();
        unsubscribe2();
      };
    };

    let cleanup: (() => void) | undefined;
    init().then((c) => { cleanup = c; });

    return () => { cleanup?.(); };
  }, [router]);

  return (
    <div id="page-transition" ref={overlayRef}>
      {Array.from({ length: STRIPS }).map((_, i) => (
        <div key={i} className="pt-strip" />
      ))}
    </div>
  );
}
