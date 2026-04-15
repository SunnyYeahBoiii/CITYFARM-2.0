import { api } from "../client";
import type { ProductTypeQuery } from "../types/shop";

export const shopApi = {
  getProducts: async (type: ProductTypeQuery) => {
    const response = await api.get(`/shop/products?type=${type}`);
    return response.data;
  },

  placeOrder: async (productId: string, quantity: number = 1) => {
    const response = await api.post("/shop/orders", { productId, quantity });
    return response.data;
  },
};
