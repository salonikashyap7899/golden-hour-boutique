import { useEffect, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function LenisProvider({ children }: Props) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let lenis: any;
    let tickerCb: ((time: number) => void) | null = null;
    let gsapRef: any = null;

    const init = async () => {
      const { default: Lenis } = await import("lenis");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      const { gsap } = await import("gsap");
      gsapRef = gsap;

      gsap.registerPlugin(ScrollTrigger);

      lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        touchMultiplier: 2,
      });

      lenis.on("scroll", ScrollTrigger.update);

      tickerCb = (time: number) => {
        lenis.raf(time * 1000);
      };
      gsap.ticker.add(tickerCb);
      gsap.ticker.lagSmoothing(0);
    };

    init();

    return () => {
      if (lenis) lenis.destroy();
      if (gsapRef && tickerCb) gsapRef.ticker.remove(tickerCb);
    };
  }, []);

  return <>{children}</>;
}
