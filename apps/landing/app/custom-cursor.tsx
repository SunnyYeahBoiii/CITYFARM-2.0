"use client";

import { useEffect, useRef } from "react";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const dotPos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const glowPos = useRef({ x: -100, y: -100 });
  const hoveringRef = useRef(false);
  const pressingRef = useRef(false);
  const visibleRef = useRef(false);
  const rafRef = useRef(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (reduceMotion || coarsePointer) return;

    document.body.classList.add("has-custom-cursor");

    const setTransform = (el: HTMLDivElement | null, x: number, y: number, scale: number) => {
      if (!el) return;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;
    };

    const isInteractive = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      return !!target.closest(
        "a, button, [role='button'], input, textarea, select, summary, label, .cursor-hover-target",
      );
    };

    const onMove = (e: MouseEvent) => {
      dotPos.current.x = e.clientX;
      dotPos.current.y = e.clientY;
      hoveringRef.current = isInteractive(e.target);
      visibleRef.current = true;
    };

    const onDown = () => {
      pressingRef.current = true;
    };
    const onUp = () => {
      pressingRef.current = false;
    };

    const onLeaveWindow = () => {
      visibleRef.current = false;
    };

    const tick = () => {
      const ringLerp = 0.15;
      const glowLerp = 0.08;
      ringPos.current.x += (dotPos.current.x - ringPos.current.x) * ringLerp;
      ringPos.current.y += (dotPos.current.y - ringPos.current.y) * ringLerp;
      glowPos.current.x += (dotPos.current.x - glowPos.current.x) * glowLerp;
      glowPos.current.y += (dotPos.current.y - glowPos.current.y) * glowLerp;

      const hover = hoveringRef.current;
      const press = pressingRef.current;
      const vis = visibleRef.current;
      const dotScale = vis ? (hover ? 0.4 : 1) : 0;
      let ringScale = vis ? (hover ? 1.72 : 1) : 0.55;
      if (press) ringScale *= 0.88;
      const glowScale = vis ? (hover ? 1.35 : 1) : 0.4;
      const ringOpacity = vis ? 1 : 0;

      if (ringRef.current) {
        ringRef.current.classList.toggle("cursor-ring--hover", Boolean(vis && hover));
        ringRef.current.classList.toggle("cursor-ring--press", Boolean(vis && press));
      }

      if (dotRef.current) {
        dotRef.current.style.opacity = vis ? String(hover ? 0.92 : 1) : "0";
        setTransform(dotRef.current, dotPos.current.x, dotPos.current.y, dotScale);
      }
      if (ringRef.current) {
        ringRef.current.style.opacity = String(ringOpacity * (hover ? 0.92 : 0.58));
        setTransform(ringRef.current, ringPos.current.x, ringPos.current.y, ringScale);
      }
      if (glowRef.current) {
        glowRef.current.style.opacity = String(ringOpacity * (hover ? 0.55 : 0.28));
        setTransform(glowRef.current, glowPos.current.x, glowPos.current.y, glowScale);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.documentElement.addEventListener("mouseleave", onLeaveWindow);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      document.body.classList.remove("has-custom-cursor");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeaveWindow);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <div ref={glowRef} className="cursor-glow" aria-hidden />
      <div ref={ringRef} className="cursor-ring" aria-hidden />
      <div ref={dotRef} className="cursor-dot" aria-hidden />
    </>
  );
}
