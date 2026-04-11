"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { FaEye, FaEyeSlash, FaLock } from "react-icons/fa6";
import styles from "../../../components/cityfarm/cityfarm.module.css";

export default function SetupPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setupPassword, isAuthReady } = useAuth();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManualSuccess, setIsManualSuccess] = useState(false);

  const source = searchParams.get("source") || "social";

  const isAlreadySetup = isAuthReady && !user.requiresPasswordSetup && !!user.id;
  const showSuccess = isManualSuccess || isAlreadySetup;

  const passwordError =
    touched.password && password.trim().length === 0
      ? "This field cannot be empty."
      : touched.password && password.trim().length < 8
        ? "Password must be at least 8 characters."
        : "";

  const confirmPasswordError =
    touched.confirmPassword && confirmPassword !== password
      ? "Passwords do not match."
      : "";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ password: true, confirmPassword: true });

    if (password.trim().length < 8 || password !== confirmPassword) {
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await setupPassword(password);
      if (success) {
        setIsManualSuccess(true);
      }
    } catch (error) {
      console.error("Failed to setup password:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthReady) {
    return (
      <main className={styles.appBackdrop} suppressHydrationWarning>
        <div className="flex h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#37542d] border-t-transparent"></div>
        </div>
      </main>
    );
  }

  if (showSuccess) {
    return (
      <main className={styles.appBackdrop} suppressHydrationWarning>
        <div className={styles.shellCenter}>
          <section className={styles.deviceFrame}>
            <div className={styles.authViewport}>
              <section className={styles.authCard}>
                <div className={`${styles.authCardInner} ${styles.authStack} items-center text-center`}>
                  <div className="flex flex-col items-center gap-4 mb-2">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f6ec] text-[#37542d]">
                      <FaLock size={32} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <h2 className="text-xl font-extrabold text-[#24301c]">Password setup complete</h2>
                      <p className="text-sm text-[#677562] leading-6">
                        Your password has been successfully set. You can now use it to log in next time.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => router.replace("/home")}
                    className="w-full min-h-[3.2rem] rounded-full bg-[#37542d] px-8 py-3 text-base font-bold text-white shadow-lg transition-all hover:-translate-y-px"
                  >
                    Back to Home
                  </button>
                </div>
              </section>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.appBackdrop} suppressHydrationWarning>
      <div className={styles.shellCenter}>
        <section className={styles.deviceFrame}>
          <div className={styles.authViewport}>
            <section className={styles.authCard}>
              <div className={`${styles.authCardInner} ${styles.authStack}`}>
                <div className={`${styles.authHeader} text-left`}>
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#567a3d,#2d4a24)] font-extrabold tracking-[0.08em] text-[#f8faf6]">CF</div>
                    <div className="text-2xl font-extrabold tracking-wide text-[#3a4d28]">CITYFARM</div>
                  </div>

                  <h1 className="text-[1.35rem] font-extrabold leading-tight text-[#24301c]">
                    Set up your password
                  </h1>
                  <p className="text-sm leading-7 text-[#677562]">
                    {source === "google" 
                      ? "You've successfully signed in with Google. Please create a password to keep your account secure." 
                      : "Please create a password for your account to continue."}
                  </p>
                </div>

                <form className={`${styles.authForm} w-full text-left`} onSubmit={handleSubmit} noValidate>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className={`${styles.authLabel} text-sm font-bold text-[#24301c]`} htmlFor="setup-password">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          id="setup-password"
                          type={showPassword ? "text" : "password"}
                          className={`${styles.authInput} rounded-2xl border bg-[#f8faf7] pr-12 text-base text-[#24301c] ${
                            passwordError ? "border-[rgba(163,69,45,0.44)] bg-[#fdf4f1]" : "border-[#1f29161f]"
                          }`}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                          placeholder="Create a strong password"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#5c6d52] hover:bg-[#edf3e8]"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                      </div>
                      {passwordError && <p className="text-xs mt-1 text-[#a3452d]">{passwordError}</p>}
                    </div>

                    <div>
                      <label className={`${styles.authLabel} text-sm font-bold text-[#24301c]`} htmlFor="confirm-password">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          className={`${styles.authInput} rounded-2xl border bg-[#f8faf7] pr-12 text-base text-[#24301c] ${
                            confirmPasswordError ? "border-[rgba(163,69,45,0.44)] bg-[#fdf4f1]" : "border-[#1f29161f]"
                          }`}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
                          placeholder="Repeat your password"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#5c6d52] hover:bg-[#edf3e8]"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                        </button>
                      </div>
                      {confirmPasswordError && <p className="text-xs mt-1 text-[#a3452d]">{confirmPasswordError}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="mt-2 inline-flex w-full min-h-[3.2rem] items-center justify-center gap-2 rounded-full bg-[#37542d] px-4 py-3 text-base font-bold text-white shadow-[0_12px_28px_rgba(0,0,0,0.12)] transition-all hover:-translate-y-px disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      ) : (
                        <FaLock size={16} />
                      )}
                      Complete setup
                    </button>
                  </div>
                </form>

                <p className="text-center text-xs text-[#677562] leading-relaxed">
                  Setting a password allows you to log in directly with your email in the future.
                </p>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
