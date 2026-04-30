"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { AuthBrand, AuthDivider, AuthShell } from "@/components/auth/AuthShell";
import { getGoogleAuthUrl } from "@/lib/api/config";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";

function getRegisterErrorMessage(error?: string): string {
  const normalizedError = error?.toLowerCase() ?? "";

  if (normalizedError.includes("email") && normalizedError.includes("exist")) {
    return "Email already exists.";
  }

  if (
    (normalizedError.includes("username") || normalizedError.includes("displayname") || normalizedError.includes("display name")) &&
    normalizedError.includes("exist")
  ) {
    return "Username already exists.";
  }

  if (normalizedError.includes("unique constraint") && normalizedError.includes("displayname")) {
    return "Username already exists.";
  }

  return "Registration failed. Please try again.";
}

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const [touched, setTouched] = useState({
    email: false,
    username: false,
    password: false,
    confirmPassword: false,
  });

  const emailError =
    touched.email && email.trim().length === 0
      ? "Email cannot be empty."
      : touched.email && !emailRegex.test(email.trim())
        ? "Please enter a valid email."
        : "";

  const usernameError = touched.username && username.trim().length === 0 ? "Username cannot be empty." : "";

  const passwordError =
    touched.password && password.trim().length === 0
      ? "Password cannot be empty."
      : touched.password && password.trim().length < 8
        ? "Password must be at least 8 characters."
        : "";

  const confirmPasswordError =
    touched.confirmPassword && (!confirmPassword || confirmPassword !== password)
      ? "Passwords do not match."
      : "";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({
      email: true,
      username: true,
      password: true,
      confirmPassword: true,
    });

    if (
      email.trim().length === 0 ||
      !emailRegex.test(email.trim()) ||
      username.trim().length === 0 ||
      password.trim().length < 8 ||
      confirmPassword.trim().length < 8 ||
      confirmPassword !== password
    ) {
      return;
    }

    const registerResult = await register({
      email: email.trim(),
      password: password.trim(),
      displayName: username.trim(),
    });

    if (!registerResult.ok) {
      toast.error(getRegisterErrorMessage(registerResult.error));
      return;
    }

    toast.success("Account created successfully.");
    router.replace("/login?registered=1");
  };

  const handleGoogleLogin = () => {
    window.location.href = getGoogleAuthUrl();
  };

  return (
    <AuthShell>
      <AuthBrand title="Create account" subtitle="Start your first balcony harvest." />

      <div className="flex flex-col gap-3">
        <form className="w-full space-y-4 text-left" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="mb-1.5 block text-sm font-bold text-[#24301c]" htmlFor="register-email">
              Email
            </label>
            <input
              id="register-email"
              className={`min-h-[3rem] w-full rounded-2xl border px-4 text-base text-[#24301c] outline-none transition-colors focus:border-[#567a3d] ${
                emailError ? "border-[rgba(163,69,45,0.44)] bg-[#fdf4f1]" : "border-[#1f29161f] bg-[#f8faf7]"
              }`}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, email: true }))}
              placeholder="Enter your email"
            />
            {emailError ? <p className="mt-1 text-xs leading-snug text-[#a3452d]">{emailError}</p> : null}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-[#24301c]" htmlFor="register-username">
              Username
            </label>
            <input
              id="register-username"
              className={`min-h-[3rem] w-full rounded-2xl border px-4 text-base text-[#24301c] outline-none transition-colors focus:border-[#567a3d] ${
                usernameError ? "border-[rgba(163,69,45,0.44)] bg-[#fdf4f1]" : "border-[#1f29161f] bg-[#f8faf7]"
              }`}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, username: true }))}
              placeholder="Choose a username"
            />
            {usernameError ? <p className="mt-1 text-xs leading-snug text-[#a3452d]">{usernameError}</p> : null}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-[#24301c]" htmlFor="register-password">
              Password
            </label>
            <div className="relative">
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                className={`min-h-[3rem] w-full rounded-2xl border bg-[#f8faf7] px-4 pr-12 text-base text-[#24301c] outline-none transition-colors focus:border-[#567a3d] ${
                  passwordError ? "border-[rgba(163,69,45,0.44)] bg-[#fdf4f1]" : "border-[#1f29161f]"
                }`}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onBlur={() => setTouched((current) => ({ ...current, password: true }))}
                placeholder="Create a password"
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

          <div>
            <label className="mb-1.5 block text-sm font-bold text-[#24301c]" htmlFor="register-confirm-password">
              Confirm password
            </label>
            <div className="relative">
              <input
                id="register-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                className={`min-h-[3rem] w-full rounded-2xl border bg-[#f8faf7] px-4 pr-12 text-base text-[#24301c] outline-none transition-colors focus:border-[#567a3d] ${
                  confirmPasswordError ? "border-[rgba(163,69,45,0.44)] bg-[#fdf4f1]" : "border-[#1f29161f]"
                }`}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                onBlur={() => setTouched((current) => ({ ...current, confirmPassword: true }))}
                placeholder="Re-enter your password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#5c6d52] hover:bg-[#edf3e8]"
                onClick={() => setShowConfirmPassword((current) => !current)}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <FaEyeSlash size={18} aria-hidden="true" /> : <FaEye size={18} aria-hidden="true" />}
              </button>
            </div>
            {confirmPasswordError ? <p className="mt-1 text-xs leading-snug text-[#a3452d]">{confirmPasswordError}</p> : null}
          </div>

          <button
            type="submit"
            className="mt-1 inline-flex w-full min-h-[3.2rem] items-center justify-center rounded-full bg-[#37542d] px-4 py-3 text-base font-bold text-white shadow-[0_12px_28px_rgba(0,0,0,0.12)] transition-transform hover:-translate-y-px"
          >
            Create account
          </button>
        </form>

        <AuthDivider />

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="inline-flex min-h-[3.2rem] w-full items-center justify-center gap-3 rounded-full border border-[#1f29161f] bg-white px-4 py-3 text-base font-bold text-[#24301c] transition-all hover:bg-[#f8faf7] hover:shadow-sm"
        >
          <FcGoogle size={18} />
          Sign up with Google
        </button>
      </div>

      <p className="mt-4 text-center text-sm text-[#677562]">
        Already have an account?{" "}
        <Link href="/login" className="font-extrabold text-[#567a3d]">
          Log in here
        </Link>
      </p>
    </AuthShell>
  );
}
