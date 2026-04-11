"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import styles from "../../../components/cityfarm/cityfarm.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ account: false, password: false });
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    const authenticated = await login(email.trim(), password.trim());

    if (!authenticated) {
      return;
    }

    router.replace("/home");
  };

  const handleGoogleLogin = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    window.location.href = `${apiUrl}/auth/google`;
  };

  return (
    <main className={styles.appBackdrop} suppressHydrationWarning>
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
                    <div className="text-2xl font-extrabold tracking-wide text-[#3a4d28]">
                      CITYFARM
                    </div>
                  </div>

                  <h1 className="text-[1.35rem] font-extrabold leading-tight text-[#24301c]">
                    Log in
                  </h1>
                  <p className="text-sm leading-7 text-[#677562]">
                    Enter your account and password to login.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <form
                    className={`${styles.authForm} w-full text-left`}
                    onSubmit={handleSubmit}
                    noValidate
                  >
                    <div>
                      <label
                        className={`${styles.authLabel} text-sm font-bold text-[#24301c]`}
                        htmlFor="login-account"
                      >
                        Email
                      </label>
                      <input
                        id="login-account"
                        className={`${styles.authInput} rounded-2xl border text-base text-[#24301c] ${
                          emailError
                            ? "border-[rgba(163,69,45,0.44)] bg-[#fdf4f1]"
                            : "border-[#1f29161f] bg-[#f8faf7]"
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
                      {emailError ? (
                        <p className="text-xs leading-snug text-[#a3452d]">
                          {emailError}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label
                        className={`${styles.authLabel} text-sm font-bold text-[#24301c]`}
                        htmlFor="login-password"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          className={`${styles.authInput} rounded-2xl border bg-[#f8faf7] pr-12 text-base text-[#24301c] ${
                            passwordError
                              ? "border-[rgba(163,69,45,0.44)] bg-[#fdf4f1]"
                              : "border-[#1f29161f]"
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
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <FaEyeSlash size={18} aria-hidden="true" />
                          ) : (
                            <FaEye size={18} aria-hidden="true" />
                          )}
                        </button>
                      </div>
                      {passwordError ? (
                        <p className="text-xs leading-snug text-[#a3452d]">
                          {passwordError}
                        </p>
                      ) : null}
                    </div>

                    <button
                      type="submit"
                      className="mt-1 inline-flex min-h-[3.2rem] w-full items-center justify-center rounded-full bg-[#37542d] px-4 py-3 text-base font-bold text-white shadow-[0_12px_28px_rgba(0,0,0,0.12)] transition-transform hover:-translate-y-px"
                    >
                      Log in to your account
                    </button>
                  </form>

                  <div className="relative flex items-center py-0.5">
                    <div className="flex-1 border-t border-[#1f291612]"></div>
                    <span className="shrink mx-3 text-[10px] font-bold uppercase tracking-widest text-[#677562ad]">
                      OR
                    </span>
                    <div className="flex-1 border-t border-[#1f291612]"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="inline-flex min-h-[3.2rem] w-full items-center justify-center gap-3 rounded-full border border-[#1f29161f] bg-white px-4 py-3 text-base font-bold text-[#24301c] transition-all hover:bg-[#f8faf7] hover:shadow-sm"
                  >
                    <FcGoogle size={18} />
                    Continue with Google
                  </button>
                </div>

                <p className="mt-1 text-center text-sm text-[#677562]">
                  Need an account?{" "}
                  <Link
                    href="/register"
                    className="font-extrabold text-[#567a3d]"
                  >
                    Register here
                  </Link>
                </p>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
