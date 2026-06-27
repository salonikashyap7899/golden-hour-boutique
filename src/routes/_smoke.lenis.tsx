import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_smoke/lenis")({
  component: SmokeLenis,
});

function SmokeLenis() {
  const [status, setStatus] = useState<{ lenis?: string; gsap?: string; scrollTrigger?: string; error?: string }>({});

  useEffect(() => {
    (async () => {
      try {
        const { default: Lenis } = await import("lenis");
        const { gsap } = await import("gsap");
        const { ScrollTrigger } = await import("gsap/ScrollTrigger");
        gsap.registerPlugin(ScrollTrigger);
        const lenis = new Lenis({ duration: 1.2 });
        const next: any = {
          lenis: typeof lenis.raf === "function" ? "ok" : "missing raf",
          gsap: typeof gsap.to === "function" ? "ok" : "missing",
          scrollTrigger: typeof ScrollTrigger.update === "function" ? "ok" : "missing",
        };
        setStatus(next);
        // eslint-disable-next-line no-console
        console.log("[smoke/lenis]", next);
        lenis.destroy();
      } catch (e: any) {
        setStatus({ error: e?.message ?? String(e) });
        // eslint-disable-next-line no-console
        console.error("[smoke/lenis] failed", e);
      }
    })();
  }, []);

  return (
    <main className="min-h-[200vh] p-10 font-mono text-sm">
      <h1 className="text-2xl mb-4">Lenis + GSAP smoke test</h1>
      <pre className="bg-black/5 p-4 rounded">{JSON.stringify(status, null, 2)}</pre>
      <p className="mt-6 opacity-60">Scroll to confirm smooth scroll is active.</p>
    </main>
  );
}
