"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className={styles.screen}>
      <header className={styles.screenHeader}>
        <div>
          <div className={styles.screenHeaderTitle}>Account</div>
          <div className={styles.screenHeaderMeta}>Profile, settings, and session controls.</div>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.iconButton} onClick={() => router.back()} aria-label="Go back">
            <FaArrowLeft size={18} aria-hidden="true" />
          </button>
          <Link href="/home" className={styles.iconButton} aria-label="Go home">
            <FaHouse size={18} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <div className={styles.screenPadded}>
        <section className={styles.section}>
          <div className={styles.heroBanner}>
            <div className={styles.heroBannerTitle}>
              {isAuthenticated && user.profile?.displayName ? user.profile.displayName : "Cityfarm User"}
            </div>
            <p className={styles.marketBannerText}>
              {isAuthenticated ? "Logged in and ready for your garden" : "Session not active"}
            </p>
            <div className={styles.heroCardFooter} style={{ marginTop: "1rem" }}>
              <div className={styles.statusPill}>{isAuthenticated ? "Active" : "Inactive"}</div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <div className={styles.sectionTitle}>Account Settings</div>
              <div className={styles.sectionSubtitle}>Manage your personal info and app preferences.</div>
            </div>
          </div>

          <div className={styles.listStack}>
            <button type="button" className={styles.taskCard} onClick={() => router.push("/home")}>
              <div className={styles.taskLead}>
                <div className={styles.taskIcon}>
                  <FaCircleUser size={18} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={styles.taskTitle}>Personal info</div>
                  <div className={styles.taskText}>Edit name, email, and profile details.</div>
                </div>
              </div>
              <div className={styles.timePill}>Edit</div>
            </button>

            <button type="button" className={styles.taskCard} onClick={() => router.push("/home")}>
              <div className={styles.taskLead}>
                <div className={styles.taskIcon}>
                  <FaBell size={18} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={styles.taskTitle}>Notifications</div>
                  <div className={styles.taskText}>Care reminders, order updates, and alerts.</div>
                </div>
              </div>
              <div className={styles.timePill}>On</div>
            </button>

            <button type="button" className={styles.taskCard} onClick={() => router.push("/home")}>
              <div className={styles.taskLead}>
                <div className={styles.taskIcon}>
                  <FaShieldHalved size={18} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={styles.taskTitle}>Privacy & security</div>
                  <div className={styles.taskText}>Password, session, and app permissions.</div>
                </div>
              </div>
              <div className={styles.timePill}>Safe</div>
            </button>

            <button type="button" className={styles.taskCard} onClick={() => router.push("/home")}>
              <div className={styles.taskLead}>
                <div className={styles.taskIcon}>
                  <FaGlobe size={18} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={styles.taskTitle}>Language</div>
                  <div className={styles.taskText}>English / Vietnamese</div>
                </div>
              </div>
              <div className={styles.timePill}>EN</div>
            </button>

            <button type="button" className={styles.taskCard} onClick={() => router.push("/home")}>
              <div className={styles.taskLead}>
                <div className={styles.taskIcon}>
                  <FaCircleQuestion size={18} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={styles.taskTitle}>Help center</div>
                  <div className={styles.taskText}>FAQ, support, and gardening tips.</div>
                </div>
              </div>
              <div className={styles.timePill}>Open</div>
            </button>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.listStack}>
            <Link href="/home" className={styles.buttonOutline}>
              <FaHouse size={16} aria-hidden="true" />
              Back to Home
            </Link>
            <button type="button" className={styles.buttonPrimary} onClick={handleLogout}>
              <FaRightFromBracket size={16} aria-hidden="true" />
              Log out
            </button>
          </div>
        </section>

        <section className={styles.section}>
          <button type="button" className={styles.taskCard} onClick={handleLogout}>
            <div className={styles.taskLead}>
              <div className={styles.taskIcon} style={{ background: "#fde7e2", color: "#a3452d" }}>
                <FaRightFromBracket size={18} aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={styles.taskTitle}>End session</div>
                <div className={styles.taskText}>This clears the current demo login state.</div>
              </div>
            </div>
            <div className={styles.timePill}>Logout</div>
          </button>
        </section>
      </div>
    </div>
  );
}
