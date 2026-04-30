"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  type Cart,
  type AddToCartPayload,
} from "./cart-api";

// Query keys
export const cartKeys = {
  all: ["cart"] as const,
  cart: () => [...cartKeys.all] as const,
};

// Hooks
export function useCart() {
  return useQuery({
    queryKey: cartKeys.cart(),
    queryFn: fetchCart,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddToCartPayload) => addToCart(payload),
    onMutate: async (payload) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: cartKeys.cart() });

      // Snapshot the previous value
      const previousCart = queryClient.getQueryData<Cart | null>(cartKeys.cart());

      // Optimistically update to the new value
      if (previousCart) {
        const existingItem = previousCart.items.find(
          (item) =>
            item.productId === payload.productId &&
            item.selectedComponentId === (payload.selectedComponentId ?? null)
        );

        if (existingItem) {
          // Update existing item quantity
          const newQuantity = existingItem.quantity + (payload.quantity ?? 1);
          const newItems = previousCart.items.map((item) =>
            item.id === existingItem.id
              ? {
                  ...item,
                  quantity: newQuantity,
                  totalPrice: item.unitPrice * newQuantity,
                }
              : item
          );
          const newSubtotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
          queryClient.setQueryData<Cart>(cartKeys.cart(), {
            ...previousCart,
            items: newItems,
            subtotal: newSubtotal,
            itemCount: newItems.length,
          });
        } else {
          // Add placeholder item (will be replaced with real data on success)
          // For now, we just mark that cart has pending update
        }
      }

      return { previousCart };
    },
    onError: (_err, _payload, context) => {
      // Rollback to the previous value
      if (context?.previousCart) {
        queryClient.setQueryData(cartKeys.cart(), context.previousCart);
      }
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: cartKeys.cart() });
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateCartItem(itemId, quantity),
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.cart() });

      const previousCart = queryClient.getQueryData<Cart | null>(cartKeys.cart());

      if (previousCart) {
        const newItems = previousCart.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity,
                totalPrice: item.unitPrice * quantity,
              }
            : item
        ).filter((item) => item.quantity > 0);

        const newSubtotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
        queryClient.setQueryData<Cart>(cartKeys.cart(), {
          ...previousCart,
          items: newItems,
          subtotal: newSubtotal,
          itemCount: newItems.length,
        });
      }

      return { previousCart };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(cartKeys.cart(), context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.cart() });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.cart() });

      const previousCart = queryClient.getQueryData<Cart | null>(cartKeys.cart());

      if (previousCart) {
        const newItems = previousCart.items.filter((item) => item.id !== itemId);
        const newSubtotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
        queryClient.setQueryData<Cart>(cartKeys.cart(), {
          ...previousCart,
          items: newItems,
          subtotal: newSubtotal,
          itemCount: newItems.length,
        });
      }

      return { previousCart };
    },
    onError: (_err, _itemId, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(cartKeys.cart(), context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.cart() });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => clearCart(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: cartKeys.cart() });
      const previousCart = queryClient.getQueryData<Cart | null>(cartKeys.cart());

      // Optimistically clear cart
      if (previousCart) {
        queryClient.setQueryData<Cart>(cartKeys.cart(), {
          ...previousCart,
          items: [],
          subtotal: 0,
          itemCount: 0,
        });
      }

      return { previousCart };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(cartKeys.cart(), context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: cartKeys.cart() });
    },
  });
}