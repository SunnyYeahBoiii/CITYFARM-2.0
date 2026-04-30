"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  /** Delay after intersecting (ms), for staggered lists */
  delayMs?: number;
};

export function ScrollReveal({ children, className = "", delayMs = 0 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setVisible(true);
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        if (delayMs > 0) {
          timer = setTimeout(() => setVisible(true), delayMs);
        } else {
          setVisible(true);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [delayMs]);

  return (
    <div
      ref={ref}
      className={`${className} ${visible ? "scroll-reveal-visible" : "scroll-reveal-hidden"}`.trim()}
    >
      {children}
    </div>
  );
}
