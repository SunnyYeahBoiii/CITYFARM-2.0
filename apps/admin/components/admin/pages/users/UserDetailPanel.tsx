import { useEffect } from "react";
import { createPortal } from "react-dom";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { ActivityEvent, UserRow, UserRole, VerificationStatus } from "./users-data";
import { getUserInitials } from "./users-data";

function roleTone(role: UserRow["role"]): "success" | "warning" | "danger" | "neutral" | "info" {
  if (role === "ADMIN") return "info";
  if (role === "EXPERT") return "success";
  if (role === "SUPPLIER") return "neutral";
  return "warning";
}

function verifyTone(status: UserRow["growerVerificationStatus"]): "success" | "warning" | "danger" | "neutral" {
  if (status === "VERIFIED") return "success";
  if (status === "PENDING") return "warning";
  if (status === "REVOKED") return "danger";
  return "neutral";
}

export function UserDetailPanel({
  open,
  onClose,
  user,
  activity,
  disabled,
  onPatch,
}: {
  open: boolean;
  onClose: () => void;
  user: UserRow | null;
  activity: ActivityEvent[];
  disabled?: boolean;
  onPatch?: (userId: string, patch: { role?: UserRole; growerVerificationStatus?: VerificationStatus }) => void | Promise<void>;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open || !user) return null;

  const isReadOnly = !onPatch;
  const isLocked = Boolean(disabled) || isReadOnly;

  const roleOptions = ["USER", "SUPPLIER", "EXPERT", "ADMIN"] as const satisfies readonly UserRole[];
  const verificationOptions = ["NONE", "PENDING", "VERIFIED", "REVOKED"] as const satisfies readonly VerificationStatus[];

  return createPortal(
    <div className="fixed inset-0 z-[90]">
      <button
        type="button"
        aria-label="Close profile popup"
        className="absolute inset-0 bg-black/28 backdrop-blur-[4px]"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4">
        <article className="flex h-full max-h-[calc(100vh-1.5rem)] w-full max-w-[980px] flex-col rounded-[1.9rem] border border-[color:rgba(31,41,22,0.08)] bg-white/95 shadow-[0_30px_80px_rgba(33,49,30,0.22)] sm:max-h-[calc(100vh-2rem)]">
          <div className="flex items-center justify-between gap-3 border-b border-[color:rgba(31,41,22,0.08)] px-5 py-4 sm:px-6">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Profile</div>
              <div className="mt-1 text-sm text-[var(--color-muted)]">Xem thông tin user, trust signals và thao tác role/verification.</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-9 items-center justify-center rounded-full border border-[color:rgba(31,41,22,0.08)] bg-white px-3 text-sm font-semibold text-[var(--color-interactive-ink)] transition-colors hover:bg-[var(--color-screen)]"
            >
              Close
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            <article className="rounded-[1.9rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 p-5 shadow-[0_16px_30px_rgba(33,49,30,0.07)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-interactive-bg)] text-lg font-semibold text-[var(--color-green-deep)]">
            {getUserInitials(user.displayName)}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Profile</div>
            <h2 className="mt-2 truncate text-xl font-semibold text-[var(--color-heading)]">{user.displayName}</h2>
            <div className="mt-1 truncate text-sm text-[var(--color-muted)]">{user.email}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge tone={roleTone(user.role)}>{user.role}</StatusBadge>
          <StatusBadge tone={verifyTone(user.growerVerificationStatus)}>{user.growerVerificationStatus}</StatusBadge>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.35rem] border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Location</div>
          <div className="mt-2 text-sm font-semibold text-[var(--color-heading)]">
            {user.district}, {user.city}
          </div>
          <div className="mt-1 text-sm text-[var(--color-muted)]">Created {user.createdAt}</div>
        </div>
        <div className="rounded-[1.35rem] border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Totals</div>
          <div className="mt-2 text-sm font-semibold text-[var(--color-heading)]">
            {user.totals.posts} posts • {user.totals.listings} listings • {user.totals.orders} orders
          </div>
          <div className="mt-1 text-sm text-[var(--color-muted)]">GMV {user.totals.gmv}</div>
        </div>
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-[color:rgba(31,41,22,0.08)] bg-white px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Admin controls</div>
            <div className="mt-1 text-sm text-[var(--color-muted)]">
              {isReadOnly ? "Read-only snapshot." : isLocked ? "Updating..." : "Apply changes instantly (optimistic)."}
            </div>
          </div>
          <StatusBadge tone={isReadOnly ? "neutral" : isLocked ? "warning" : "success"}>{isReadOnly ? "Read" : isLocked ? "Saving" : "Ready"}</StatusBadge>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[1.25rem] border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Role</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {roleOptions.map((role) => {
                const active = user.role === role;
                return (
                  <button
                    key={role}
                    type="button"
                    disabled={isLocked}
                    aria-pressed={active}
                    className={`inline-flex min-h-9 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors ${
                      active
                        ? "bg-[var(--color-green-deep)] text-white shadow-[0_10px_20px_rgba(53,91,49,0.18)]"
                        : "border border-[color:rgba(31,41,22,0.08)] bg-white text-[var(--color-interactive-ink)] hover:bg-[var(--color-screen)]"
                    } ${isLocked ? "cursor-not-allowed opacity-70" : ""}`}
                    onClick={() => {
                      if (!onPatch) return;
                      if (active) return;
                      if (role === "ADMIN" && !window.confirm("Promote this user to ADMIN?")) return;
                      void onPatch(user.id, { role });
                    }}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Grower verification</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {verificationOptions.map((status) => {
                const active = user.growerVerificationStatus === status;
                const isDanger = status === "REVOKED";
                return (
                  <button
                    key={status}
                    type="button"
                    disabled={isLocked}
                    aria-pressed={active}
                    className={`inline-flex min-h-9 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors ${
                      active
                        ? "bg-[rgba(53,91,49,0.14)] text-[var(--color-heading)] ring-1 ring-[rgba(53,91,49,0.22)]"
                        : isDanger
                          ? "border border-[rgba(163,69,45,0.28)] bg-[rgba(253,244,241,0.7)] text-[var(--color-danger)] hover:bg-[rgba(253,244,241,0.95)]"
                          : "border border-[color:rgba(31,41,22,0.08)] bg-white text-[var(--color-interactive-ink)] hover:bg-[var(--color-screen)]"
                    } ${isLocked ? "cursor-not-allowed opacity-70" : ""}`}
                    onClick={() => {
                      if (!onPatch) return;
                      if (active) return;
                      if (status === "REVOKED" && !window.confirm("Revoke grower verification for this user?")) return;
                      void onPatch(user.id, { growerVerificationStatus: status });
                    }}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-[color:rgba(31,41,22,0.08)] bg-[linear-gradient(145deg,#f3f6ef,#ebe4d6)] p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-green-soft)]">Trust desk</div>
            <div className="mt-2 text-lg font-semibold text-[var(--color-heading)]">Trust score</div>
            <div className="mt-1 text-sm text-[var(--color-muted)]">
              Tinh trang trust duoc dung cho hang doi verification va nhom user can follow-up.
            </div>
          </div>
          <StatusBadge tone={user.trustScore >= 80 ? "success" : user.trustScore >= 55 ? "warning" : "danger"}>
            {user.trustScore}
          </StatusBadge>
        </div>
        {user.riskSignals.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {user.riskSignals.map((signal) => (
              <span
                key={signal}
                className="inline-flex min-h-8 items-center rounded-full bg-white/85 px-3 text-xs font-semibold text-[var(--color-danger)] ring-1 ring-[rgba(163,69,45,0.18)]"
              >
                {signal}
              </span>
            ))}
          </div>
        ) : (
          <div className="mt-4 text-sm text-[var(--color-muted)]">No elevated risk signals detected.</div>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:rgba(31,41,22,0.08)] bg-white px-4 text-sm font-semibold text-[var(--color-interactive-ink)] transition-colors hover:bg-[var(--color-screen)]"
        >
          View posts
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:rgba(31,41,22,0.08)] bg-white px-4 text-sm font-semibold text-[var(--color-interactive-ink)] transition-colors hover:bg-[var(--color-screen)]"
        >
          View orders
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#567a3d,#2d4a24)] px-4 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(53,91,49,0.18)] transition-transform hover:-translate-y-0.5"
        >
          Open listings
        </button>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Activity</div>
            <h3 className="mt-2 text-lg font-semibold text-[var(--color-heading)]">Recent events</h3>
          </div>
          <StatusBadge tone="neutral">{activity.length} events</StatusBadge>
        </div>

        <div className="mt-4 space-y-3">
          {activity.length ? (
            activity.map((evt) => (
              <div
                key={`${evt.time}-${evt.title}`}
                className="rounded-[1.35rem] border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-heading)]">{evt.title}</div>
                    <div className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{evt.detail}</div>
                    <div className="mt-2 text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">{evt.time}</div>
                  </div>
                  <StatusBadge tone={evt.tone}>{evt.tag}</StatusBadge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-[var(--color-muted)]">No activity events in this mock profile.</div>
          )}
        </div>
      </div>
            </article>
          </div>
        </article>
      </div>
    </div>,
    document.body,
  );
}
