"use client";

import { useEffect, useState } from "react";

type UseTypewriterOptions = {
  /** When false, `visible` equals full text immediately. */
  active: boolean;
  charsPerSec?: number;
};

export function useTypewriter(
  fullText: string,
  { active, charsPerSec = 42 }: UseTypewriterOptions,
): { visible: string; complete: boolean } {
  const [count, setCount] = useState(() => (active ? 0 : fullText.length));

  useEffect(() => {
    if (!active) {
      setCount(fullText.length);
    }
  }, [active, fullText.length]);

  useEffect(() => {
    if (!active) {
      return;
    }

    setCount(0);
    if (!fullText) {
      return;
    }

    const ms = Math.max(10, Math.floor(1000 / charsPerSec));
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      if (n >= fullText.length) {
        setCount(fullText.length);
        window.clearInterval(id);
      } else {
        setCount(n);
      }
    }, ms);

    return () => window.clearInterval(id);
  }, [fullText, active, charsPerSec]);

  return {
    visible: fullText.slice(0, count),
    complete: !fullText || count >= fullText.length,
  };
}
