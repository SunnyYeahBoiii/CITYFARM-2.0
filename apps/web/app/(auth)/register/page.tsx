"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import styles from "../../../components/cityfarm/cityfarm.module.css";

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

    const authenticated = await register({
      email: email.trim(),
      password: password.trim(),
      displayName: username.trim(),
    });

    if (!authenticated) {
      return;
    }

    router.replace("/home");
  };

  return (
    <main className={styles.appBackdrop}>
      <div className={styles.shellCenter}>
        <section className={styles.deviceFrame}>
          <div className={styles.authViewport}>
            <section className={styles.authCard}>
              <div className={`${styles.authCardInner} ${styles.authStack}`}>
                <div className={`${styles.authHeader} text-left`}>
                  <div className="flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#567a3d,#2d4a24)] font-extrabold tracking-[0.08em] text-[#f8faf6]">
                  CF
                </div>
                <div className="text-2xl font-extrabold tracking-wide text-[#3a4d28]">CITYFARM</div>
                  </div>
                  <p className="text-sm leading-7 text-[#5b6d57]">Start your first balcony harvest.</p>

                  <h1 className="text-[1.35rem] font-extrabold leading-tight text-[#24301c]">Create account</h1>
                  <p className="text-sm leading-7 text-[#677562]">
                    Fill in all fields. In demo mode, any valid non-empty values are accepted.
                  </p>
                </div>

                <form className={`${styles.authForm} w-full text-left`} onSubmit={handleSubmit} noValidate>
                <div>
                  <label className={`${styles.authLabel} text-sm font-bold text-[#24301c]`} htmlFor="register-email">
                    Email
                  </label>
                  <input
                    id="register-email"
                    className={`${styles.authInput} rounded-[1rem] border text-base text-[#24301c] ${
                      emailError
                        ? "border-[rgba(163,69,45,0.44)] bg-[#fdf4f1]"
                        : "border-[#1f29161f] bg-[#f8faf7]"
                    }`}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    onBlur={() => setTouched((current) => ({ ...current, email: true }))}
                    placeholder="Enter your email"
                  />
                  {emailError ? <p className="text-xs leading-snug text-[#a3452d]">{emailError}</p> : null}
                </div>

                <div>
                  <label className={`${styles.authLabel} text-sm font-bold text-[#24301c]`} htmlFor="register-username">
                    Username
                  </label>
                  <input
                    id="register-username"
                    className={`${styles.authInput} rounded-[1rem] border text-base text-[#24301c] ${
                      usernameError
                        ? "border-[rgba(163,69,45,0.44)] bg-[#fdf4f1]"
                        : "border-[#1f29161f] bg-[#f8faf7]"
                    }`}
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    onBlur={() => setTouched((current) => ({ ...current, username: true }))}
                    placeholder="Choose a username"
                  />
                  {usernameError ? <p className="text-xs leading-snug text-[#a3452d]">{usernameError}</p> : null}
                </div>

                <div>
                  <label className={`${styles.authLabel} text-sm font-bold text-[#24301c]`} htmlFor="register-password">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      className={`${styles.authInput} rounded-[1rem] border bg-[#f8faf7] pr-12 text-base text-[#24301c] ${
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
                  {passwordError ? <p className="text-xs leading-snug text-[#a3452d]">{passwordError}</p> : null}
                </div>

                <div>
                  <label className={`${styles.authLabel} text-sm font-bold text-[#24301c]`} htmlFor="register-confirm-password">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="register-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      className={`${styles.authInput} rounded-[1rem] border bg-[#f8faf7] pr-12 text-base text-[#24301c] ${
                        confirmPasswordError
                          ? "border-[rgba(163,69,45,0.44)] bg-[#fdf4f1]"
                          : "border-[#1f29161f]"
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
                  {confirmPasswordError ? <p className="text-xs leading-snug text-[#a3452d]">{confirmPasswordError}</p> : null}
                </div>

                <button
                  type="submit"
                  className="mt-1 inline-flex w-full min-h-[3.2rem] items-center justify-center rounded-full bg-[#37542d] px-4 py-3 text-base font-bold text-white shadow-[0_12px_28px_rgba(0,0,0,0.12)] transition-transform hover:-translate-y-[1px]"
                >
                  Create account
                </button>
                <p className="mt-3 rounded-[1rem] bg-[#f7faf4] p-4 text-center text-sm leading-6 text-[#677562]">
                  Demo mode: valid fields sign in instantly after validation
                </p>
                </form>

                <p className="mt-1 text-center text-sm text-[#677562]">
                  Already have an account? <Link href="/login" className="font-extrabold text-[#567a3d]">Log in here</Link>
                </p>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
