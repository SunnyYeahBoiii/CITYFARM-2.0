"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { setUserLoggedIn } from "../../../components/cityfarm/auth-client";
import styles from "../../../components/cityfarm/cityfarm.module.css";
import { FaEye, FaEyeSlash } from "react-icons/fa6";

export default function LoginPage() {
  const router = useRouter();
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextTouched = { account: true, password: true };
    setTouched(nextTouched);

    if (email.trim().length === 0 || !emailRegex.test(email.trim()) || password.trim().length < 8) {
      return;
    }

    setUserLoggedIn(true);
    router.replace("/home");
  };

  return (
    <main className={styles.appBackdrop}>
      <div className={styles.shellCenter}>
        <section className={styles.deviceFrame}>
          <div className={`${styles.authScreen} ${styles.authScreenCentered}`}>
            <section className={styles.authPanel}>
              <div className={styles.authLogoRow}>
                <div className={styles.authLogoMark}>CF</div>
                <div className={styles.brandName}>CITYFARM</div>
              </div>
              <h1 className={styles.authTitle}>Log in</h1>
              <p className={styles.authSubtitle}>
                Enter any account and password to unlock the demo.
              </p>

              <form className={styles.authForm} onSubmit={handleSubmit} noValidate>
                <div className={styles.authField}>
                  <label className={styles.authLabel} htmlFor="login-account">
                    Email
                  </label>
                  <input
                    id="login-account"
                    className={`${styles.input} ${emailError ? styles.authInputInvalid : ""}`}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    onBlur={() => setTouched((current) => ({ ...current, account: true }))}
                    placeholder="Enter your email"
                  />
                  {emailError ? <p className={styles.authError}>{emailError}</p> : null}
                </div>

                <div className={styles.authField}>
                  <label className={styles.authLabel} htmlFor="login-password">
                    Password
                  </label>
                  <div className={styles.passwordFieldWrap}>
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      className={`${styles.input} ${styles.passwordFieldInput} ${passwordError ? styles.authInputInvalid : ""}`}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      onBlur={() => setTouched((current) => ({ ...current, password: true }))}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <FaEyeSlash size={18} aria-hidden="true" /> : <FaEye size={18} aria-hidden="true" />}
                    </button>
                  </div>
                  {passwordError ? <p className={styles.authError}>{passwordError}</p> : null}
                </div>

                <button type="submit" className={`${styles.buttonPrimary} ${styles.authButton}`}>
                  Log in to your account
                </button>
                <div className={styles.statusPill}>Demo mode: valid email and 8+ char password are accepted</div>
              </form>

              <p className={styles.authHint}>
                Need an account? <Link href="/register">Register here</Link>
              </p>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
