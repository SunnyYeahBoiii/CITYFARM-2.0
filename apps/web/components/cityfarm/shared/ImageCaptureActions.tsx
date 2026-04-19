"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { CameraCaptureModal } from "./CameraCaptureModal";
import { CameraIcon, ImageIcon } from "./icons";
import { cn } from "./ui";

export type CaptureSource = "camera" | "gallery";

interface ImageCaptureActionsProps {
  onSelect: (file: File, source: CaptureSource) => void | Promise<void>;
  disabled?: boolean;
  accept?: string;
  captureFacingMode?: "environment" | "user";
  cameraLabel?: string;
  galleryLabel?: string;
  cameraTitle?: string;
  cameraDescription?: string;
  cameraConfirmLabel?: string;
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
  cameraTitle,
  cameraDescription,
  cameraConfirmLabel = "Use Photo",
  actionsClassName,
  cameraButtonClassName,
  galleryButtonClassName,
  hint,
  hintClassName,
}: ImageCaptureActionsProps) {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

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
          onClick={() => setIsCameraOpen(true)}
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
        ref={galleryInputRef}
        type="file"
        accept={accept}
        hidden
        onChange={handleChange("gallery")}
        disabled={disabled}
      />

      <CameraCaptureModal
        open={isCameraOpen}
        disabled={disabled}
        title={cameraTitle}
        description={cameraDescription}
        confirmLabel={cameraConfirmLabel}
        captureFacingMode={captureFacingMode}
        onClose={() => setIsCameraOpen(false)}
        onConfirm={(file) => {
          setIsCameraOpen(false);
          void onSelect(file, "camera");
        }}
      />
    </>
  );
}
