import { useRef, useCallback } from "react";

export function useTilt(intensity = 12) {
  const ref = useRef<HTMLElement | null>(null);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(800px) rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg) scale3d(1.02,1.02,1.02)`;
      el.style.transition = "transform 0.08s linear";
      const shine = el.querySelector<HTMLElement>(".tilt-shine");
      if (shine) {
        shine.style.background = `radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgba(255,255,255,0.28) 0%, transparent 65%)`;
        shine.style.opacity = "1";
      }
    },
    [intensity],
  );

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)";
    el.style.transition = "transform 0.6s cubic-bezier(0.2,0.8,0.2,1)";
    const shine = el.querySelector<HTMLElement>(".tilt-shine");
    if (shine) shine.style.opacity = "0";
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}
