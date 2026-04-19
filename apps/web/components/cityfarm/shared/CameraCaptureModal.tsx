"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { CameraIcon, CloseIcon, ImageIcon } from "./icons";
import { CityImage } from "./ui";
import styles from "./CameraCaptureModal.module.css";

type CameraModalStatus = "idle" | "requesting" | "streaming" | "preview" | "error";

interface CameraCaptureModalProps {
  open: boolean;
  disabled?: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  retryLabel?: string;
  closeLabel?: string;
  captureFacingMode?: "environment" | "user";
  onConfirm: (file: File) => void;
  onClose: () => void;
}

const LOCALHOST_NAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);
const JPEG_TYPE = "image/jpeg";
const MAX_CAPTURE_EDGE = 1920;
const VIDEO_READY_TIMEOUT_MS = 4000;

function isLocalhost() {
  if (typeof window === "undefined") {
    return false;
  }

  return LOCALHOST_NAMES.has(window.location.hostname);
}

function normalizeCameraError(error: unknown) {
  if (!(error instanceof DOMException)) {
    return "Unable to open the live camera right now. You can close this panel and use the gallery instead.";
  }

  switch (error.name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "Camera access was blocked. Allow camera permission in the browser, then try again.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No camera was found on this device. Use the gallery fallback if you still want to continue.";
    case "NotReadableError":
    case "TrackStartError":
      return "The camera is busy or unavailable. Close other apps using the camera and try again.";
    case "OverconstrainedError":
    case "ConstraintNotSatisfiedError":
      return "The preferred camera was unavailable. Retry to let the browser pick another camera.";
    case "AbortError":
      return "The browser interrupted the camera request. Please try again.";
    default:
      return "Unable to open the live camera right now. You can close this panel and use the gallery instead.";
  }
}

async function getCameraStream(facingMode: "environment" | "user") {
  if (typeof window === "undefined") {
    throw new Error("Camera access is only available in the browser.");
  }

  if (!window.isSecureContext && !isLocalhost()) {
    throw new Error("Camera access requires HTTPS or localhost. Use the gallery fallback if this environment is not secure.");
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("This browser does not support live camera capture. Use the gallery fallback instead.");
  }

  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: facingMode },
      },
    });
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === "OverconstrainedError" ||
        error.name === "ConstraintNotSatisfiedError" ||
        error.name === "NotFoundError" ||
        error.name === "DevicesNotFoundError")
    ) {
      return navigator.mediaDevices.getUserMedia({ audio: false, video: true });
    }

    throw error;
  }
}

function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

async function waitForVideoReady(video: HTMLVideoElement) {
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      window.clearTimeout(timeoutId);
      video.removeEventListener("loadedmetadata", handleReady);
      video.removeEventListener("loadeddata", handleReady);
      video.removeEventListener("canplay", handleReady);
      video.removeEventListener("error", handleError);
    };

    const handleReady = () => {
      if (!video.videoWidth || !video.videoHeight) {
        return;
      }

      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      reject(new Error("The camera preview could not start. Please try again."));
    };

    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("The camera preview took too long to start. Please try again."));
    }, VIDEO_READY_TIMEOUT_MS);

    video.addEventListener("loadedmetadata", handleReady);
    video.addEventListener("loadeddata", handleReady);
    video.addEventListener("canplay", handleReady);
    video.addEventListener("error", handleError);
  });
}

async function fileFromVideoFrame(video: HTMLVideoElement) {
  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;

  if (!sourceWidth || !sourceHeight) {
    throw new Error("The camera preview is not ready yet. Please wait a moment and try again.");
  }

  const scale = Math.min(1, MAX_CAPTURE_EDGE / Math.max(sourceWidth, sourceHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Unable to process the captured image on this device.");
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((nextBlob) => {
      if (nextBlob) {
        resolve(nextBlob);
        return;
      }

      reject(new Error("Unable to encode the captured image."));
    }, JPEG_TYPE, 0.9);
  });

  return new File([blob], `camera-capture-${Date.now()}.jpg`, {
    type: JPEG_TYPE,
    lastModified: Date.now(),
  });
}

export function CameraCaptureModal({
  open,
  disabled = false,
  title = "Capture a fresh photo",
  description = "Use your device camera, review the result, then confirm to continue.",
  confirmLabel = "Use Photo",
  retryLabel = "Retry Camera",
  closeLabel = "Close",
  captureFacingMode = "environment",
  onConfirm,
  onClose,
}: CameraCaptureModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const capturedUrlRef = useRef<string | null>(null);
  const requestRef = useRef(0);
  const [status, setStatus] = useState<CameraModalStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    stopMediaStream(streamRef.current);
    streamRef.current = null;

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
    }
  }, []);

  const clearCapturedImage = useCallback(() => {
    setCapturedFile(null);
    if (capturedUrlRef.current) {
      URL.revokeObjectURL(capturedUrlRef.current);
      capturedUrlRef.current = null;
    }
    setCapturedImageUrl(null);
  }, []);

  const startCamera = useCallback(async () => {
    requestRef.current += 1;
    const requestId = requestRef.current;

    stopCamera();
    setStatus("requesting");
    setErrorMessage(null);

    try {
      const stream = await getCameraStream(captureFacingMode);

      if (requestRef.current !== requestId) {
        stopMediaStream(stream);
        return;
      }

      streamRef.current = stream;
      const video = videoRef.current;

      if (!video) {
        stopMediaStream(stream);
        throw new Error("The camera preview could not be initialized. Please try again.");
      }

      video.srcObject = stream;
      await video.play().catch(() => undefined);

      await waitForVideoReady(video);

      if (requestRef.current !== requestId) {
        return;
      }

      setStatus("streaming");
    } catch (error) {
      if (requestRef.current !== requestId) {
        return;
      }

      const message =
        error instanceof DOMException
          ? normalizeCameraError(error)
          : error instanceof Error
            ? error.message
            : "Unable to open the live camera right now. You can close this panel and use the gallery instead.";
      setErrorMessage(message);
      setStatus("error");
    }
  }, [captureFacingMode, stopCamera]);

  useEffect(() => {
    if (!open) {
      requestRef.current += 1;
      stopCamera();
      setStatus("idle");
      setErrorMessage(null);
      clearCapturedImage();
      return;
    }

    void startCamera();

    return () => {
      requestRef.current += 1;
      stopCamera();
    };
  }, [clearCapturedImage, open, startCamera, stopCamera]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (capturedUrlRef.current) {
        URL.revokeObjectURL(capturedUrlRef.current);
        capturedUrlRef.current = null;
      }
    };
  }, [stopCamera]);

  const handleCapture = useCallback(async () => {
    if (disabled || !videoRef.current) {
      return;
    }

    try {
      const nextFile = await fileFromVideoFrame(videoRef.current);
      const nextUrl = URL.createObjectURL(nextFile);

      setCapturedFile(nextFile);
      if (capturedUrlRef.current) {
        URL.revokeObjectURL(capturedUrlRef.current);
      }
      capturedUrlRef.current = nextUrl;
      setCapturedImageUrl(nextUrl);

      stopCamera();
      setStatus("preview");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to capture this frame right now.");
      setStatus("error");
    }
  }, [disabled, stopCamera]);

  const handleRetake = useCallback(() => {
    clearCapturedImage();
    void startCamera();
  }, [clearCapturedImage, startCamera]);

  const handleClose = useCallback(() => {
    requestRef.current += 1;
    onClose();
  }, [onClose]);

  const handleConfirm = useCallback(() => {
    if (!capturedFile || disabled) {
      return;
    }

    onConfirm(capturedFile);
  }, [capturedFile, disabled, onConfirm]);

  if (!open) {
    return null;
  }

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
      <div className={styles.frame}>
        <div className={styles.sheet}>
          <div className={styles.header}>
            <div className="min-w-0 flex-1">
              <div className={styles.eyebrow}>Live Camera</div>
              <div id={titleId} className={styles.title}>
                {title}
              </div>
              <p id={descriptionId} className={styles.description}>
                {description}
              </p>
            </div>
            <button type="button" onClick={handleClose} className={styles.closeButton} aria-label={closeLabel}>
              <CloseIcon />
            </button>
          </div>

          <div className={styles.body}>
            {status !== "preview" ? (
              <>
                <div className={`${styles.stage} ${styles.videoStage}`}>
                  <video
                    ref={videoRef}
                    className={`${styles.video} ${status === "streaming" ? "" : styles.videoHidden}`}
                    autoPlay
                    muted
                    playsInline
                  />

                  {status === "streaming" ? (
                    <>
                      <div className={styles.guide} />
                      <div className={styles.guideDot} />
                    </>
                  ) : null}

                  {status === "requesting" ? (
                    <div className={styles.stageOverlay}>
                      <div className={styles.loadingCard}>
                        <div className={styles.spinner} />
                        <div className="space-y-2">
                          <div className="text-base font-extrabold text-white">Opening the camera...</div>
                          <div className="text-sm leading-relaxed text-white/70">
                            Allow camera access if your browser asks for permission.
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {status === "error" ? (
                    <div className={styles.stageOverlay}>
                      <div className={styles.errorCard}>{errorMessage}</div>
                    </div>
                  ) : null}
                </div>

                {status === "streaming" ? (
                  <div className={styles.cameraNote}>
                    Frame the full planting area and keep the brightest edge of the scene visible.
                    <div className={styles.cameraTip}>Tap the shutter when the preview looks sharp.</div>
                  </div>
                ) : null}

                {status === "error" ? (
                  <div className={styles.cameraNote}>
                    You can retry the camera, or close this panel and choose an image from your gallery instead.
                  </div>
                ) : null}
              </>
            ) : null}

            {status === "preview" && capturedImageUrl ? (
              <>
                <div className={styles.stage}>
                  <CityImage
                    src={capturedImageUrl}
                    alt="Captured camera preview"
                    sizes="(max-width: 420px) 100vw, 420px"
                    className={styles.previewImage}
                  />
                </div>
                <div className={styles.cameraNote}>
                  Review the photo before sending it. Retake now if the image is blurry or misses the subject.
                </div>
              </>
            ) : null}

          </div>

          <div className={styles.actions}>
            {status === "streaming" ? (
              <div className={styles.shutterWrap}>
                <button type="button" onClick={() => void handleCapture()} className={styles.shutterButton} disabled={disabled}>
                  <span className={styles.shutterButtonInner} />
                  <span className="sr-only">Take Photo</span>
                </button>
              </div>
            ) : null}

            {status === "preview" ? (
              <>
                <button type="button" onClick={handleConfirm} className={styles.primaryButton} disabled={disabled}>
                  <CameraIcon />
                  {confirmLabel}
                </button>
                <button type="button" onClick={handleRetake} className={styles.secondaryButton} disabled={disabled}>
                  <ImageIcon />
                  Retake Photo
                </button>
              </>
            ) : null}

            {status === "error" ? (
              <>
                <button type="button" onClick={() => void startCamera()} className={styles.primaryButton}>
                  <CameraIcon />
                  {retryLabel}
                </button>
                <button type="button" onClick={handleClose} className={styles.secondaryButton}>
                  <ImageIcon />
                  Use Gallery Instead
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
