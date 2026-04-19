import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { UsersScreen } from "@/components/admin/pages/users/UsersScreen";
import { requireAdminUser } from "@/lib/auth-server";
import { getAdminUsersData } from "@/lib/api/admin";

export const metadata: Metadata = {
  title: "Users",
};

export default async function UsersPage() {
  await requireAdminUser();

  let payload: Awaited<ReturnType<typeof getAdminUsersData>> | null = null;
  let initialError: string | null = null;
  try {
    payload = await getAdminUsersData();
  } catch (error) {
    initialError = error instanceof Error ? error.message : "Failed to load users.";
  }

  return (
    <AdminShell
      active="users"
      title="Users & Trust"
      description="Quản trị tài khoản, vai trò và grower verification. Màn hình này ưu tiên scan nhanh theo district và rủi ro vận hành hơn là một bảng enterprise khô cứng."
      actions={
        <>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:rgba(31,41,22,0.08)] bg-white px-4 text-sm font-semibold text-[var(--color-interactive-ink)] transition-colors hover:bg-[var(--color-screen)]"
          >
            Export users
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#567a3d,#2d4a24)] px-4 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(53,91,49,0.18)] transition-transform hover:-translate-y-0.5"
          >
            Invite admin
          </button>
        </>
      }
    >
      <UsersScreen
        initialUsers={payload?.users ?? []}
        initialVerificationQueue={payload?.verificationQueue ?? []}
        initialActivitiesByUser={payload?.activitiesByUser ?? {}}
        initialError={initialError}
      />
    </AdminShell>
  );
}
