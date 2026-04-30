"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { AuthBrand, AuthDivider, AuthShell } from "@/components/auth/AuthShell";
import type { AuthSessionActionResult } from "@/context/AuthContext";
import { getGoogleAuthUrl } from "@/lib/api/config";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";

function resolveLoginDestination(
  result: Extract<AuthSessionActionResult, { ok: true }>,
): string {
  return result.nextStep === "setup-password" ? "/setup-password" : "/home";
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageFallback() {
  return (
    <AuthShell>
      <div className="flex min-h-[260px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#37542d] border-t-transparent" />
      </div>
    </AuthShell>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ account: false, password: false });
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const registrationNotice = searchParams.get("registered") === "1";

  useEffect(() => {
    if (registrationNotice) {
      toast.success("Account created successfully. Please log in.");
    }
  }, [registrationNotice]);

  const emailError =
    touched.account && email.trim().length === 0
      ? "This field cannot be empty."
      : touched.account && !emailRegex.test(email.trim())
        ? "Please enter a valid email address."
        : "";

  const passwordError =
    touched.password && password.trim().length === 0
      ? "This field cannot be empty."
      : touched.password && password.trim().length < 8
        ? "Password must be at least 8 characters."
        : "";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextTouched = { account: true, password: true };
    setTouched(nextTouched);

    if (
      email.trim().length === 0 ||
      !emailRegex.test(email.trim()) ||
      password.trim().length < 8
    ) {
      return;
    }

    const authResult = await login(email.trim(), password.trim());
    if (!authResult.ok) {
      toast.error("Invalid login credentials.");
      return;
    }

    toast.success("Login successful.");
    router.replace(resolveLoginDestination(authResult));
  };

  const handleGoogleLogin = () => {
    window.location.href = getGoogleAuthUrl();
  };

  return (
    <AuthShell>
      <AuthBrand title="Log in" subtitle="Enter your account and password to login." />

      <div className="flex flex-col gap-3">
        <form className="w-full space-y-4 text-left" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="mb-1.5 block text-sm font-bold text-[#24301c]" htmlFor="login-account">
              Email
            </label>
            <input
              id="login-account"
              className={`min-h-[3rem] w-full rounded-2xl border px-4 text-base text-[#24301c] outline-none transition-colors focus:border-[#567a3d] ${
                emailError ? "border-[rgba(163,69,45,0.44)] bg-[#fdf4f1]" : "border-[#1f29161f] bg-[#f8faf7]"
              }`}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() =>
                setTouched((current) => ({
                  ...current,
                  account: true,
                }))
              }
              placeholder="Enter your email"
            />
            {emailError ? <p className="mt-1 text-xs leading-snug text-[#a3452d]">{emailError}</p> : null}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-[#24301c]" htmlFor="login-password">
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className={`min-h-[3rem] w-full rounded-2xl border bg-[#f8faf7] px-4 pr-12 text-base text-[#24301c] outline-none transition-colors focus:border-[#567a3d] ${
                  passwordError ? "border-[rgba(163,69,45,0.44)] bg-[#fdf4f1]" : "border-[#1f29161f]"
                }`}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onBlur={() =>
                  setTouched((current) => ({
                    ...current,
                    password: true,
                  }))
                }
                placeholder="Enter your password"
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
            {passwordError ? <p className="mt-1 text-xs leading-snug text-[#a3452d]">{passwordError}</p> : null}
          </div>

          <button
            type="submit"
            className="mt-1 inline-flex min-h-[3.2rem] w-full items-center justify-center rounded-full bg-[#37542d] px-4 py-3 text-base font-bold text-white shadow-[0_12px_28px_rgba(0,0,0,0.12)] transition-transform hover:-translate-y-px"
          >
            Log in to your account
          </button>
        </form>

        <AuthDivider />

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="inline-flex min-h-[3.2rem] w-full items-center justify-center gap-3 rounded-full border border-[#1f29161f] bg-white px-4 py-3 text-base font-bold text-[#24301c] transition-all hover:bg-[#f8faf7] hover:shadow-sm"
        >
          <FcGoogle size={18} />
          Continue with Google
        </button>
      </div>

      <p className="mt-4 text-center text-sm text-[#677562]">
        Need an account?{" "}
        <Link href="/register" className="font-extrabold text-[#567a3d]">
          Register here
        </Link>
      </p>
    </AuthShell>
  );
}
