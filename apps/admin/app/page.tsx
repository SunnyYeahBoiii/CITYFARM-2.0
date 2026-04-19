import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { requireAdminUser } from "@/lib/auth-server";
import {
  activityFeed,
  alertQueue,
  dashboardKpis,
  districtPerformance,
  moderationQueue,
  orderHealthCards,
  recentOrders,
} from "@/components/admin/dashboard-data";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function Home() {
  await requireAdminUser();

  return (
    <AdminShell
      active="dashboard"
      title="Operations Dashboard"
      description="Bố cục compact cho ca trực: đọc nhanh chỉ số, queue và cảnh báo trong một màn hình, giảm card trang trí và ưu tiên dữ liệu thao tác."
      actions={
        <>
          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[color:rgba(31,41,22,0.08)] bg-white px-4 text-sm font-semibold text-[var(--color-interactive-ink)] transition-colors hover:bg-[var(--color-screen)]"
          >
            Export
          </button>
          <button
            type="button"
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#567a3d,#2d4a24)] px-4 text-sm font-semibold text-white shadow-[0_14px_24px_rgba(53,91,49,0.18)] transition-transform hover:-translate-y-0.5"
          >
            Open queue
          </button>
        </>
      }
    >
      <section className="rounded-[1.2rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 px-4 py-3 shadow-[0_12px_22px_rgba(33,49,30,0.06)]">
        <div className="flex flex-wrap items-center gap-2">
          {dashboardKpis.map((item) => (
            <StatusBadge key={item.label} tone={item.tone}>
              {item.label}: {item.value} ({item.delta})
            </StatusBadge>
          ))}
          <span className="ml-auto text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">Realtime snapshot</span>
        </div>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.95fr)]">
        <article className="rounded-[1.2rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 p-4 shadow-[0_12px_22px_rgba(33,49,30,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Moderation queue</div>
            <StatusBadge tone="warning">{moderationQueue.length} active</StatusBadge>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[color:rgba(31,41,22,0.08)] text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  <th className="px-2 py-2">Author</th>
                  <th className="px-2 py-2">Type</th>
                  <th className="px-2 py-2">District</th>
                  <th className="px-2 py-2">Signals</th>
                  <th className="px-2 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {moderationQueue.map((row) => (
                  <tr key={row.author + row.caption} className="border-b border-[color:rgba(31,41,22,0.06)]">
                    <td className="px-2 py-2.5">
                      <div className="font-semibold text-[var(--color-heading)]">{row.author}</div>
                      <div className="text-xs text-[var(--color-muted)]">{row.time}</div>
                    </td>
                    <td className="px-2 py-2.5 text-[var(--color-muted)]">{row.type}</td>
                    <td className="px-2 py-2.5 text-[var(--color-muted)]">{row.district}</td>
                    <td className="px-2 py-2.5 text-[var(--color-muted)]">{row.signals}</td>
                    <td className="px-2 py-2.5">
                      <StatusBadge tone={row.tone}>{row.status}</StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-[1.2rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 p-4 shadow-[0_12px_22px_rgba(33,49,30,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Operational alerts</div>
            <StatusBadge tone="danger">{alertQueue.length} high</StatusBadge>
          </div>
          <div className="mt-3 space-y-2">
            {alertQueue.map((item) => (
              <div key={item.title} className="rounded-lg border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold text-[var(--color-heading)]">{item.title}</div>
                  <StatusBadge tone={item.tone}>{item.label}</StatusBadge>
                </div>
                <div className="mt-1 text-xs leading-5 text-[var(--color-muted)]">{item.description}</div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)_minmax(0,0.8fr)]">
        <article className="rounded-[1.2rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 p-4 shadow-[0_12px_22px_rgba(33,49,30,0.06)]">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Focus lanes</div>
            <StatusBadge tone="info">Today</StatusBadge>
          </div>
          <div className="mt-3 space-y-2">
            {orderHealthCards.map((item) => (
              <div key={item.title} className="rounded-lg border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-[var(--color-heading)]">{item.title}</div>
                  <StatusBadge tone={item.tone}>{item.status}</StatusBadge>
                </div>
                <div className="mt-1 text-xs text-[var(--color-muted)]">{item.metric}</div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.2rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 p-4 shadow-[0_12px_22px_rgba(33,49,30,0.06)]">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Fulfillment orders</div>
            <StatusBadge tone="warning">{recentOrders.length} latest</StatusBadge>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-[color:rgba(31,41,22,0.08)] text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                  <th className="px-2 py-2">Order</th>
                  <th className="px-2 py-2">Buyer</th>
                  <th className="px-2 py-2">Amount</th>
                  <th className="px-2 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((row) => (
                  <tr key={row.code} className="border-b border-[color:rgba(31,41,22,0.06)]">
                    <td className="px-2 py-2.5">
                      <div className="font-semibold text-[var(--color-heading)]">{row.code}</div>
                      <div className="text-xs text-[var(--color-muted)]">{row.createdAt}</div>
                    </td>
                    <td className="px-2 py-2.5 text-[var(--color-muted)]">{row.buyer}</td>
                    <td className="px-2 py-2.5 font-semibold text-[var(--color-heading)]">{row.amount}</td>
                    <td className="px-2 py-2.5">
                      <StatusBadge tone={row.tone}>{row.status}</StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-[1.2rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 p-4 shadow-[0_12px_22px_rgba(33,49,30,0.06)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">District watch</div>
          <div className="mt-3 space-y-2">
            {districtPerformance.map((item) => (
              <div key={item.name} className="rounded-lg border border-[color:rgba(31,41,22,0.08)] bg-[var(--color-screen)] px-3 py-2">
                <div className="text-sm font-semibold text-[var(--color-heading)]">{item.name}</div>
                <div className="text-xs text-[var(--color-muted)]">{item.value}</div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-4 rounded-[1.2rem] border border-[color:rgba(31,41,22,0.08)] bg-white/88 p-4 shadow-[0_12px_22px_rgba(33,49,30,0.06)]">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">Activity log</div>
          <StatusBadge tone="neutral">{activityFeed.length} events</StatusBadge>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[color:rgba(31,41,22,0.08)] text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                <th className="px-2 py-2">Time</th>
                <th className="px-2 py-2">Event</th>
                <th className="px-2 py-2">Tag</th>
                <th className="px-2 py-2">Detail</th>
              </tr>
            </thead>
            <tbody>
              {activityFeed.map((item) => (
                <tr key={item.title} className="border-b border-[color:rgba(31,41,22,0.06)]">
                  <td className="px-2 py-2.5 text-xs text-[var(--color-muted)]">{item.time}</td>
                  <td className="px-2 py-2.5 font-semibold text-[var(--color-heading)]">{item.title}</td>
                  <td className="px-2 py-2.5">
                    <StatusBadge tone={item.tone}>{item.tag}</StatusBadge>
                  </td>
                  <td className="px-2 py-2.5 text-[var(--color-muted)]">{item.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
