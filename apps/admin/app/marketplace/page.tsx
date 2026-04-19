import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { MarketplaceClient } from "@/components/admin/pages/marketplace/MarketplaceClient";
import { requireAdminUser } from "@/lib/auth-server";
import { getAdminListings } from "@/lib/api/admin";

export const metadata: Metadata = {
  title: "Marketplace",
};

export default async function MarketplacePage() {
  await requireAdminUser();

  let listings = [] as Awaited<ReturnType<typeof getAdminListings>>;
  let initialError: string | undefined;

  try {
    listings = await getAdminListings();
  } catch (error) {
    initialError = error instanceof Error ? error.message : "Failed to load marketplace listings.";
  }

  return (
    <AdminShell
      active="marketplace"
      title="Marketplace Listings"
      description="Bàn điều phối cho listing cây trồng: review chất lượng ảnh, kiểm tra seller, xác minh nguồn và quản lý trạng thái theo district."
      actions={
        <>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:rgba(31,41,22,0.08)] bg-white px-4 text-sm font-semibold text-[var(--color-interactive-ink)] transition-colors hover:bg-[var(--color-screen)]"
          >
            Export listings
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#567a3d,#2d4a24)] px-4 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(53,91,49,0.18)] transition-transform hover:-translate-y-0.5"
          >
            Open verification queue
          </button>
        </>
      }
    >
      <MarketplaceClient initialListings={listings} initialError={initialError} />
    </AdminShell>
  );
}
