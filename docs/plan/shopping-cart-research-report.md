# Shopping Cart Feature Research Report
**Date**: 2026-04-28  
**Project**: CITYFARM-2.0  

---

## Executive Summary

CITYFARM-2.0 currently supports **single-item orders only** with no shopping cart functionality. Users must complete a separate order for each product. A multi-item cart with checkout is needed to improve the marketplace experience.

---

## 1. Current Order/Checkout Flow

### How Orders Are Created Now

**Flow**: Product Selection → Detail View → Shipping Form → Confirmation → Success

1. **Select Product Type** (`OrderScreen.tsx`)
   - User chooses category: kit, seed, dirt, pot
   - Products fetched via `shopApi.getProducts(type)`
   - Endpoint: `GET /shop/products?type={KIT|SEED|SOIL|POT}`

2. **View Product Detail**
   - User clicks product → `handleSelectProduct()` sets `selectedProduct`
   - Shows product details, components (for kits), price

3. **Shipping Form**
   - `handleProceedToShipping()` advances to step "shipping"
   - Collects: `recipientName`, `recipientPhone`, `deliveryAddress`, `deliveryCity`, `deliveryDistrict`, `deliveryWard`, `customerNote`
   - Vietnamese phone validation: `^(0|\+84)[0-9]{9,10}$`

4. **Confirmation**
   - `handleProceedToConfirm()` validates shipping
   - Shows order summary with single product

5. **Create Order**
   - `handleOrder()` calls `createOrder()` API
   - Endpoint: `POST /orders`
   - Body: `CreateOrderPayload` (single productId, quantity defaults to 1)
   - Returns: `OrderResponse` with `orderCode`, `activationCode` (for KIT/SEED)

### Key Limitation

**Orders are single-item by design**: The `CreateOrderDto` accepts only one `productId` and optional `quantity`. No array of items supported.

---

## 2. Product Listing Structure

### Product Model (Prisma)

```prisma
model Product {
  id              String              @id @default(uuid())
  sku             String              @unique
  slug            String              @unique
  name            String
  type            ProductType         // KIT, SEED, SOIL, POT
  description     String?
  priceAmount     Int                 // VND currency
  currency        String              @default("VND")
  isActive        Boolean             @default(true)
  plantSpeciesId  String?
  coverAssetId    String?
  metadata        Json?               // volumeLiters, diameterCm
  coverAsset      MediaAsset?
  components      ProductComponent[]  // For KIT type
}

enum ProductType {
  KIT
  SEED
  SOIL
  POT
}
```

### ProductComponent (Kit Composition)

```prisma
model ProductComponent {
  id                 String   @id @default(uuid())
  productId          String   // Parent kit
  componentProductId String?  // Reference to actual product
  componentName      String
  quantity           Int      @default(1)
  unit               String?
}
```

### MarketplaceListing (Peer-to-Peer)

**Separate from shop products** - this is user-generated listings:

```prisma
model MarketplaceListing {
  id            String    @id @default(uuid())
  sellerId      String
  gardenPlantId String
  title         String
  description   String?
  quantity      Decimal   @db.Decimal(8, 2)
  unit          String
  priceAmount   Int
  expiresAt     DateTime?
  seller        User      @relation("SellerListings")
}
```

**Note**: Marketplace listings use a different purchase flow (Purchase Wizard in `CommunityScreen.tsx`). This is distinct from the shop order flow.

---

## 3. Cart Model Analysis

### Current State: NO Cart Model Exists

```prisma
// Cart model exists: false
// All models: PlantSpecies, PlantCareProfile, Product, ProductComponent, 
// Order, OrderItem, KitActivationCode, FeedPost, FeedComment, PostReaction,
// MarketplaceListing, Conversation, ConversationParticipant, Message,
// GardenPlant, CareSchedule, CareTask, PlantJournalEntry, User, UserProfile,
// MediaAsset, SpaceScan, ScanRecommendation, ScanVisualization
```

### Order Model (Current)

```prisma
model Order {
  id                String        @id @default(uuid())
  orderCode         String        @unique
  buyerId           String
  status            OrderStatus   @default(DRAFT)
  paymentMethod     PaymentMethod @default(CASH_ON_PICKUP)
  subtotalAmount    Int
  discountAmount    Int           @default(0)
  totalAmount       Int
  currency          String        @default("VND")
  recipientName     String?
  recipientPhone    String?
  deliveryAddress   String?
  deliveryCity      String?
  deliveryDistrict  String?
  deliveryWard      String?
  customerNote      String?
  items             OrderItem[]
  buyer             User          @relation(...)
}
```

### OrderItem Model

```prisma
model OrderItem {
  id               String              @id @default(uuid())
  orderId          String
  productId        String
  quantity         Int
  unitPriceAmount  Int
  totalPriceAmount Int
  metadata         Json?
  activationCodes  KitActivationCode[] // For KIT/SEED
  order            Order               @relation(...)
  product          Product             @relation(...)
}
```

---

## 4. Recommended Cart Architecture

### Option Comparison

| Approach | Pros | Cons |
|----------|------|------|
| **Server-side Cart** | Persistent across sessions, authenticated users only, price validation at add-time, inventory checks | Requires DB writes, slower add-to-cart |
| **Client-side Cart** | Fast UX, no auth required for browsing, works for guest users | Lost on session end, stale prices, no inventory sync |
| **Hybrid** | Best of both - client cache + server sync on login, merge guest cart on auth | More complex sync logic |

### Recommendation: **Hybrid Approach**

1. **Guest Users**: Local storage cart (localStorage)
2. **Authenticated Users**: Server-side cart synced to database
3. **On Login**: Merge guest cart items into server cart
4. **Checkout**: All items validated against current prices/inventory

---

## 5. Database Schema Changes Needed

### New Models

```prisma
model Cart {
  id          String     @id @default(uuid())
  userId      String?    // null for guest carts (identified by session)
  sessionId   String?    // for guest cart identification
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  items       CartItem[]
  user        User?      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([userId])     // One cart per user
  @@unique([sessionId])  // One cart per guest session
  @@index([userId])
  @@index([sessionId])
}

model CartItem {
  id            String   @id @default(uuid())
  cartId        String
  productId     String
  quantity      Int      @default(1)
  unitPrice     Int      // Price at time of add (for display)
  addedAt       DateTime @default(now())
  updatedAt     DateTime @updatedAt
  cart          Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product       Product  @relation(fields: [productId], references: [id])
  
  @@unique([cartId, productId])  // One entry per product per cart
  @@index([cartId])
  @@index([productId])
}

// Add to User model:
model User {
  // ... existing fields
  cart         Cart?
}
```

### Enums (existing)

```prisma
enum OrderStatus {
  DRAFT        // Cart can create DRAFT order
  CONFIRMED    // User confirmed checkout
  PROCESSING   // Admin processing
  READY        // Ready for pickup/delivery
  COMPLETED    // Delivered/picked up
  CANCELLED    // Cancelled
}

enum PaymentMethod {
  CASH_ON_PICKUP
  CASH_ON_DELIVERY
  BANK_TRANSFER
  // Add: ONLINE_PAYMENT for future
}
```

---

## 6. API Endpoints Needed

### Cart Service (New)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cart` | Get current user's cart with items |
| POST | `/cart/items` | Add item to cart |
| PATCH | `/cart/items/:productId` | Update quantity |
| DELETE | `/cart/items/:productId` | Remove item from cart |
| DELETE | `/cart` | Clear entire cart |
| POST | `/cart/merge` | Merge guest cart on login |

### DTOs

```typescript
// Add to Cart
interface AddToCartDto {
  productId: string;
  quantity: number;  // Min 1, Max inventory limit
}

// Update Cart Item
interface UpdateCartItemDto {
  quantity: number;  // 0 = remove
}

// Cart Response
interface CartResponse {
  id: string;
  items: CartItemResponse[];
  subtotal: number;
  itemCount: number;
}

interface CartItemResponse {
  productId: string;
  product: {
    id: string;
    name: string;
    type: ProductType;
    priceAmount: number;  // Current price
    image?: string;
    isActive: boolean;
  };
  quantity: number;
  unitPrice: number;  // Price when added
  totalPrice: number;
}
```

### Checkout from Cart

```typescript
// New DTO for multi-item checkout
interface CreateOrderFromCartDto {
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  deliveryCity?: string;
  deliveryDistrict?: string;
  deliveryWard?: string;
  customerNote?: string;
  paymentMethod?: PaymentMethod;
}

// Endpoint
POST /orders/from-cart
```

---

## 7. Frontend Changes Needed

### State Management

**Recommend**: Zustand store for cart (simple, no provider wrapping needed)

```typescript
// apps/web/lib/stores/cart-store.ts
interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  syncFromServer: () => Promise<void>;
  getTotalItems: () => number;
  getSubtotal: () => number;
}
```

### New Pages/Components

1. **Cart Page**: `/apps/web/app/(tabs)/cart/page.tsx`
   - List cart items with quantity controls
   - Remove item buttons
   - Subtotal display
   - "Proceed to Checkout" button

2. **Cart Icon in Navigation**: Add to `OrderTab` or header
   - Badge showing item count
   - Links to `/cart`

3. **Checkout Flow** (modified from current):
   - Step 1: Review cart items (modify quantities)
   - Step 2: Shipping form (same as current)
   - Step 3: Order summary (all items)
   - Step 4: Success (with all activation codes)

4. **Add to Cart Button**: On product detail view
   - Replace "Proceed to Order" with "Add to Cart"
   - Show mini-toast confirmation

### Component Structure

```
apps/web/components/cityfarm/features/
  CartScreen.tsx         # Cart page main component
  CartItemRow.tsx        # Single cart item row
  CartSummary.tsx        # Subtotal, checkout button
  CheckoutScreen.tsx     # Multi-item checkout flow
```

---

## 8. Order Creation from Cart Items

### Service Logic

```typescript
async createOrderFromCart(userId: string, dto: CreateOrderFromCartDto) {
  const cart = await this.prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } }
  });
  
  if (!cart || cart.items.length === 0) {
    throw new BadRequestException('Cart is empty');
  }
  
  // Validate all products
  for (const item of cart.items) {
    if (!item.product.isActive) {
      throw new BadRequestException(`${item.product.name} is no longer available`);
    }
    // Check inventory if tracked
  }
  
  // Calculate totals with CURRENT prices (not stored prices)
  const itemsData = cart.items.map(item => ({
    productId: item.productId,
    quantity: item.quantity,
    unitPriceAmount: item.product.priceAmount,
    totalPriceAmount: item.product.priceAmount * item.quantity
  }));
  
  const subtotal = itemsData.reduce((sum, i) => sum + i.totalPriceAmount, 0);
  
  const order = await this.prisma.order.create({
    data: {
      buyerId: userId,
      orderCode: generateOrderCode(),
      status: OrderStatus.CONFIRMED,
      subtotalAmount: subtotal,
      totalAmount: subtotal,
      ...dto,
      items: { create: itemsData }
    },
    include: { items: true }
  });
  
  // Generate activation codes for KIT/SEED items
  for (const item of order.items) {
    const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
    if (product?.type === 'KIT' || product?.type === 'SEED') {
      await this.prisma.kitActivationCode.create({
        data: {
          code: generateActivationCode(),
          orderItemId: item.id,
          productId: item.productId
        }
      });
    }
  }
  
  // Clear cart after successful order
  await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  
  return order;
}
```

---

## 9. Edge Cases to Handle

### Out of Stock

- **Add to Cart**: Check `Product.isActive` and inventory (if tracked)
- **Checkout**: Re-validate all items before order creation
- **Display**: Show "Currently unavailable" badge in cart

### Quantity Limits

- **Min**: 1 per item
- **Max**: Define per product type (configurable in `Product.metadata`)
- **Validation**: Both frontend and backend

### Price Changes

- **Display**: Show current price at checkout (not price when added)
- **Warning**: If price changed significantly since add, notify user
- **Storage**: Keep `unitPrice` in CartItem for comparison, use current price for order

### Guest Cart → Authenticated Merge

- **On Login**: Check for guest cart (localStorage/sessionId)
- **Merge**: Add guest items to user's server cart
- **Conflict**: If same product exists, sum quantities (or prompt user)
- **Clear**: Remove guest cart after merge

### Concurrent Modifications

- **Optimistic Locking**: Use `updatedAt` check before updates
- **Race Conditions**: Handle edge case where cart cleared during checkout

### Marketplace Listings

- **Separate Cart**: Marketplace listings should have their own cart or direct purchase flow
- **Different Checkout**: P2P listings have seller-specific delivery options

---

## 10. Implementation Phases

### Phase 1: Database & API (Backend)

1. Add `Cart` and `CartItem` models to schema
2. Run Prisma migration
3. Create `CartService` and `CartController`
4. Implement all cart endpoints
5. Modify `OrderService` for `createOrderFromCart`

### Phase 2: Frontend State & Cart Page

1. Create Zustand cart store
2. Create `CartScreen` component
3. Add cart page route
4. Add cart icon to navigation

### Phase 3: Checkout Flow Update

1. Create `CheckoutScreen` for multi-item
2. Modify checkout steps for cart
3. Handle activation codes for multiple items

### Phase 4: Integration & Polish

1. Add "Add to Cart" buttons to product views
2. Toast notifications for cart actions
3. Handle edge cases
4. Testing (unit + integration)

---

## 11. File References

### Current Files Analyzed

| File | Path |
|------|------|
| Prisma Schema | `/apps/api/prisma/schema.prisma` |
| Order Service | `/apps/api/src/order/order.service.ts` |
| Order Controller | `/apps/api/src/order/order.controller.ts` |
| Create Order DTO | `/apps/api/src/dtos/order/create-order.dto.ts` |
| Products Service | `/apps/api/src/products/products.service.ts` |
| Products Controller | `/apps/api/src/products/products.controller.ts` |
| Marketplace Listing DTOs | `/apps/api/src/dtos/marketplace/*.ts` |
| Order API Client | `/apps/web/lib/api/order.api.ts` |
| Shop API Client | `/apps/web/lib/api/shop.api.ts` |
| OrderScreen Component | `/apps/web/components/cityfarm/features/OrderScreen.tsx` |
| MarketplaceCreateScreen | `/apps/web/components/cityfarm/features/MarketplaceCreateScreen.tsx` |
| Client Lib | `/apps/web/lib/client.ts` |

---

## Conclusion

The current CITYFARM-2.0 marketplace supports only single-item orders. Implementing a shopping cart requires:

1. **Database**: New `Cart` and `CartItem` models
2. **Backend**: Cart service with CRUD endpoints, order-from-cart creation
3. **Frontend**: Zustand store, cart page, modified checkout flow, navigation cart icon
4. **Edge Cases**: Price validation, inventory, guest-to-auth merge, quantity limits

A hybrid approach (local storage for guests + server-side for authenticated users) provides the best UX while ensuring data integrity at checkout.