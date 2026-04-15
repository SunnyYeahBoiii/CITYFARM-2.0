"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  FaBell,
  FaCircleQuestion,
  FaGlobe,
  FaRightFromBracket,
  FaShieldHalved,
  FaCircleUser,
  FaBagShopping,
} from "react-icons/fa6";

export default function AccountPage() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="min-h-full bg-[var(--color-screen)] px-4 py-4">
      <header className="mb-4">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-green-soft)]">
          Account
        </div>
        <h2 className="text-xl font-extrabold text-[var(--color-heading)]">Profile and settings</h2>
        <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
          Session controls and personal preferences.
        </p>
      </header>

      <div className="space-y-3">
        <section className="rounded-[1.25rem] border border-[color:rgba(31,41,22,0.08)] bg-white p-3.5 shadow-[0_8px_20px_rgba(33,49,30,0.06)]">
          <div className="text-base font-extrabold text-[var(--color-heading)]">
            {isAuthenticated && user.profile?.displayName ? user.profile.displayName : "Cityfarm User"}
          </div>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            {isAuthenticated ? "Logged in and ready for your garden" : "Session not active"}
          </p>
          <div className="mt-2.5 inline-flex rounded-full bg-[var(--color-interactive-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-green-deep)]">
            {isAuthenticated ? "Active" : "Inactive"}
          </div>
        </section>

        <section className="space-y-2">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-[0.08em] text-[var(--color-heading)]">
              Account Settings
            </h3>
            <p className="text-xs text-[var(--color-muted)]">Manage your personal info and app preferences.</p>
          </div>

          <button
            type="button"
            className="flex w-full items-center justify-between rounded-[1rem] border border-[color:rgba(31,41,22,0.08)] bg-white p-2.5 text-left shadow-[0_8px_20px_rgba(33,49,30,0.06)] transition-colors hover:bg-[var(--color-screen)]"
            onClick={() => router.push("/home")}
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[0.85rem] bg-[var(--color-interactive-bg)] text-[var(--color-interactive-ink)]">
                <FaCircleUser size={16} aria-hidden="true" />
              </span>
              <div>
                <div className="text-sm font-bold text-[var(--color-heading)]">Personal info</div>
                <div className="text-xs text-[var(--color-muted)]">Edit name, email, and profile details.</div>
              </div>
            </div>
            <span className="rounded-full bg-[var(--color-screen)] px-3 py-1 text-xs font-semibold text-[var(--color-muted)]">
              Edit
            </span>
          </button>

          <button
            type="button"
            className="flex w-full items-center justify-between rounded-[1rem] border border-[color:rgba(31,41,22,0.08)] bg-white p-2.5 text-left shadow-[0_8px_20px_rgba(33,49,30,0.06)] transition-colors hover:bg-[var(--color-screen)]"
            onClick={() => router.push("/account/history")}
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[0.85rem] bg-[var(--color-interactive-bg)] text-[var(--color-interactive-ink)]">
                <FaBagShopping size={16} aria-hidden="true" />
              </span>
              <div>
                <div className="text-sm font-bold text-[var(--color-heading)]">Purchase history</div>
                <div className="text-xs text-[var(--color-muted)]">Orders, receipts, and digital codes.</div>
              </div>
            </div>
            <span className="rounded-full bg-[var(--color-screen)] px-3 py-1 text-xs font-semibold text-[var(--color-muted)]">
              View
            </span>
          </button>

          <button
            type="button"
            className="flex w-full items-center justify-between rounded-[1rem] border border-[color:rgba(31,41,22,0.08)] bg-white p-2.5 text-left shadow-[0_8px_20px_rgba(33,49,30,0.06)] transition-colors hover:bg-[var(--color-screen)]"
            onClick={() => router.push("/home")}
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[0.85rem] bg-[var(--color-interactive-bg)] text-[var(--color-interactive-ink)]">
                <FaBell size={16} aria-hidden="true" />
              </span>
              <div>
                <div className="text-sm font-bold text-[var(--color-heading)]">Notifications</div>
                <div className="text-xs text-[var(--color-muted)]">Care reminders, order updates, and alerts.</div>
              </div>
            </div>
            <span className="rounded-full bg-[var(--color-screen)] px-3 py-1 text-xs font-semibold text-[var(--color-muted)]">
              On
            </span>
          </button>

          <button
            type="button"
            className="flex w-full items-center justify-between rounded-[1rem] border border-[color:rgba(31,41,22,0.08)] bg-white p-2.5 text-left shadow-[0_8px_20px_rgba(33,49,30,0.06)] transition-colors hover:bg-[var(--color-screen)]"
            onClick={() => router.push("/home")}
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[0.85rem] bg-[var(--color-interactive-bg)] text-[var(--color-interactive-ink)]">
                <FaShieldHalved size={16} aria-hidden="true" />
              </span>
              <div>
                <div className="text-sm font-bold text-[var(--color-heading)]">Privacy & security</div>
                <div className="text-xs text-[var(--color-muted)]">Password, session, and app permissions.</div>
              </div>
            </div>
            <span className="rounded-full bg-[var(--color-screen)] px-3 py-1 text-xs font-semibold text-[var(--color-muted)]">
              Safe
            </span>
          </button>

          <button
            type="button"
            className="flex w-full items-center justify-between rounded-[1rem] border border-[color:rgba(31,41,22,0.08)] bg-white p-2.5 text-left shadow-[0_8px_20px_rgba(33,49,30,0.06)] transition-colors hover:bg-[var(--color-screen)]"
            onClick={() => router.push("/home")}
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[0.85rem] bg-[var(--color-interactive-bg)] text-[var(--color-interactive-ink)]">
                <FaGlobe size={16} aria-hidden="true" />
              </span>
              <div>
                <div className="text-sm font-bold text-[var(--color-heading)]">Language</div>
                <div className="text-xs text-[var(--color-muted)]">English / Vietnamese</div>
              </div>
            </div>
            <span className="rounded-full bg-[var(--color-screen)] px-3 py-1 text-xs font-semibold text-[var(--color-muted)]">
              EN
            </span>
          </button>

          <button
            type="button"
            className="flex w-full items-center justify-between rounded-[1rem] border border-[color:rgba(31,41,22,0.08)] bg-white p-2.5 text-left shadow-[0_8px_20px_rgba(33,49,30,0.06)] transition-colors hover:bg-[var(--color-screen)]"
            onClick={() => router.push("/home")}
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[0.85rem] bg-[var(--color-interactive-bg)] text-[var(--color-interactive-ink)]">
                <FaCircleQuestion size={16} aria-hidden="true" />
              </span>
              <div>
                <div className="text-sm font-bold text-[var(--color-heading)]">Help center</div>
                <div className="text-xs text-[var(--color-muted)]">FAQ, support, and gardening tips.</div>
              </div>
            </div>
            <span className="rounded-full bg-[var(--color-screen)] px-3 py-1 text-xs font-semibold text-[var(--color-muted)]">
              Open
            </span>
          </button>
        </section>

        <section className="space-y-2">
          <Link
            href="/home"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[color:rgba(31,41,22,0.08)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-interactive-ink)] transition-colors hover:bg-[var(--color-screen)]"
          >
            Back to Home
          </Link>
          <button
            type="button"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-green-deep)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(53,91,49,0.24)] transition-transform hover:-translate-y-px"
            onClick={handleLogout}
          >
            <FaRightFromBracket size={14} aria-hidden="true" />
            Log out
          </button>
        </section>
      </div>
    </div>
  );
}
