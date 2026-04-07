"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { setUserLoggedIn } from "../../../components/cityfarm/auth-client";
import styles from "../../../components/cityfarm/cityfarm.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [value, setValue] = useState("");

  const handleTypeAndLogin = (nextValue: string) => {
    setValue(nextValue);

    if (nextValue.trim().length > 0) {
      setUserLoggedIn(true);
      router.replace("/home");
    }
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
              <p className={styles.authLead}>Grow clean, live green.</p>
            </div>

            <section className={styles.authPanel}>
              <h1 className={styles.authTitle}>Log in</h1>
              <p className={styles.authSubtitle}>
                Type anything and you will be logged in automatically for this demo.
              </p>

              <div className={styles.authForm}>
                <input
                  className={styles.input}
                  value={value}
                  onChange={(event) => handleTypeAndLogin(event.target.value)}
                  placeholder="Email, username, or anything"
                />
                <div className={styles.statusPill}>Instant demo access</div>
              </div>

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
