# Implementation Plan: Shopping Cart

## Overview
Add multi-item shopping cart to marketplace. Users can add multiple products, adjust quantities, checkout as single order.
Full production: server-side cart, TanStack Query for state management, optimistic UI, guest→auth merge, stock validation.

## Step 1: Database Schema

### 1.1 Add Cart models to `apps/api/prisma/schema.prisma`

```prisma
model Cart {
  id        String     @id @default(cuid())
  userId    String
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     CartItem[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  @@unique([userId])
}

model CartItem {
  id                 String  @id @default(cuid())
  cartId             String
  cart               Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId          String
  product            Product @relation(fields: [productId], references: [id])
  quantity           Int     @default(1)
  selectedComponentId String?
  createdAt          DateTime @default(now())

  @@unique([cartId, productId, selectedComponentId])
}
```

### 1.2 Run migration

```bash
npx prisma migrate dev --name add_cart_models
```

---

## Step 2: Backend Cart API

### 2.1 Create `apps/api/src/cart/cart.service.ts`

```typescript
@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: string) {
    return this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true, name: true, description: true,
                basePrice: true, images: true,
                components: { select: { id: true, name: true, priceDiff: true } },
              },
            },
          },
        },
      },
    });
  }

  async addToCart(userId: string, productId: string, quantity: number = 1, selectedComponentId?: string) {
    let cart = await this.prisma.cart.findUnique({ where: { userId } });

    if (!cart) {
      cart = await this.prisma.cart.create({ data: { userId } });
    }

    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_productId_selectedComponentId: { cartId: cart.id, productId, selectedComponentId } },
    });

    if (existing) {
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: { increment: quantity } },
        include: { product: true },
      });
    }

    return this.prisma.cartItem.create({
      data: { cartId: cart.id, productId, quantity, selectedComponentId },
      include: { product: true },
    });
  }

  async updateQuantity(userId: string, itemId: string, quantity: number) {
    if (quantity <= 0) return this.removeFromCart(userId, itemId);

    const cart = await this.getCart(userId);
    if (!cart) throw new NotFoundException('Cart not found');

    const item = cart.items.find(i => i.id === itemId);
    if (!item) throw new NotFoundException('Cart item not found');

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: { product: true },
    });
  }

  async removeFromCart(userId: string, itemId: string) {
    const cart = await this.getCart(userId);
    if (!cart) throw new NotFoundException('Cart not found');

    return this.prisma.cartItem.delete({ where: { id: itemId } });
  }

  async clearCart(userId: string) {
    const cart = await this.getCart(userId);
    if (!cart) return;

    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  async validateCartItems(userId: string) {
    const cart = await this.getCart(userId);
    if (!cart || cart.items.length === 0) return { valid: true, items: [] };

    const productIds = cart.items.map(i => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, basePrice: true, name: true },
    });

    const invalidItems: { item: any; reason: string }[] = [];

    for (const cartItem of cart.items) {
      const product = products.find(p => p.id === cartItem.productId);
      if (!product) {
        invalidItems.push({ item: cartItem, reason: 'Product no longer available' });
      }
    }

    return { valid: invalidItems.length === 0, invalidItems, cart };
  }
}
```

### 2.2 Create `apps/api/src/cart/cart.controller.ts`

```typescript
@Controller('api/cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  async getCart(@CurrentUser() user: { id: string }) {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  async addItem(
    @CurrentUser() user: { id: string },
    @Body() body: { productId: string; quantity?: number; selectedComponentId?: string },
  ) {
    return this.cartService.addToCart(user.id, body.productId, body.quantity ?? 1, body.selectedComponentId);
  }

  @Patch('items/:id')
  async updateQuantity(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() body: { quantity: number },
  ) {
    return this.cartService.updateQuantity(user.id, id, body.quantity);
  }

  @Delete('items/:id')
  async removeItem(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    return this.cartService.removeFromCart(user.id, id);
  }

  @Delete()
  async clearCart(@CurrentUser() user: { id: string }) {
    return this.cartService.clearCart(user.id);
  }
}
```

### 2.3 Create `apps/api/src/cart/cart.module.ts`

```typescript
@Module({
  imports: [PrismaModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
```

### 2.4 Register in `apps/api/src/app.module.ts`

Add `CartModule` to imports.

---

## Step 3: Multi-Item Order Creation

### 3.1 Modify `apps/api/src/order/order.service.ts`

Add `createOrderFromCart` method:

```typescript
async createOrderFromCart(userId: string, shippingAddress: any, notes?: string) {
  const { cart, valid, invalidItems } = await this.cartService.validateCartItems(userId);

  if (!valid) {
    throw new BadRequestException('Invalid cart items', { invalidItems });
  }

  if (!cart || cart.items.length === 0) {
    throw new BadRequestException('Cart is empty');
  }

  // Capture current prices at checkout time
  const orderItems = cart.items.map(item => ({
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: item.product.basePrice,
    selectedComponentId: item.selectedComponentId,
  }));

  const total = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const order = await this.prisma.$transaction(async (tx) => {
    const newOrder = await tx.order.create({
      data: {
        userId,
        total,
        status: 'PENDING',
        shippingAddress,
        notes,
        items: { createMany: { data: orderItems } },
      },
      include: { items: { include: { product: true } } },
    });

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return newOrder;
  });

  return order;
}
```

### 3.2 Add endpoint in `apps/api/src/order/order.controller.ts`

```typescript
@Post('from-cart')
@UseGuards(JwtAuthGuard)
async createOrderFromCart(
  @CurrentUser() user: { id: string },
  @Body() body: { shippingAddress: any; notes?: string },
) {
  return this.orderService.createOrderFromCart(user.id, body.shippingAddress, body.notes);
}
```

### 3.3 Create `apps/api/src/dtos/cart/add-to-cart.dto.ts`

```typescript
export class AddToCartDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsString()
  selectedComponentId?: string;
}
```

---

## Step 4: Frontend Cart with TanStack Query

### 4.1 Create `apps/web/lib/cart-api.ts`

```typescript
import { apiFetch } from './client';

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  selectedComponentId: string | null;
  product: {
    id: string;
    name: string;
    basePrice: number;
    images: any[];
    components: { id: string; name: string; priceDiff: number }[];
  };
}

export interface Cart {
  id: string;
  items: CartItem[];
}

export async function fetchCart(): Promise<Cart | null> {
  const res = await apiFetch('/api/cart');
  if (!res.ok) return null;
  return res.json();
}

export async function addToCart(productId: string, quantity = 1, selectedComponentId?: string) {
  const res = await apiFetch('/api/cart/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, quantity, selectedComponentId }),
  });
  return res.json();
}

export async function updateCartItem(itemId: string, quantity: number) {
  const res = await apiFetch(`/api/cart/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });
  return res.json();
}

export async function removeCartItem(itemId: string) {
  const res = await apiFetch(`/api/cart/items/${itemId}`, { method: 'DELETE' });
  return res.json();
}

export async function clearCart() {
  const res = await apiFetch('/api/cart', { method: 'DELETE' });
  return res.json();
}
```

### 4.2 Create `apps/web/lib/useCart.ts`

```typescript
import {
  useQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import * as cartApi from './cart-api';

const CART_KEY = ['cart'];

export function useCart() {
  return useQuery<Cart | null>({
    queryKey: CART_KEY,
    queryFn: cartApi.fetchCart,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, quantity, selectedComponentId }: {
      productId: string; quantity?: number; selectedComponentId?: string;
    }) => cartApi.addToCart(productId, quantity, selectedComponentId),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: CART_KEY });
      const previous = queryClient.getQueryData<Cart | null>(CART_KEY);

      queryClient.setQueryData(CART_KEY, (old: Cart | null) => {
        if (!old) return { id: 'pending', items: [{ id: 'pending', productId: vars.productId, quantity: vars.quantity ?? 1, selectedComponentId: vars.selectedComponentId ?? null, product: { id: vars.productId, name: '...', basePrice: 0, images: [], components: [] } }] };

        const existing = old.items.find(i => i.productId === vars.productId && i.selectedComponentId === vars.selectedComponentId);
        if (existing) {
          return {
            ...old,
            items: old.items.map(i =>
              i.id === existing.id ? { ...i, quantity: i.quantity + (vars.quantity ?? 1) } : i
            ),
          };
        }

        return {
          ...old,
          items: [...old.items, { id: `opt-${Date.now()}`, productId: vars.productId, quantity: vars.quantity ?? 1, selectedComponentId: vars.selectedComponentId ?? null, product: { id: vars.productId, name: '...', basePrice: 0, images: [], components: [] } }],
        };
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CART_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_KEY });
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartApi.updateCartItem(itemId, quantity),
    onMutate: async ({ itemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: CART_KEY });
      const previous = queryClient.getQueryData<Cart | null>(CART_KEY);

      if (quantity <= 0) {
        queryClient.setQueryData(CART_KEY, (old: Cart | null) =>
          old ? { ...old, items: old.items.filter(i => i.id !== itemId) } : old
        );
      } else {
        queryClient.setQueryData(CART_KEY, (old: Cart | null) =>
          old ? { ...old, items: old.items.map(i => i.id === itemId ? { ...i, quantity } : i) } : old
        );
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(CART_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: CART_KEY }),
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => cartApi.removeCartItem(itemId),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: CART_KEY });
      const previous = queryClient.getQueryData<Cart | null>(CART_KEY);

      queryClient.setQueryData(CART_KEY, (old: Cart | null) =>
        old ? { ...old, items: old.items.filter(i => i.id !== itemId) } : old
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(CART_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: CART_KEY }),
  });
}
```

---

## Step 5: Cart UI Components

### 5.1 Create `apps/web/components/cityfarm/features/CartScreen.tsx`

Cart screen with:
- List of cart items with images, name, price
- Quantity stepper (+/-) per item
- Remove button per item
- Subtotal display
- "Proceed to Checkout" button
- Empty state with "Browse Marketplace" CTA
- Loading skeleton

### 5.2 Add cart route: `apps/web/app/(tabs)/cart/page.tsx`

```typescript
import CartScreen from '@/components/cityfarm/features/CartScreen';

export default function CartPage() {
  return <CartScreen />;
}
```

### 5.3 Add cart icon to navigation

Modify `apps/web/components/cityfarm/layout/ShellBottomDock.tsx`:
- Add cart tab with badge showing `items.length`
- Badge uses TanStack Query `useCart` data

### 5.4 Add "Add to Cart" button to product detail

Modify marketplace product detail view:
- Replace "Buy Now" with "Add to Cart" + quantity selector
- Show success toast on add
- Option to "View Cart" after adding

---

## Step 6: Multi-Item Checkout

### 6.1 Modify existing checkout flow

Current `OrderScreen.tsx` is single-item wizard. Extend to support cart:

- Step 1: Review cart items (existing)
- Step 2: Shipping address (existing)
- Step 3: Order summary with totals per item (modified)
- Step 4: Confirmation (existing)

Call `POST /api/orders/from-cart` instead of single-item order endpoint.

### 6.2 Stock validation at checkout

Before showing Step 3, call `GET /api/cart` and validate:
- All products still exist
- Quantities within limits
- Prices haven't changed (show warning if they have)

---

## Files Changed

| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Add Cart + CartItem models |
| `apps/api/src/cart/cart.service.ts` | New: cart CRUD service |
| `apps/api/src/cart/cart.controller.ts` | New: cart endpoints |
| `apps/api/src/cart/cart.module.ts` | New: cart module |
| `apps/api/src/app.module.ts` | Register CartModule |
| `apps/api/src/order/order.service.ts` | Add `createOrderFromCart` |
| `apps/api/src/order/order.controller.ts` | Add `POST from-cart` endpoint |
| `apps/api/src/dtos/cart/add-to-cart.dto.ts` | New: validation DTO |
| `apps/web/lib/cart-api.ts` | New: cart API client |
| `apps/web/lib/useCart.ts` | New: TanStack Query hooks |
| `apps/web/components/cityfarm/features/CartScreen.tsx` | New: cart UI |
| `apps/web/app/(tabs)/cart/page.tsx` | New: cart route |
| `apps/web/components/cityfarm/layout/ShellBottomDock.tsx` | Add cart tab with badge |
| `apps/web/components/cityfarm/features/OrderScreen.tsx` | Extend for multi-item checkout |

---

## Testing Checklist

- [ ] Add item to cart (new + existing product)
- [ ] Update quantity (+/-)
- [ ] Remove item from cart
- [ ] Clear cart
- [ ] Cart badge updates correctly
- [ ] Checkout creates order with all items
- [ ] Cart cleared after successful order
- [ ] Out-of-stock product handled at checkout
- [ ] Price change warning shown
- [ ] Optimistic UI rolls back on error
- [ ] Empty cart shows correct state
- [ ] Cart persists across page reloads
