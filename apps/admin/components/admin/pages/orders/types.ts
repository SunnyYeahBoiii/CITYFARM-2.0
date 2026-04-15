export type OrderStatus =
  | "DRAFT"
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "READY_FOR_PICKUP"
  | "COMPLETED"
  | "CANCELLED";

export type PaymentMethod = "CASH_ON_PICKUP" | "CASH_ON_DELIVERY" | "UNPAID";

export type OrderLine = {
  sku: string;
  name: string;
  quantity: number;
  unitPriceAmount: number;
  totalPriceAmount: number;
};

export type OrderTimelineEvent = {
  id: string;
  at: string;
  title: string;
  description: string;
  tone: "success" | "warning" | "danger" | "neutral" | "info";
};

export type OpsFlag = {
  id: string;
  label: string;
  tone: "success" | "warning" | "danger" | "neutral" | "info";
  description?: string;
};

export type AdminOrder = {
  id: string;
  code: string;
  createdAt: string;
  buyer: {
    name: string;
    phone: string;
  };
  delivery: {
    city: string;
    district?: string;
    address?: string;
    note?: string;
  };
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  currency: "VND";
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  customerNote?: string;
  internalNote?: string;
  lines: OrderLine[];
  flags: OpsFlag[];
  timeline: OrderTimelineEvent[];
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  DRAFT: "Draft",
  PENDING_CONFIRMATION: "Pending confirmation",
  CONFIRMED: "Confirmed",
  READY_FOR_PICKUP: "Ready for pickup",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH_ON_PICKUP: "Cash on pickup",
  CASH_ON_DELIVERY: "Cash on delivery",
  UNPAID: "Unpaid",
};

