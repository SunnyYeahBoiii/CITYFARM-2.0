"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import styles from "./cityfarm.module.css";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthReady, isAuthenticated } = useAuth();

  if (!isAuthReady) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.appBackdrop}>
        <div className={styles.shellCenter}>
          <div className={styles.deviceFrame}>
            <div className={styles.screenPadded}>
              <section className={styles.section}>
                <div className={styles.heroBanner}>
                  <div className={styles.heroBannerTitle}>Access Restricted</div>
                  <p className={styles.marketBannerText}>
                    No features are available right now. Please log in to your account.
                  </p>
                  <div className={`${styles.heroCardFooter} ${styles.authGateActions}`}>
                    <Link href="/login" className={`${styles.buttonPrimary} ${styles.authGateActionButton}`}>
                      Log in to your account
                    </Link>
                    <Link href="/register" className={`${styles.buttonOutline} ${styles.authGateActionButton}`}>
                      Create account
                    </Link>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
