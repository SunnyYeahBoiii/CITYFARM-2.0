"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { setUserLoggedIn } from "../../../components/cityfarm/auth-client";
import styles from "../../../components/cityfarm/cityfarm.module.css";

export default function RegisterPage() {
  const router = useRouter();
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
      ? "This field cannot be empty."
      : touched.email && !emailRegex.test(email.trim())
        ? "Please enter a valid email address."
        : "";
  const usernameError = touched.username && username.trim().length === 0 ? "This field cannot be empty." : "";
  const passwordError =
    touched.password && password.trim().length === 0
      ? "This field cannot be empty."
      : touched.password && password.trim().length < 8
        ? "Password must be at least 8 characters."
        : "";
  const confirmPasswordError =
    touched.confirmPassword && confirmPassword.trim().length === 0
      ? "This field cannot be empty."
      : touched.confirmPassword && confirmPassword.trim().length < 8
        ? "Password must be at least 8 characters."
      : touched.confirmPassword && confirmPassword !== password
        ? "Confirm password must match password."
        : "";

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextTouched = {
      email: true,
      username: true,
      password: true,
      confirmPassword: true,
    };

    setTouched(nextTouched);

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

    setUserLoggedIn(true);
    router.replace("/home");
  };

  return (
    <main className={styles.appBackdrop}>
      <div className={styles.shellCenter}>
        <section className={styles.deviceFrame}>
          <div className={styles.authScreen}>
            <div className={styles.authHero}>
              <div className={styles.authLogoRow}>
                <div className={styles.authLogoMark}>CF</div>
                <div className={styles.brandName}>CITYFARM</div>
              </div>
              <p className={styles.authLead}>Start your first balcony harvest.</p>
            </div>

            <section className={styles.authPanel}>
              <h1 className={styles.authTitle}>Create account</h1>
              <p className={styles.authSubtitle}>
                Fill in all fields. In demo mode, any valid non-empty values are accepted.
              </p>

              <form className={styles.authForm} onSubmit={handleSubmit} noValidate>
                <div className={styles.authField}>
                  <label className={styles.authLabel} htmlFor="register-email">
                    Email
                  </label>
                  <input
                    id="register-email"
                    className={`${styles.input} ${emailError ? styles.authInputInvalid : ""}`}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    onBlur={() => setTouched((current) => ({ ...current, email: true }))}
                    placeholder="Enter your email"
                  />
                  {emailError ? <p className={styles.authError}>{emailError}</p> : null}
                </div>

                <div className={styles.authField}>
                  <label className={styles.authLabel} htmlFor="register-username">
                    Username
                  </label>
                  <input
                    id="register-username"
                    className={`${styles.input} ${usernameError ? styles.authInputInvalid : ""}`}
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    onBlur={() => setTouched((current) => ({ ...current, username: true }))}
                    placeholder="Choose a username"
                  />
                  {usernameError ? <p className={styles.authError}>{usernameError}</p> : null}
                </div>

                <div className={styles.authField}>
                  <label className={styles.authLabel} htmlFor="register-password">
                    Password
                  </label>
                  <div className={styles.passwordFieldWrap}>
                    <input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      className={`${styles.input} ${styles.passwordFieldInput} ${passwordError ? styles.authInputInvalid : ""}`}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      onBlur={() => setTouched((current) => ({ ...current, password: true }))}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {passwordError ? <p className={styles.authError}>{passwordError}</p> : null}
                </div>

                <div className={styles.authField}>
                  <label className={styles.authLabel} htmlFor="register-confirm-password">
                    Confirm password
                  </label>
                  <div className={styles.passwordFieldWrap}>
                    <input
                      id="register-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      className={`${styles.input} ${styles.passwordFieldInput} ${confirmPasswordError ? styles.authInputInvalid : ""}`}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      onBlur={() => setTouched((current) => ({ ...current, confirmPassword: true }))}
                      placeholder="Re-enter your password"
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={() => setShowConfirmPassword((current) => !current)}
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {confirmPasswordError ? <p className={styles.authError}>{confirmPasswordError}</p> : null}
                </div>

                <button type="submit" className={`${styles.buttonPrimary} ${styles.authButton}`}>
                  Create account
                </button>
                <div className={styles.statusPill}>Demo mode: valid fields sign in instantly after validation</div>
              </form>

              <p className={styles.authHint}>
                Already have an account? <Link href="/login">Log in here</Link>
              </p>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.6-6 10-6c2.2 0 4.1.7 5.7 1.7M22 12s-3.6 6-10 6c-2.2 0-4.1-.7-5.7-1.7"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
