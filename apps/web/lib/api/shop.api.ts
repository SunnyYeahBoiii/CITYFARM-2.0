import { api } from "../client";
import type { ProductTypeQuery } from "../types/shop";

export const shopApi = {
  getProducts: async (type: ProductTypeQuery) => {
    const response = await api.get(`/shop/products?type=${type}`);
    return response.data;
  },

  buyNow: async (productId: string) => {
    const response = await api.post("/shop/orders/buy-now", { productId });
    return response.data;
  },
  
  getMyOrders: async () => {
    const response = await api.get("/shop/orders/my-orders");
    return response.data;
  },
};
