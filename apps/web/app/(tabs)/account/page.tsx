"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { isUserLoggedIn, setUserLoggedIn } from "../../../components/cityfarm/auth-client";
import styles from "../../../components/cityfarm/cityfarm.module.css";
import {
  FaArrowLeft,
  FaBell,
  FaCircleQuestion,
  FaGlobe,
  FaHouse,
  FaRightFromBracket,
  FaShieldHalved,
  FaCircleUser,
} from "react-icons/fa6";

export default function AccountPage() {
  const router = useRouter();

  const handleLogout = () => {
    setUserLoggedIn(false);
    router.replace("/login");
  };

  return (
    <main className={styles.accountScreen}>
      <header className={styles.accountHeader}>
        <button type="button" className={styles.iconButton} onClick={() => router.back()} aria-label="Go back">
          <FaArrowLeft size={18} aria-hidden="true" />
        </button>
        <div className={styles.accountHeaderTitle}>Account</div>
        <Link href="/home" className={styles.iconButton} aria-label="Go home">
          <FaHouse size={18} aria-hidden="true" />
        </Link>
      </header>

      <section className={styles.accountHero}>
        <div className={styles.accountHeroCard}>
          <div className={styles.accountHeroRow}>
            <div className={styles.profileBadge} style={{ width: "3.2rem", height: "3.2rem" }}>
              SG
            </div>
            <div>
              <div className={styles.accountName}>Cityfarm User</div>
              <div className={styles.accountMeta}>
                {isUserLoggedIn() ? "Logged in and ready for your garden" : "Session not active"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.accountBody}>
        <div>
          <div className={styles.accountSectionTitle}>Account Settings</div>
          <div className={styles.accountOptionList}>
            <div className={styles.accountOption}>
              <div className={styles.accountOptionLeft}>
                <div className={styles.accountOptionIcon}>
                  <FaCircleUser size={18} aria-hidden="true" />
                </div>
                <div>
                  <div className={styles.accountOptionTitle}>Personal info</div>
                  <div className={styles.accountOptionText}>Edit name, email, and profile details.</div>
                </div>
              </div>
              <div className={styles.accountActionPill}>Edit</div>
            </div>

            <div className={styles.accountOption}>
              <div className={styles.accountOptionLeft}>
                <div className={styles.accountOptionIcon}>
                  <FaBell size={18} aria-hidden="true" />
                </div>
                <div>
                  <div className={styles.accountOptionTitle}>Notifications</div>
                  <div className={styles.accountOptionText}>Care reminders, order updates, and alerts.</div>
                </div>
              </div>
              <div className={styles.accountActionPill}>On</div>
            </div>

            <div className={styles.accountOption}>
              <div className={styles.accountOptionLeft}>
                <div className={styles.accountOptionIcon}>
                  <FaShieldHalved size={18} aria-hidden="true" />
                </div>
                <div>
                  <div className={styles.accountOptionTitle}>Privacy & security</div>
                  <div className={styles.accountOptionText}>Password, session, and app permissions.</div>
                </div>
              </div>
              <div className={styles.accountActionPill}>Safe</div>
            </div>

            <div className={styles.accountOption}>
              <div className={styles.accountOptionLeft}>
                <div className={styles.accountOptionIcon}>
                  <FaGlobe size={18} aria-hidden="true" />
                </div>
                <div>
                  <div className={styles.accountOptionTitle}>Language</div>
                  <div className={styles.accountOptionText}>English / Vietnamese</div>
                </div>
              </div>
              <div className={styles.accountActionPill}>EN</div>
            </div>

            <div className={styles.accountOption}>
              <div className={styles.accountOptionLeft}>
                <div className={styles.accountOptionIcon}>
                  <FaCircleQuestion size={18} aria-hidden="true" />
                </div>
                <div>
                  <div className={styles.accountOptionTitle}>Help center</div>
                  <div className={styles.accountOptionText}>FAQ, support, and gardening tips.</div>
                </div>
              </div>
              <div className={styles.accountActionPill}>Open</div>
            </div>
          </div>
        </div>

        <div className={styles.accountFooter}>
          <button type="button" className={styles.buttonOutline} onClick={() => router.push("/home") }>
            Back to Home
          </button>
          <button type="button" className={styles.buttonPrimary} onClick={handleLogout}>
            Log out
          </button>
        </div>

        <button type="button" className={styles.accountOptionDanger} onClick={handleLogout}>
          <span className={styles.accountOptionLeft}>
            <span className={styles.accountOptionIcon}>
              <FaRightFromBracket size={18} aria-hidden="true" />
            </span>
            <span>
              <span className={styles.accountOptionTitle}>End session</span>
              <span className={styles.accountOptionText}>This clears the current demo login state.</span>
            </span>
          </span>
          <span className={styles.accountActionPill}>Logout</span>
        </button>
      </section>
    </main>
  );
}
