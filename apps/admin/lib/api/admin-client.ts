import { adminClientPatch } from "./client-fetch";
import type { AdminOrder } from "@/components/admin/pages/orders/types";
import type { UserRow, VerificationStatus, UserRole } from "@/components/admin/pages/users/users-data";

type PatchOrderPayload = {
  status: AdminOrder["status"];
  internalNote?: string;
};

type PatchUserPayload = {
  role?: UserRole;
  growerVerificationStatus?: VerificationStatus;
};

export async function updateAdminOrder(
  orderId: string,
  payload: PatchOrderPayload,
): Promise<AdminOrder> {
  return adminClientPatch<AdminOrder>(`/admin/orders/${orderId}`, payload);
}

export async function updateAdminUser(
  userId: string,
  payload: PatchUserPayload,
): Promise<UserRow> {
  return adminClientPatch<UserRow>(`/admin/users/${userId}`, payload);
}
