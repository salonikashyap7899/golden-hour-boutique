import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right" | "zoom";
  style?: CSSProperties;
}

export function ScrollReveal({ children, className = "", delay = 0, direction = "up", style }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const initial: Record<string, string> = {
      opacity: "0",
      transition: `opacity 0.8s cubic-bezier(0.2,0.8,0.2,1) ${delay}ms, transform 0.9s cubic-bezier(0.2,0.8,0.2,1) ${delay}ms`,
    };

    if (direction === "up") initial.transform = "perspective(900px) translateY(40px) translateZ(-30px)";
    else if (direction === "left") initial.transform = "perspective(900px) translateX(-50px) rotateY(8deg)";
    else if (direction === "right") initial.transform = "perspective(900px) translateX(50px) rotateY(-8deg)";
    else if (direction === "zoom") initial.transform = "perspective(900px) scale(0.88) translateZ(-60px)";

    Object.assign(el.style, initial);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "perspective(900px) translateY(0) translateX(0) translateZ(0) rotateY(0deg) scale(1)";
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, direction]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
