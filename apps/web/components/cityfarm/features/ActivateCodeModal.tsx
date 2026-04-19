"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { gardenApi } from "@/lib/api/garden.api";
import styles from "../cityfarm.module.css";
import { CloseIcon, PlusIcon } from "../shared/icons";

interface ActivateCodeModalProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function ActivateCodeModal({ onSuccess, trigger }: ActivateCodeModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const resetState = () => {
    setCode("");
    setError(null);
    setIsSuccess(false);
    setIsLoading(false);
  };

  const handleOpen = () => {
    resetState();
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isLoading) return;
    setIsOpen(false);
    resetState();
  };

  const formatCode = (input: string) => {
    // Remove non-alphanumeric
    let val = input.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    
    // CITY-XXXX-XXXX
    if (val.length > 4) {
      val = val.slice(0, 4) + "-" + val.slice(4);
    }
    if (val.length > 9) {
      val = val.slice(0, 9) + "-" + val.slice(9);
    }
    
    return val.slice(0, 14);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCode(e.target.value);
    setCode(formatted);
    setError(null);
  };

  const handleActivate = async () => {
    if (code.length < 14) {
      setError("Please enter the full 14-character code.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await gardenApi.activateCode(code);
      setIsSuccess(true);
      
      // Delay to show success state
      setTimeout(() => {
        setIsOpen(false);
        router.refresh();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to activate code. Please try again.";
      setError(Array.isArray(message) ? message[0] : message);
      setIsLoading(false);
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={handleOpen}>{trigger}</div>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className={styles.buttonPrimary}
          style={{ width: "100%", marginTop: "1rem" }}
        >
          Activate a new kit
        </button>
      )}

      {isOpen && (
        <div className={styles.composerOverlay} onClick={handleClose}>
          <div className={styles.composerSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHead}>
              <div>
                <div className={styles.sectionTitle}>Activate Kit</div>
                <div className={styles.sectionSubtitle}>Enter your CITY-XXXX-XXXX code</div>
              </div>
              <button 
                type="button" 
                className={styles.iconButton} 
                onClick={handleClose}
                disabled={isLoading}
              >
                <CloseIcon />
              </button>
            </div>

            <div className={styles.sheetBody}>
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-(--color-heading)">Activation Successful!</h3>
                  <p className="mt-2 text-sm text-(--color-muted)">Your plant has been added to your garden.</p>
                </div>
              ) : (
                <>
                  <div className={styles.section}>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-(--color-muted)">
                      Activation Code
                    </label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="CITY-XXXX-XXXX"
                      value={code}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      style={{ 
                        textAlign: "center", 
                        letterSpacing: "0.1em", 
                        fontSize: "1.25rem",
                        fontFamily: "monospace",
                        fontWeight: "bold"
                      }}
                    />
                    {error && (
                      <p className="mt-2 text-center text-xs font-bold text-red-500">{error}</p>
                    )}
                  </div>

                  <div className="mt-8 flex flex-col gap-3">
                    <button
                      type="button"
                      className={styles.buttonPrimary}
                      style={{ width: "100%", padding: "1rem" }}
                      onClick={handleActivate}
                      disabled={isLoading || code.length < 14}
                    >
                      {isLoading ? "Validating..." : "Activate Now"}
                    </button>
                    <p className="text-center text-[11px] text-(--color-muted)">
                      You can find your activation code in your Order History.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
