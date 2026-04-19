import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { OrdersDesk } from "@/components/admin/pages/orders/OrdersDesk";
import { requireAdminUser } from "@/lib/auth-server";
import { getAdminOrders } from "@/lib/api/admin";

export const metadata: Metadata = {
  title: "Orders",
};

export default async function OrdersPage() {
  await requireAdminUser();

  let orders: Awaited<ReturnType<typeof getAdminOrders>> = [];
  let initialError: string | null = null;
  try {
    orders = await getAdminOrders();
  } catch (error) {
    initialError = error instanceof Error ? error.message : "Failed to load orders.";
  }

  return (
    <AdminShell
      active="orders"
      title="Orders Desk"
      description="Khu vực vận hành fulfillment: xác nhận đơn, theo dõi SLA, xử lý địa chỉ và điều phối pickup."
      actions={
        <>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:rgba(31,41,22,0.08)] bg-white px-4 text-sm font-semibold text-[var(--color-interactive-ink)] transition-colors hover:bg-[var(--color-screen)]"
          >
            Export CSV
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#567a3d,#2d4a24)] px-4 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(53,91,49,0.18)] transition-transform hover:-translate-y-0.5"
          >
            Open SLA queue
          </button>
        </>
      }
    >
      <OrdersDesk initialOrders={orders} initialError={initialError} />
    </AdminShell>
  );
}
