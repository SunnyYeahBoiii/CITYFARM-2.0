"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { updateAdminUser } from "@/lib/api/admin-client";
import type { ActivityEvent, UserRow, VerificationQueueItem } from "./users-data";
import { UserDetailPanel } from "./UserDetailPanel";

type UsersTab = "all" | "customers" | "growers" | "admins" | "flagged";
type Density = "comfortable" | "compact";

function clampScore(score: number) {
  return Math.max(0, Math.min(100, score));
}

function scoreTone(score: number): "success" | "warning" | "danger" | "neutral" {
  if (score >= 80) return "success";
  if (score >= 55) return "warning";
  return "danger";
}

function roleTone(role: UserRow["role"]): "success" | "warning" | "danger" | "neutral" | "info" {
  if (role === "ADMIN") return "info";
  if (role === "EXPERT") return "success";
  if (role === "SUPPLIER") return "neutral";
  return "warning";
}

function verifyTone(
  status: UserRow["growerVerificationStatus"],
): "success" | "warning" | "danger" | "neutral" {
  if (status === "VERIFIED") return "success";
  if (status === "PENDING") return "warning";
  if (status === "REVOKED") return "danger";
  return "neutral";
}

export function UsersScreen({
  initialUsers,
  initialVerificationQueue,
  initialActivitiesByUser,
  initialError,
}: {
  initialUsers: UserRow[];
  initialVerificationQueue: VerificationQueueItem[];
  initialActivitiesByUser: Record<string, ActivityEvent[]>;
  initialError?: string | null;
}) {
  const [tab, setTab] = useState<UsersTab>("all");
  const [density, setDensity] = useState<Density>("compact");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserRow[]>(() => initialUsers);
  const [verificationQueue, setVerificationQueue] = useState<VerificationQueueItem[]>(() => initialVerificationQueue);
  const [activitiesByUser] = useState<Record<string, ActivityEvent[]>>(() => initialActivitiesByUser);
  const [selectedUserId, setSelectedUserId] = useState<string>(initialUsers[0]?.id ?? "");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [isSaving, setIsSaving] = useState(false);

  const q = query.trim().toLowerCase();
  const visibleUsers = users
    .filter((u) => {
      if (tab === "admins") return u.role === "ADMIN";
      if (tab === "growers") return u.growerVerificationStatus !== "NONE";
      if (tab === "customers") return u.role === "USER";
      if (tab === "flagged") return u.riskSignals.length > 0 || u.growerVerificationStatus === "REVOKED";
      return true;
    })
    .filter((u) => {
      if (!q) return true;
      return (
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.district.toLowerCase().includes(q)
      );
    });

  const selected = visibleUsers.find((u) => u.id === selectedUserId) ?? users.find((u) => u.id === selectedUserId) ?? null;

  const kpi = {
    total: users.length,
    pending: users.filter((u) => u.growerVerificationStatus === "PENDING").length,
    revoked: users.filter((u) => u.growerVerificationStatus === "REVOKED").length,
    flagged: users.filter((u) => u.riskSignals.length > 0).length,
  };

  const tablePadY = density === "compact" ? "py-2.5" : "py-4";

  const toggleSelected = (id: string, checked: boolean) => {
    setSelectedIds((cur) => {
      if (checked) return cur.includes(id) ? cur : [...cur, id];
      return cur.filter((x) => x !== id);
    });
  };

  const toggleAllVisible = (checked: boolean) => {
    if (!checked) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(visibleUsers.map((u) => u.id));
  };

  return (
    <div className="space-y-4">
      {error ? (
        <section className="rounded-[1.2rem] border border-[rgba(163,69,45,0.18)] bg-[rgba(253,244,241,0.92)] px-4 py-3 text-sm text-[var(--color-danger)] shadow-[0_12px_22px_rgba(163,69,45,0.08)]">
          {error}
        </section>
      ) : null}
      <section className="rounded-[1.2rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 px-4 py-3 shadow-[0_12px_22px_rgba(33,49,30,0.06)]">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="neutral">{kpi.total} users</StatusBadge>
          <StatusBadge tone="warning">{kpi.pending} verify pending</StatusBadge>
          <StatusBadge tone="danger">{kpi.revoked} revoked</StatusBadge>
          <StatusBadge tone="warning">{kpi.flagged} flagged</StatusBadge>
          <span className="ml-auto inline-flex rounded-full bg-[var(--color-screen)] p-1 text-sm">
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 font-semibold ${density === "comfortable" ? "bg-white text-[var(--color-heading)] shadow-sm" : "text-[var(--color-muted)]"}`}
              onClick={() => setDensity("comfortable")}
            >
              Comfort
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 font-semibold ${density === "compact" ? "bg-white text-[var(--color-heading)] shadow-sm" : "text-[var(--color-muted)]"}`}
              onClick={() => setDensity("compact")}
            >
              Compact
            </button>
          </span>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,0.85fr)]">
        <article className="rounded-[1.2rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 shadow-[0_12px_22px_rgba(33,49,30,0.06)]">
          <div className="flex flex-col gap-3 border-b border-[color:rgba(31,41,22,0.08)] px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex min-h-10 items-center gap-2 rounded-full border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-4">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, email, district..."
                  aria-label="Search users"
                  className="w-[240px] max-w-full bg-transparent text-sm text-[var(--color-heading)] outline-none placeholder:text-[var(--color-muted)]"
                />
              </div>
              {([
                { id: "all", label: "All" },
                { id: "customers", label: "Customers" },
                { id: "growers", label: "Growers" },
                { id: "admins", label: "Admins" },
                { id: "flagged", label: "Flagged" },
              ] as const).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`inline-flex min-h-9 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors ${
                    tab === item.id
                      ? "bg-[var(--color-green-deep)] text-white shadow-[0_10px_20px_rgba(53,91,49,0.18)]"
                      : "border border-[color:rgba(31,41,22,0.08)] bg-white text-[var(--color-interactive-ink)] hover:bg-[var(--color-screen)]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {selectedIds.length > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="font-semibold text-[var(--color-heading)]">{selectedIds.length} selected</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="inline-flex min-h-9 items-center justify-center rounded-full border border-[color:rgba(31,41,22,0.08)] bg-white px-3 text-sm font-semibold text-[var(--color-interactive-ink)]"
                  >
                    Assign role
                  </button>
                  <button
                    type="button"
                    className="inline-flex min-h-9 items-center justify-center rounded-full border border-[color:rgba(31,41,22,0.08)] bg-white px-3 text-sm font-semibold text-[var(--color-interactive-ink)]"
                  >
                    Lock
                  </button>
                  <button
                    type="button"
                    className="inline-flex min-h-9 items-center justify-center rounded-full bg-[rgba(163,69,45,0.1)] px-3 text-sm font-semibold text-[var(--color-danger)]"
                    onClick={() => setSelectedIds([])}
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-1.5 px-3 pb-3 pt-2 sm:px-4">
              <thead>
                <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  <th className="px-3">
                    <input
                      type="checkbox"
                      aria-label="Select all visible"
                      checked={selectedIds.length > 0 && selectedIds.length === visibleUsers.length}
                      onChange={(e) => toggleAllVisible(e.target.checked)}
                    />
                  </th>
                  <th className="px-3">User</th>
                  <th className="px-3">Role</th>
                  <th className="px-3">Verification</th>
                  <th className="px-3">District</th>
                  <th className="px-3">Activity</th>
                  <th className="px-3">Trust</th>
                  <th className="px-3">Last active</th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((u) => {
                  const isSelected = selectedIds.includes(u.id);
                  const isActive = selectedUserId === u.id;
                  const trust = clampScore(u.trustScore);
                  return (
                    <tr
                      key={u.id}
                      className={`cursor-pointer rounded-[1rem] text-sm ${
                        isActive ? "bg-[rgba(53,91,49,0.09)]" : "bg-[var(--color-screen)] hover:bg-white"
                      }`}
                      onClick={() => {
                        setSelectedUserId(u.id);
                        setIsProfileOpen(true);
                      }}
                    >
                      <td className={`px-3 ${tablePadY} rounded-l-[1rem]`}>
                        <input
                          type="checkbox"
                          aria-label={`Select ${u.displayName}`}
                          checked={isSelected}
                          onChange={(e) => toggleSelected(u.id, e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className={`px-3 ${tablePadY}`}>
                        <div className="min-w-0">
                          <div className="font-semibold text-[var(--color-heading)]">{u.displayName}</div>
                          <div className="mt-0.5 truncate text-xs text-[var(--color-muted)]">{u.email}</div>
                        </div>
                      </td>
                      <td className={`px-3 ${tablePadY}`}>
                        <StatusBadge tone={roleTone(u.role)}>{u.role}</StatusBadge>
                      </td>
                      <td className={`px-3 ${tablePadY}`}>
                        <StatusBadge tone={verifyTone(u.growerVerificationStatus)}>{u.growerVerificationStatus}</StatusBadge>
                      </td>
                      <td className={`px-3 ${tablePadY} text-[var(--color-muted)]`}>{u.district}</td>
                      <td className={`px-3 ${tablePadY} text-[var(--color-muted)]`}>
                        {u.totals.posts}p • {u.totals.listings}l • {u.totals.orders}o
                      </td>
                      <td className={`px-3 ${tablePadY}`}>
                        <StatusBadge tone={scoreTone(trust)}>{trust}</StatusBadge>
                      </td>
                      <td className={`px-3 ${tablePadY} rounded-r-[1rem] text-[var(--color-muted)]`}>{u.lastActiveAt}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>

        <div className="space-y-4">
          <article className="rounded-[1.2rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 p-4 shadow-[0_12px_22px_rgba(33,49,30,0.06)]">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Verification queue</div>
              <StatusBadge tone="warning">{verificationQueue.length}</StatusBadge>
            </div>
            <div className="mt-3 space-y-2">
              {verificationQueue.map((item) => (
                <button
                  key={item.userId}
                  type="button"
                  className="w-full rounded-lg border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-3 py-2 text-left text-sm transition-colors hover:bg-white"
                  onClick={() => {
                    setSelectedUserId(item.userId);
                    setIsProfileOpen(true);
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-[var(--color-heading)]">{item.displayName}</span>
                    <StatusBadge tone={item.status === "PENDING" ? "warning" : item.status === "REVOKED" ? "danger" : "neutral"}>
                      {item.status}
                    </StatusBadge>
                  </div>
                  <div className="mt-1 text-xs text-[var(--color-muted)]">{item.district} • {item.requestedAt}</div>
                </button>
              ))}
              {verificationQueue.length === 0 ? (
                <div className="rounded-lg border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-3 py-2 text-sm text-[var(--color-muted)]">
                  No verification items right now.
                </div>
              ) : null}
            </div>
          </article>
        </div>
      </section>

      <UserDetailPanel
        open={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={selected}
        activity={selected ? activitiesByUser[selected.id] ?? [] : []}
        disabled={isSaving}
        onPatch={async (userId, patch) => {
          if (isSaving) return;
          const current = users.find((u) => u.id === userId);
          if (!current) return;
          setError(null);
          setIsSaving(true);

          const optimistic: UserRow = { ...current, ...patch };
          setUsers((cur) => cur.map((u) => (u.id === userId ? optimistic : u)));

          try {
            const updated = await updateAdminUser(userId, patch);
            setUsers((cur) => cur.map((u) => (u.id === userId ? updated : u)));

            if ("growerVerificationStatus" in patch && patch.growerVerificationStatus) {
              setVerificationQueue((cur) => cur.filter((item) => item.userId !== userId));
            }
          } catch (err) {
            setUsers((cur) => cur.map((u) => (u.id === userId ? current : u)));
            setError(err instanceof Error ? err.message : "Failed to update user.");
          } finally {
            setIsSaving(false);
          }
        }}
      />
    </div>
  );
}
