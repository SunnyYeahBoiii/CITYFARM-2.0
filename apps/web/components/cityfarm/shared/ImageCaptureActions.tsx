"use client";

import { useRef, type ChangeEvent } from "react";
import { CameraIcon, ImageIcon } from "./icons";
import { cn } from "./ui";

export type CaptureSource = "camera" | "gallery";

interface ImageCaptureActionsProps {
  onSelect: (file: File, source: CaptureSource) => void;
  disabled?: boolean;
  accept?: string;
  captureFacingMode?: "environment" | "user";
  cameraLabel?: string;
  galleryLabel?: string;
  actionsClassName?: string;
  cameraButtonClassName?: string;
  galleryButtonClassName?: string;
  hint?: string;
  hintClassName?: string;
}

export function ImageCaptureActions({
  onSelect,
  disabled = false,
  accept = "image/*",
  captureFacingMode = "environment",
  cameraLabel = "Open Camera",
  galleryLabel = "Choose from Gallery",
  actionsClassName,
  cameraButtonClassName,
  galleryButtonClassName,
  hint,
  hintClassName,
}: ImageCaptureActionsProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleChange =
    (source: CaptureSource) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file || disabled) {
        return;
      }

      onSelect(file, source);
    };

  return (
    <>
      <div className={cn("grid gap-3", actionsClassName)}>
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled}
          className={cameraButtonClassName}
        >
          <CameraIcon />
          {cameraLabel}
        </button>
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={disabled}
          className={galleryButtonClassName}
        >
          <ImageIcon />
          {galleryLabel}
        </button>
      </div>

      {hint ? <div className={hintClassName}>{hint}</div> : null}

      <input
        ref={cameraInputRef}
        type="file"
        accept={accept}
        capture={captureFacingMode}
        hidden
        onChange={handleChange("camera")}
        disabled={disabled}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept={accept}
        hidden
        onChange={handleChange("gallery")}
        disabled={disabled}
      />
    </>
  );
}
