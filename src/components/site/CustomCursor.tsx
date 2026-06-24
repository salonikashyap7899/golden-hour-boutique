import { useEffect } from "react";

export function CustomCursor() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const dot  = document.getElementById("cursor-dot");
    const ring = document.getElementById("cursor-ring");
    if (!dot || !ring) return;

    let mouseX = 0, mouseY = 0;
    let ringX  = 0, ringY  = 0;
    let rafId: number;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = mouseX + "px";
      dot.style.top  = mouseY + "px";
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const tick = () => {
      ringX = lerp(ringX, mouseX, 0.11);
      ringY = lerp(ringY, mouseY, 0.11);
      ring.style.left = ringX + "px";
      ring.style.top  = ringY + "px";
      rafId = requestAnimationFrame(tick);
    };
    tick();

    const onEnter = () => {
      dot.style.opacity  = "1";
      ring.style.opacity = "1";
    };
    const onLeave = () => {
      dot.style.opacity  = "0";
      ring.style.opacity = "0";
    };

    window.addEventListener("mousemove", onMove);
    document.documentElement.addEventListener("mouseenter", onEnter);
    document.documentElement.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <>
      <div id="cursor-dot"  style={{ opacity: 0 }} />
      <div id="cursor-ring" style={{ opacity: 0 }} />
    </>
  );
}
