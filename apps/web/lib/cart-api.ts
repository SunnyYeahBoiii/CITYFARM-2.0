import { api } from "./client";

// Types
export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  selectedComponentId: string | null;
  product: {
    id: string;
    name: string;
    priceAmount: number;
    currency: string;
    type: string;
    description: string | null;
    image: string | null;
    components: Array<{
      id: string;
      componentName: string;
      quantity: number;
      unit: string | null;
    }>;
  };
  unitPrice: number;
  totalPrice: number;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  currency: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartPayload {
  productId: string;
  quantity?: number;
  selectedComponentId?: string;
}

export interface UpdateQuantityPayload {
  quantity: number;
}

// API functions
export async function fetchCart(): Promise<Cart | null> {
  const { data } = await api.get<Cart | null>("/cart");
  return data;
}

export async function addToCart(payload: AddToCartPayload): Promise<Cart> {
  const { data } = await api.post<Cart>("/cart/items", payload);
  return data;
}

export async function updateCartItem(
  itemId: string,
  quantity: number
): Promise<Cart> {
  const { data } = await api.patch<Cart>(`/cart/items/${itemId}`, { quantity });
  return data;
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  const { data } = await api.delete<Cart>(`/cart/items/${itemId}`);
  return data;
}

export async function clearCart(): Promise<Cart | null> {
  const { data } = await api.delete<Cart | null>("/cart");
  return data;
}

export async function validateCart(): Promise<{
  valid: boolean;
  errors: string[];
  validatedItems: any[];
  subtotal: number;
}> {
  const { data } = await api.get("/cart/validate");
  return data;
}