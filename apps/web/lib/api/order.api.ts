import { api } from "../client";

export interface CreateOrderPayload {
  productType: "KIT" | "SEED" | "SOIL" | "POT";
  productId: string;
  quantity?: number;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  deliveryCity?: string;
  deliveryDistrict?: string;
  deliveryWard?: string;
  customerNote?: string;
}

export interface OrderItemResponse {
  product: {
    id: string;
    name: string;
    type: string;
    priceAmount: number;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderResponse {
  id: string;
  orderCode: string;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  items: OrderItemResponse[];
}

export async function createOrder(payload: CreateOrderPayload): Promise<OrderResponse> {
  const { data } = await api.post<OrderResponse>("/orders", payload);
  return data;
}
