"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { isUserLoggedIn, setUserLoggedIn } from "../../../components/cityfarm/auth-client";
import styles from "../../../components/cityfarm/cityfarm.module.css";

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
          <LeftArrowIcon />
        </button>
        <div className={styles.accountHeaderTitle}>Account</div>
        <Link href="/home" className={styles.iconButton} aria-label="Go home">
          <HomeIcon />
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
                  <ProfileIcon />
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
                  <BellIcon />
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
                  <ShieldIcon />
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
                  <GlobeIcon />
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
                  <HelpIcon />
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

        <div className={styles.accountOptionDanger}>
          <div className={styles.accountOptionLeft}>
            <div className={styles.accountOptionIcon}>
              <LogoutIcon />
            </div>
            <div>
              <div className={styles.accountOptionTitle}>End session</div>
              <div className={styles.accountOptionText}>This clears the current demo login state.</div>
            </div>
          </div>
          <div className={styles.accountActionPill}>Logout</div>
        </div>
      </section>
    </main>
  );
}

function LeftArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 20c1.8-3.5 4.4-5.2 7-5.2S17.2 16.5 19 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 17H6c1.2-1.3 1.8-2.7 1.8-4.7V10a4.2 4.2 0 1 1 8.4 0v2.3c0 2 .6 3.4 1.8 4.7h-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 19 6v5c0 4.9-3.2 8.6-7 10-3.8-1.4-7-5.1-7-10V6l7-3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="m9.5 12 1.9 1.9L14.8 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 12h16M12 4c2.2 2 3.4 4.7 3.4 8S14.2 18 12 20c-2.2-2-3.4-4.7-3.4-8S9.8 6 12 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9.8 9.2a2.4 2.4 0 1 1 3.6 2c-.9.5-1.4 1.1-1.4 2v.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M10 17H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15 7l4 5-4 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 12H10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
