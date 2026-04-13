"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import type { AuthSessionActionResult } from "@/context/AuthContext";
import { FaEye, FaEyeSlash, FaLock } from "react-icons/fa6";
import { AuthBrand, AuthShell } from "./AuthShell";

function resolveSetupDestination(
  result: Extract<AuthSessionActionResult, { ok: true }>,
): string {
  return result.nextStep === "setup-password" ? "/setup-password" : "/home";
}

export function SetupPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, setupPassword, isAuthReady } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const source = searchParams.get("source") || "social";
  const isAlreadySetup = isAuthReady && !user.requiresPasswordSetup && !!user.id;

  useEffect(() => {
    if (isAuthReady && !user.id) {
      router.replace("/login");
    }
  }, [isAuthReady, router, user.id]);

  const passwordError =
    touched.password && password.trim().length === 0
      ? "This field cannot be empty."
      : touched.password && password.trim().length < 8
        ? "Password must be at least 8 characters."
        : "";

  const confirmPasswordError =
    touched.confirmPassword && confirmPassword !== password ? "Passwords do not match." : "";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ password: true, confirmPassword: true });

    if (password.trim().length < 8 || password !== confirmPassword) {
      return;
    }

    setIsSubmitting(true);
    try {
      const setupResult = await setupPassword(password);
      if (setupResult.ok) {
        router.replace(resolveSetupDestination(setupResult));
      }
    } catch (error) {
      console.error("Failed to setup password:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthReady) {
    return (
      <AuthShell>
        <div className="flex min-h-[260px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#37542d] border-t-transparent" />
        </div>
      </AuthShell>
    );
  }

  if (!user.id) {
    return (
      <AuthShell>
        <div className="flex min-h-[260px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#37542d] border-t-transparent" />
        </div>
      </AuthShell>
    );
  }

  if (isAlreadySetup) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center gap-4 py-3 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f6ec] text-[#37542d]">
            <FaLock size={30} aria-hidden="true" />
          </div>
          <h2 className="text-xl font-extrabold text-[#24301c]">Password setup complete</h2>
          <p className="text-sm leading-6 text-[#677562]">
            Your password has been successfully set. You can now use it to log in next time.
          </p>
          <button
            type="button"
            onClick={() => router.replace("/home")}
            className="mt-2 inline-flex min-h-[3.2rem] w-full items-center justify-center rounded-full bg-[#37542d] px-8 py-3 text-base font-bold text-white shadow-lg transition-transform hover:-translate-y-px"
          >
            Back to Home
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthBrand
        title="Set up your password"
        subtitle={
          source === "google"
            ? "You've successfully signed in with Google. Create a password to keep your account secure."
            : "Please create a password for your account to continue."
        }
      />

      <form className="w-full space-y-4 text-left" onSubmit={handleSubmit} noValidate>
        <div>
          <label className="mb-1.5 block text-sm font-bold text-[#24301c]" htmlFor="setup-password">
            New Password
          </label>
          <div className="relative">
            <input
              id="setup-password"
              type={showPassword ? "text" : "password"}
              className={`min-h-[3rem] w-full rounded-2xl border bg-[#f8faf7] px-4 pr-12 text-base text-[#24301c] outline-none transition-colors focus:border-[#567a3d] ${
                passwordError ? "border-[rgba(163,69,45,0.44)] bg-[#fdf4f1]" : "border-[#1f29161f]"
              }`}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, password: true }))}
              placeholder="Create a strong password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#5c6d52] hover:bg-[#edf3e8]"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash size={18} aria-hidden="true" /> : <FaEye size={18} aria-hidden="true" />}
            </button>
          </div>
          {passwordError ? <p className="mt-1 text-xs text-[#a3452d]">{passwordError}</p> : null}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-bold text-[#24301c]" htmlFor="confirm-password">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              className={`min-h-[3rem] w-full rounded-2xl border bg-[#f8faf7] px-4 pr-12 text-base text-[#24301c] outline-none transition-colors focus:border-[#567a3d] ${
                confirmPasswordError ? "border-[rgba(163,69,45,0.44)] bg-[#fdf4f1]" : "border-[#1f29161f]"
              }`}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, confirmPassword: true }))}
              placeholder="Repeat your password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#5c6d52] hover:bg-[#edf3e8]"
              onClick={() => setShowConfirmPassword((current) => !current)}
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? (
                <FaEyeSlash size={18} aria-hidden="true" />
              ) : (
                <FaEye size={18} aria-hidden="true" />
              )}
            </button>
          </div>
          {confirmPasswordError ? <p className="mt-1 text-xs text-[#a3452d]">{confirmPasswordError}</p> : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 inline-flex min-h-[3.2rem] w-full items-center justify-center gap-2 rounded-full bg-[#37542d] px-4 py-3 text-base font-bold text-white shadow-[0_12px_28px_rgba(0,0,0,0.12)] transition-all hover:-translate-y-px disabled:opacity-70"
        >
          {isSubmitting ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <FaLock size={16} aria-hidden="true" />
          )}
          Complete setup
        </button>
      </form>

      <p className="mt-4 text-center text-xs leading-relaxed text-[#677562]">
        Setting a password allows you to log in directly with your email in the future.
      </p>
    </AuthShell>
  );
}
