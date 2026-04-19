"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { CloseIcon } from "./icons";

export function ZoomableImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[240] flex flex-col bg-black"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 pb-2 pt-[max(0.6rem,env(safe-area-inset-top))]">
        <p className="min-w-0 truncate text-xs font-medium text-white/65">Pinch or double-tap to zoom</p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/18 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
          aria-label="Close full screen image"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="relative min-h-0 flex-1 touch-none">
        <TransformWrapper
          key={src}
          initialScale={1}
          minScale={0.85}
          maxScale={5}
          centerOnInit
          limitToBounds={false}
          doubleClick={{ mode: "toggle", step: 1.65 }}
          wheel={{ step: 0.09 }}
          pinch={{ step: 5 }}
        >
          <TransformComponent
            wrapperClass="!h-full !w-full"
            contentClass="!flex !h-full !w-full !items-center !justify-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- blob/data URLs and zoom need a plain img */}
            <img
              src={src}
              alt={alt}
              className="max-h-[calc(100dvh-3.5rem)] max-w-full object-contain select-none"
              draggable={false}
            />
          </TransformComponent>
        </TransformWrapper>
      </div>
    </div>,
    document.body,
  );
}
