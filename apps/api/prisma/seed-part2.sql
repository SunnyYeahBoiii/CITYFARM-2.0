-- CITYFARM 2.0 Database Seed Script - PART 2
-- Commerce flow: Order -> OrderItem -> KitActivationCode
-- Execution: psql "$DATABASE_URL" -f prisma/seed-part2.sql

BEGIN;

CREATE TEMP TABLE seed_order_item_plan (
  item_idx INTEGER PRIMARY KEY,
  order_idx INTEGER NOT NULL,
  product_idx INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1
) ON COMMIT DROP;

INSERT INTO seed_order_item_plan (item_idx, order_idx, product_idx, quantity) VALUES
(1, 1, 1, 1),
(2, 2, 2, 1),
(3, 3, 3, 1),
(4, 4, 4, 1),
(5, 5, 5, 1),
(6, 6, 6, 1),
(7, 7, 1, 1),
(8, 8, 2, 1),
(9, 9, 3, 1),
(10, 10, 4, 1),
(11, 11, 5, 1),
(12, 12, 6, 1),
(13, 13, 1, 1),
(14, 14, 2, 1),
(15, 15, 3, 1),
(16, 16, 4, 1),
(17, 17, 5, 1),
(18, 17, 2, 1),
(19, 18, 6, 1),
(20, 18, 1, 1),
(21, 19, 3, 1),
(22, 19, 4, 1),
(23, 20, 2, 1),
(24, 20, 5, 1);

WITH order_totals AS (
  SELECT
    p.order_idx,
    SUM(prod."priceAmount" * p.quantity) AS subtotal_amount
  FROM seed_order_item_plan p
  JOIN "Product" prod
    ON prod.id = concat('40000000-0000-0000-0000-', lpad(p.product_idx::TEXT, 12, '0'))
  GROUP BY p.order_idx
),
order_base AS (
  SELECT
    gs AS order_idx,
    concat('10000000-0000-0000-0000-', lpad(gs::TEXT, 12, '0')) AS buyer_id,
    concat('CF-ORD-2026-', lpad(gs::TEXT, 4, '0')) AS order_code,
    CASE
      WHEN gs BETWEEN 1 AND 8 THEN 'COMPLETED'::"OrderStatus"
      WHEN gs BETWEEN 9 AND 12 THEN 'READY_FOR_PICKUP'::"OrderStatus"
      WHEN gs BETWEEN 13 AND 16 THEN 'CONFIRMED'::"OrderStatus"
      WHEN gs BETWEEN 17 AND 18 THEN 'PENDING_CONFIRMATION'::"OrderStatus"
      ELSE 'CANCELLED'::"OrderStatus"
    END AS status,
    CASE
      WHEN gs IN (5, 10, 15, 20) THEN 'CASH_ON_DELIVERY'::"PaymentMethod"
      WHEN gs IN (17, 18) THEN 'UNPAID'::"PaymentMethod"
      ELSE 'CASH_ON_PICKUP'::"PaymentMethod"
    END AS payment_method,
    ot.subtotal_amount,
    CASE
      WHEN gs IN (3, 8, 14, 18) THEN 20000
      WHEN gs IN (17, 20) THEN 15000
      ELSE 0
    END AS discount_amount,
    up.district AS pickup_district,
    concat('Pickup note for ', up.district, ', ', up.ward) AS pickup_address_note,
    CASE
      WHEN gs IN (17, 18) THEN 'Awaiting manual confirmation for bundled order.'
      WHEN gs IN (19, 20) THEN 'Cancelled during early dev phase testing.'
      ELSE 'Seeded mock order for early product validation.'
    END AS customer_note,
    timestamp '2026-01-15 09:00:00' + ((gs - 1) * interval '2 days') AS created_at
  FROM generate_series(1, 20) AS gs
  JOIN order_totals ot
    ON ot.order_idx = gs
  JOIN "UserProfile" up
    ON up."userId" = concat('10000000-0000-0000-0000-', lpad(gs::TEXT, 12, '0'))
),
order_ready AS (
  SELECT
    order_idx,
    buyer_id,
    order_code,
    status,
    payment_method,
    subtotal_amount,
    discount_amount,
    subtotal_amount - discount_amount AS total_amount,
    pickup_district,
    pickup_address_note,
    customer_note,
    created_at,
    CASE
      WHEN status IN ('CONFIRMED', 'READY_FOR_PICKUP', 'COMPLETED') THEN created_at + interval '4 hours'
      ELSE NULL
    END AS confirmed_at,
    CASE
      WHEN status IN ('READY_FOR_PICKUP', 'COMPLETED') THEN created_at + interval '30 hours'
      ELSE NULL
    END AS ready_for_pickup_at,
    CASE
      WHEN status = 'COMPLETED' THEN created_at + interval '54 hours'
      ELSE NULL
    END AS completed_at,
    CASE
      WHEN status = 'CANCELLED' THEN created_at + interval '6 hours'
      ELSE NULL
    END AS cancelled_at
  FROM order_base
)
INSERT INTO "Order" (
  id,
  "orderCode",
  "buyerId",
  status,
  "paymentMethod",
  "subtotalAmount",
  "discountAmount",
  "totalAmount",
  currency,
  "pickupCity",
  "pickupDistrict",
  "pickupAddressNote",
  "customerNote",
  "confirmedAt",
  "readyForPickupAt",
  "completedAt",
  "cancelledAt",
  "createdAt",
  "updatedAt"
)
SELECT
  concat('50000000-0000-0000-0000-', lpad(order_idx::TEXT, 12, '0')),
  order_code,
  buyer_id,
  status,
  payment_method,
  subtotal_amount,
  discount_amount,
  total_amount,
  'VND',
  'Ho Chi Minh City',
  pickup_district,
  pickup_address_note,
  customer_note,
  confirmed_at,
  ready_for_pickup_at,
  completed_at,
  cancelled_at,
  created_at,
  COALESCE(completed_at, cancelled_at, ready_for_pickup_at, confirmed_at, created_at)
FROM order_ready
ORDER BY order_idx;

INSERT INTO "OrderItem" (
  id,
  "orderId",
  "productId",
  quantity,
  "unitPriceAmount",
  "totalPriceAmount",
  metadata,
  "createdAt",
  "updatedAt"
)
SELECT
  concat('51000000-0000-0000-0000-', lpad(p.item_idx::TEXT, 12, '0')),
  concat('50000000-0000-0000-0000-', lpad(p.order_idx::TEXT, 12, '0')),
  concat('40000000-0000-0000-0000-', lpad(p.product_idx::TEXT, 12, '0')),
  p.quantity,
  prod."priceAmount",
  prod."priceAmount" * p.quantity,
  json_build_object(
    'seedOrderIndex', p.order_idx,
    'bundleType', prod.name,
    'phase', 'early-dev'
  ),
  ord."createdAt" + ((p.item_idx % 3) * interval '20 minutes'),
  ord."createdAt" + ((p.item_idx % 3) * interval '20 minutes')
FROM seed_order_item_plan p
JOIN "Product" prod
  ON prod.id = concat('40000000-0000-0000-0000-', lpad(p.product_idx::TEXT, 12, '0'))
JOIN "Order" ord
  ON ord.id = concat('50000000-0000-0000-0000-', lpad(p.order_idx::TEXT, 12, '0'))
ORDER BY p.item_idx;

INSERT INTO "KitActivationCode" (
  id,
  code,
  "orderItemId",
  "productId",
  "expiresAt",
  "redeemedAt",
  "createdAt",
  "updatedAt"
)
SELECT
  concat('52000000-0000-0000-0000-', lpad(p.item_idx::TEXT, 12, '0')),
  concat('CF-ACT-2026-', lpad(p.item_idx::TEXT, 4, '0')),
  concat('51000000-0000-0000-0000-', lpad(p.item_idx::TEXT, 12, '0')),
  concat('40000000-0000-0000-0000-', lpad(p.product_idx::TEXT, 12, '0')),
  CASE
    WHEN p.item_idx >= 21 THEN ord."createdAt" + interval '12 days'
    ELSE ord."createdAt" + interval '45 days'
  END,
  CASE
    WHEN p.item_idx <= 8 THEN ord."createdAt" + interval '3 days'
    ELSE NULL
  END,
  ord."createdAt" + interval '1 hour',
  CASE
    WHEN p.item_idx <= 8 THEN ord."createdAt" + interval '3 days'
    ELSE ord."createdAt" + interval '1 hour'
  END
FROM seed_order_item_plan p
JOIN "Order" ord
  ON ord.id = concat('50000000-0000-0000-0000-', lpad(p.order_idx::TEXT, 12, '0'))
ORDER BY p.item_idx;

COMMIT;
