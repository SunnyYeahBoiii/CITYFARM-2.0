"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { setUserLoggedIn } from "../../../components/cityfarm/auth-client";
import styles from "../../../components/cityfarm/cityfarm.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [nameValue, setNameValue] = useState("");

  const handleTypeAndRegister = (nextValue: string) => {
    setNameValue(nextValue);

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
              <p className={styles.authLead}>Start your first balcony harvest.</p>
            </div>

            <section className={styles.authPanel}>
              <h1 className={styles.authTitle}>Create account</h1>
              <p className={styles.authSubtitle}>
                For now this is instant access. Type anything and we sign you in right away.
              </p>

              <div className={styles.authForm}>
                <input
                  className={styles.input}
                  value={nameValue}
                  onChange={(event) => handleTypeAndRegister(event.target.value)}
                  placeholder="Your name, email, or anything"
                />
                <div className={styles.statusPill}>Instant demo access</div>
              </div>

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
