-- CITYFARM 2.0 Database Seed Script - PART 5
-- Marketplace, feed, reactions and messaging
-- Execution: psql "$DATABASE_URL" -f prisma/seed-part5.sql

BEGIN;

CREATE TEMP TABLE seed_listings (
  list_idx INTEGER PRIMARY KEY,
  plant_idx INTEGER NOT NULL,
  status "ListingStatus" NOT NULL,
  verification_status "VerificationStatus" NOT NULL,
  title TEXT NOT NULL,
  quantity NUMERIC(8, 2) NOT NULL,
  unit TEXT NOT NULL,
  price_amount INTEGER NOT NULL,
  pickup_note TEXT
) ON COMMIT DROP;

INSERT INTO seed_listings VALUES
(1, 1, 'ACTIVE', 'VERIFIED', 'Balcony Cherry Tomatoes - First Flush', 2.50, 'kg', 85000, 'Pickup near Ben Nghe in the evening.'),
(2, 4, 'SOLD', 'VERIFIED', 'Trellis Cucumbers - Same Day Harvest', 3.00, 'kg', 78000, 'Sold to a repeat buyer after morning harvest.'),
(3, 7, 'SOLD', 'VERIFIED', 'Rooftop Tomato Mix - Harvested Batch', 4.50, 'kg', 99000, 'Packed immediately after the rooftop harvest.'),
(4, 9, 'ACTIVE', 'VERIFIED', 'Scan-Grown Basil Bundles', 1.20, 'kg', 52000, 'Fresh basil bundles available after 5pm.'),
(5, 11, 'RESERVED', 'VERIFIED', 'Rosemary Clippings for Weekend Pickup', 0.80, 'kg', 68000, 'Reserved for a neighborhood buyer pending pickup.'),
(6, 17, 'ACTIVE', 'VERIFIED', 'Premium Tomato Bed Harvest', 5.00, 'kg', 120000, 'High-grade tomato batch from the manual premium bed.'),
(7, 22, 'ACTIVE', 'VERIFIED', 'Spring Onion Fast Bundles', 3.50, 'kg', 45000, 'Fast-turn spring onion bundles ready for collection.'),
(8, 21, 'ACTIVE', 'VERIFIED', 'Supplier Demo Parsley Bundles', 2.00, 'kg', 49000, 'Demo parsley bundles for supplier pilot pickups.'),
(9, 2, 'ACTIVE', 'PENDING', 'Balcony Lettuce Mix', 1.80, 'kg', 56000, 'Fresh cut lettuce available this week.'),
(10, 3, 'DRAFT', 'PENDING', 'Basil Pruning Bunches', 1.00, 'kg', 42000, 'Draft listing waiting for a cleaner trim cycle.'),
(11, 5, 'DRAFT', 'NONE', 'Chili Plant Transfer Set', 2.00, 'plant', 150000, 'Live patio chili plants for transfer.'),
(12, 6, 'ACTIVE', 'PENDING', 'Indoor Cilantro Cut Pack', 1.20, 'kg', 40000, 'Indoor-grown cilantro with smaller but fragrant leaves.'),
(13, 8, 'DRAFT', 'NONE', 'Starter Lettuce Tray - Uneven Germination', 1.00, 'tray', 35000, 'Draft because tray quality is still inconsistent.'),
(14, 10, 'DRAFT', 'PENDING', 'Eggplant Preorder Batch', 3.00, 'kg', 105000, 'Preorder batch for a later fruiting window.'),
(15, 12, 'ACTIVE', 'PENDING', 'Kale Shade Harvest', 2.40, 'kg', 62000, 'Shade-grown kale bundles from the north rail.'),
(16, 13, 'ACTIVE', 'PENDING', 'Hydro Dill Bundle', 1.10, 'kg', 47000, 'Hydro dill harvested in small fragrant bunches.'),
(17, 15, 'EXPIRED', 'NONE', 'Arugula Quick Cut Pack', 1.00, 'kg', 43000, 'Expired after the quick-cut window closed.'),
(18, 18, 'DRAFT', 'NONE', 'Peppermint Propagation Pack', 1.00, 'package', 39000, 'Propagation pack is still being cleaned up.'),
(19, 20, 'CANCELLED', 'NONE', 'Mini Broccoli Trial Heads', 2.00, 'kg', 70000, 'Cancelled because head sizing was too uneven.'),
(20, 23, 'RESERVED', 'VERIFIED', 'Expert Thyme Pot Trimmings', 0.60, 'kg', 65000, 'Reserved small-batch thyme for a returning buyer.');

INSERT INTO "MarketplaceListing" (
  id,
  "sellerId",
  "gardenPlantId",
  title,
  description,
  quantity,
  unit,
  "priceAmount",
  currency,
  "pickupCity",
  "pickupDistrict",
  "pickupWard",
  "pickupNote",
  "verificationStatus",
  "verificationSnapshot",
  "documentedDays",
  status,
  "publishedAt",
  "expiresAt",
  "soldAt",
  "imageAssetId",
  "createdAt",
  "updatedAt"
)
SELECT
  concat('80000000-0000-0000-0000-', lpad(sl.list_idx::TEXT, 12, '0')),
  gp."userId",
  gp.id,
  sl.title,
  concat(sl.title, ' sourced from ', ps."commonName", ' with full garden traceability.'),
  sl.quantity,
  sl.unit,
  sl.price_amount,
  'VND',
  'Ho Chi Minh City',
  up.district,
  up.ward,
  sl.pickup_note,
  sl.verification_status,
  CASE
    WHEN sl.verification_status = 'VERIFIED'
      THEN concat('Verified grower: ', up."displayName", ' with documented care timeline.')
    WHEN sl.verification_status = 'PENDING'
      THEN concat('Pending verification review for ', up."displayName", '.')
    ELSE 'No verification snapshot recorded.'
  END,
  CASE
    WHEN sl.verification_status = 'VERIFIED' THEN 45 + sl.list_idx
    WHEN sl.verification_status = 'PENDING' THEN 18 + sl.list_idx
    ELSE 6 + sl.list_idx
  END,
  sl.status,
  CASE
    WHEN sl.status IN ('ACTIVE', 'RESERVED', 'SOLD', 'EXPIRED')
      AND sl.verification_status = 'VERIFIED' THEN gp."plantedAt" + interval '50 days'
    WHEN sl.status IN ('ACTIVE', 'RESERVED', 'SOLD', 'EXPIRED') THEN gp."plantedAt" + interval '31 days'
    ELSE NULL
  END,
  CASE
    WHEN sl.status IN ('ACTIVE', 'RESERVED')
      AND sl.verification_status = 'VERIFIED' THEN gp."plantedAt" + interval '57 days'
    WHEN sl.status IN ('ACTIVE', 'RESERVED') THEN gp."plantedAt" + interval '38 days'
    WHEN sl.status = 'EXPIRED'
      AND sl.verification_status = 'VERIFIED' THEN gp."plantedAt" + interval '56 days'
    WHEN sl.status = 'EXPIRED' THEN gp."plantedAt" + interval '36 days'
    WHEN sl.status = 'SOLD'
      AND sl.verification_status = 'VERIFIED' THEN gp."plantedAt" + interval '55 days'
    WHEN sl.status = 'SOLD' THEN gp."plantedAt" + interval '35 days'
    ELSE NULL
  END,
  CASE
    WHEN sl.status = 'SOLD'
      AND sl.verification_status = 'VERIFIED' THEN gp."plantedAt" + interval '54 days'
    WHEN sl.status = 'SOLD' THEN gp."plantedAt" + interval '34 days'
    ELSE NULL
  END,
  CASE
    WHEN sl.list_idx <= 10 THEN concat(
      '20000000-0000-0000-0000-',
      lpad((24 + (((sl.list_idx - 1) % 2) + 1))::TEXT, 12, '0')
    )
    ELSE NULL
  END,
  CASE
    WHEN sl.verification_status = 'VERIFIED' THEN gp."plantedAt" + interval '49 days'
    ELSE gp."plantedAt" + interval '30 days'
  END,
  COALESCE(
    CASE
      WHEN sl.status = 'SOLD' AND sl.verification_status = 'VERIFIED' THEN gp."plantedAt" + interval '54 days'
      WHEN sl.status = 'SOLD' THEN gp."plantedAt" + interval '34 days'
    END,
    CASE
      WHEN sl.status IN ('ACTIVE', 'RESERVED', 'EXPIRED') AND sl.verification_status = 'VERIFIED' THEN gp."plantedAt" + interval '50 days'
      WHEN sl.status IN ('ACTIVE', 'RESERVED', 'EXPIRED') THEN gp."plantedAt" + interval '31 days'
    END,
    CASE
      WHEN sl.verification_status = 'VERIFIED' THEN gp."plantedAt" + interval '49 days'
      ELSE gp."plantedAt" + interval '30 days'
    END
  )
FROM seed_listings sl
JOIN "GardenPlant" gp
  ON gp.id = concat('70000000-0000-0000-0000-', lpad(sl.plant_idx::TEXT, 12, '0'))
JOIN "UserProfile" up
  ON up."userId" = gp."userId"
JOIN "PlantSpecies" ps
  ON ps.id = gp."plantSpeciesId"
ORDER BY sl.list_idx;

CREATE TEMP TABLE seed_posts (
  post_idx INTEGER PRIMARY KEY,
  user_idx INTEGER NOT NULL,
  plant_idx INTEGER,
  listing_idx INTEGER,
  post_type "PostType" NOT NULL,
  caption TEXT NOT NULL,
  image_asset_idx INTEGER,
  created_at TIMESTAMP NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_posts VALUES
(1, 1, 1, 1, 'MARKETPLACE_SHARE', 'First flush of balcony tomatoes is live for pickup this week.', 26, '2026-03-11 09:00:00'),
(2, 4, 4, 2, 'MARKETPLACE_SHARE', 'Today''s cucumber harvest sold out faster than expected.', 27, '2026-03-15 10:00:00'),
(3, 7, 7, 3, 'HARVEST_UPDATE', 'Rooftop tomato lane finally wrapped a full harvest cycle.', 26, '2026-04-04 08:00:00'),
(4, 9, 9, 4, 'PLANT_SHARE', 'The scan-picked basil spot is outperforming my manual setups.', 27, '2026-03-25 08:30:00'),
(5, 11, 11, 5, 'MARKETPLACE_SHARE', 'Rosemary trimming batch is reserved for the weekend buyer.', NULL, '2026-03-28 09:00:00'),
(6, 17, 17, 6, 'HARVEST_UPDATE', 'Premium tomato bed is carrying the cleanest fruit I''ve had this season.', 26, '2026-03-30 11:00:00'),
(7, 22, 22, 7, 'MARKETPLACE_SHARE', 'Spring onion bundles are ready and moving quickly.', NULL, '2026-03-29 07:30:00'),
(8, 21, 21, 8, 'MARKETPLACE_SHARE', 'Demo parsley bundles are available for local pickup after 6pm.', NULL, '2026-03-26 17:30:00'),
(9, 2, 2, 9, 'PLANT_SHARE', 'Lettuce tray is finally dense enough to start cutting outer leaves.', 27, '2026-03-12 09:30:00'),
(10, 3, 3, 10, 'PLANT_SHARE', 'Basil responds really well to weekly pinching in this window box.', 26, '2026-03-13 08:15:00'),
(11, 5, 5, 11, 'SHOWCASE', 'Still deciding whether to list these chili plants as live transfers.', NULL, '2026-03-15 09:00:00'),
(12, 6, 6, 12, 'PLANT_SHARE', 'Indoor cilantro stays compact, but the flavor is surprisingly strong.', NULL, '2026-03-17 18:00:00'),
(13, 8, 8, 13, 'QUESTION', 'Uneven lettuce germination from a starter kit: heat issue or watering issue?', NULL, '2026-03-24 12:00:00'),
(14, 10, 10, 14, 'QUESTION', 'Anyone running eggplant from scan recommendations on a narrow ledge?', 27, '2026-03-25 10:30:00'),
(15, 12, 12, 15, 'PLANT_SHARE', 'Shade-grown kale is slower, but leaf quality is staying strong.', NULL, '2026-03-25 09:00:00'),
(16, 13, 13, 16, 'HARVEST_UPDATE', 'Hydro dill is ready in smaller bundles than soil-grown batches.', 26, '2026-03-28 08:00:00'),
(17, 15, 15, 17, 'SHOWCASE', 'Arugula quick run finished fast and tasted better than expected.', NULL, '2026-04-02 11:00:00'),
(18, 18, 18, 18, 'PLANT_SHARE', 'Peppermint cuttings are vigorous, but I need a better pruning rhythm.', NULL, '2026-03-27 15:00:00'),
(19, 20, 20, 19, 'QUESTION', 'Mini broccoli in containers: worth retrying after inconsistent heads?', NULL, '2026-04-06 13:00:00'),
(20, 23, 23, 20, 'SHOWCASE', 'This thyme pot has become my favorite reference plant for demos.', 27, '2026-03-20 09:30:00'),
(21, 14, 14, NULL, 'QUESTION', 'My scan-led pepper retry failed early. What would you change first?', NULL, '2026-03-18 14:00:00'),
(22, 16, 16, NULL, 'HARVEST_UPDATE', 'Archived oregano cycle, dried the whole batch and labeled it for pantry use.', 26, '2026-03-29 10:00:00'),
(23, 19, 19, NULL, 'QUESTION', 'Planning bok choy for the next slot. Direct seed or transplant in April?', NULL, '2026-04-01 08:00:00'),
(24, 24, 24, NULL, 'SHOWCASE', 'Office chives still survive every ops sprint, so I''m calling that a win.', NULL, '2026-03-21 16:00:00');

INSERT INTO "FeedPost" (
  id,
  "userId",
  "gardenPlantId",
  "listingId",
  "postType",
  caption,
  "contentJson",
  "imageAssetId",
  "visibilityDistrict",
  "isPublished",
  "publishedAt",
  "createdAt",
  "updatedAt"
)
SELECT
  concat('81000000-0000-0000-0000-', lpad(sp.post_idx::TEXT, 12, '0')),
  concat('10000000-0000-0000-0000-', lpad(sp.user_idx::TEXT, 12, '0')),
  CASE
    WHEN sp.plant_idx IS NULL THEN NULL
    ELSE concat('70000000-0000-0000-0000-', lpad(sp.plant_idx::TEXT, 12, '0'))
  END,
  CASE
    WHEN sp.listing_idx IS NULL THEN NULL
    ELSE concat('80000000-0000-0000-0000-', lpad(sp.listing_idx::TEXT, 12, '0'))
  END,
  sp.post_type,
  sp.caption,
  json_build_object(
    'postIndex', sp.post_idx,
    'hasListing', sp.listing_idx IS NOT NULL,
    'hasPlant', sp.plant_idx IS NOT NULL
  ),
  CASE
    WHEN sp.image_asset_idx IS NULL THEN NULL
    ELSE concat('20000000-0000-0000-0000-', lpad(sp.image_asset_idx::TEXT, 12, '0'))
  END,
  up.district,
  TRUE,
  sp.created_at + interval '20 minutes',
  sp.created_at,
  sp.created_at + interval '20 minutes'
FROM seed_posts sp
JOIN "UserProfile" up
  ON up."userId" = concat('10000000-0000-0000-0000-', lpad(sp.user_idx::TEXT, 12, '0'))
ORDER BY sp.post_idx;

INSERT INTO "FeedComment" (
  id,
  "postId",
  "userId",
  "parentCommentId",
  body,
  "createdAt",
  "updatedAt"
)
SELECT
  concat('82000000-0000-0000-0000-', lpad(gs::TEXT, 12, '0')),
  concat('81000000-0000-0000-0000-', lpad(gs::TEXT, 12, '0')),
  concat('10000000-0000-0000-0000-', lpad((((gs + 5) % 24) + 1)::TEXT, 12, '0')),
  NULL,
  concat('Following this update closely. The timeline on post ', gs, ' is very helpful.'),
  fp."publishedAt" + interval '45 minutes',
  fp."publishedAt" + interval '45 minutes'
FROM generate_series(1, 24) AS gs
JOIN "FeedPost" fp
  ON fp.id = concat('81000000-0000-0000-0000-', lpad(gs::TEXT, 12, '0'))

UNION ALL

SELECT
  concat('82000000-0000-0000-0000-', lpad((24 + gs)::TEXT, 12, '0')),
  concat('81000000-0000-0000-0000-', lpad(gs::TEXT, 12, '0')),
  concat('10000000-0000-0000-0000-', lpad((((gs + 11) % 24) + 1)::TEXT, 12, '0')),
  concat('82000000-0000-0000-0000-', lpad(gs::TEXT, 12, '0')),
  concat('Replying with a similar experience on post ', gs, '.'),
  fp."publishedAt" + interval '90 minutes',
  fp."publishedAt" + interval '90 minutes'
FROM generate_series(1, 6) AS gs
JOIN "FeedPost" fp
  ON fp.id = concat('81000000-0000-0000-0000-', lpad(gs::TEXT, 12, '0'))
ORDER BY 1;

INSERT INTO "PostReaction" (
  id,
  "postId",
  "userId",
  "reactionType",
  "createdAt"
)
SELECT
  concat('83000000-0000-0000-0000-', lpad(gs::TEXT, 12, '0')),
  concat('81000000-0000-0000-0000-', lpad(gs::TEXT, 12, '0')),
  concat('10000000-0000-0000-0000-', lpad((((gs + 9) % 24) + 1)::TEXT, 12, '0')),
  (ARRAY['LIKE', 'SUPPORT', 'THANKS'])[1 + ((gs - 1) % 3)]::"ReactionType",
  fp."publishedAt" + interval '2 hours'
FROM generate_series(1, 24) AS gs
JOIN "FeedPost" fp
  ON fp.id = concat('81000000-0000-0000-0000-', lpad(gs::TEXT, 12, '0'))

UNION ALL

SELECT
  concat('83000000-0000-0000-0000-', lpad((24 + gs)::TEXT, 12, '0')),
  concat('81000000-0000-0000-0000-', lpad(gs::TEXT, 12, '0')),
  concat('10000000-0000-0000-0000-', lpad((((gs + 15) % 24) + 1)::TEXT, 12, '0')),
  (ARRAY['SUPPORT', 'LIKE', 'THANKS'])[1 + ((gs - 1) % 3)]::"ReactionType",
  fp."publishedAt" + interval '3 hours'
FROM generate_series(1, 6) AS gs
JOIN "FeedPost" fp
  ON fp.id = concat('81000000-0000-0000-0000-', lpad(gs::TEXT, 12, '0'))
ORDER BY 1;

CREATE TEMP TABLE seed_conversations (
  conv_idx INTEGER PRIMARY KEY,
  type "ConversationType" NOT NULL,
  listing_idx INTEGER,
  topic TEXT
) ON COMMIT DROP;

INSERT INTO seed_conversations VALUES
(1, 'MARKETPLACE', 1, 'tomato pickup'),
(2, 'MARKETPLACE', 2, 'cucumber sale'),
(3, 'MARKETPLACE', 3, 'rooftop tomato batch'),
(4, 'MARKETPLACE', 4, 'basil pickup'),
(5, 'MARKETPLACE', 5, 'rosemary reserve'),
(6, 'MARKETPLACE', 6, 'premium tomatoes'),
(7, 'MARKETPLACE', 7, 'spring onion bundles'),
(8, 'MARKETPLACE', 8, 'parsley pickup'),
(9, 'MARKETPLACE', 9, 'lettuce mix'),
(10, 'MARKETPLACE', 12, 'cilantro bundle'),
(11, 'AI_ASSISTANT', NULL, 'uneven germination'),
(12, 'AI_ASSISTANT', NULL, 'scan recommendation review'),
(13, 'AI_ASSISTANT', NULL, 'pepper stress diagnosis'),
(14, 'AI_ASSISTANT', NULL, 'harvest scheduling'),
(15, 'AI_ASSISTANT', NULL, 'marketplace pricing'),
(16, 'AI_ASSISTANT', NULL, 'dill hydro nutrients'),
(17, 'AI_ASSISTANT', NULL, 'mint pruning'),
(18, 'AI_ASSISTANT', NULL, 'bok choy planning'),
(19, 'COMMUNITY', NULL, 'seed exchange planning'),
(20, 'SUPPORT', NULL, 'dev environment support');

INSERT INTO "Conversation" (
  id,
  type,
  "listingId",
  "assistantContext",
  "createdAt",
  "updatedAt"
)
SELECT
  concat('90000000-0000-0000-0000-', lpad(sc.conv_idx::TEXT, 12, '0')),
  sc.type,
  CASE
    WHEN sc.listing_idx IS NULL THEN NULL
    ELSE concat('80000000-0000-0000-0000-', lpad(sc.listing_idx::TEXT, 12, '0'))
  END,
  CASE
    WHEN sc.type = 'AI_ASSISTANT' THEN json_build_object('topic', sc.topic, 'mode', 'advice')
    WHEN sc.type = 'SUPPORT' THEN json_build_object('topic', sc.topic, 'mode', 'ops')
    ELSE NULL
  END,
  timestamp '2026-03-20 08:00:00' + ((sc.conv_idx - 1) * interval '6 hours'),
  timestamp '2026-03-20 08:00:00' + ((sc.conv_idx - 1) * interval '6 hours')
FROM seed_conversations sc
ORDER BY sc.conv_idx;

CREATE TEMP TABLE seed_market_buyers (
  conv_idx INTEGER PRIMARY KEY,
  buyer_idx INTEGER NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_market_buyers VALUES
(1, 13),
(2, 14),
(3, 15),
(4, 16),
(5, 17),
(6, 18),
(7, 19),
(8, 20),
(9, 1),
(10, 4);

INSERT INTO "ConversationParticipant" (
  id,
  "conversationId",
  "userId",
  "joinedAt",
  "lastReadAt"
)
SELECT
  concat('91000000-0000-0000-0000-', lpad(row_number() OVER (ORDER BY sc.conv_idx, role_order)::TEXT, 12, '0')),
  concat('90000000-0000-0000-0000-', lpad(sc.conv_idx::TEXT, 12, '0')),
  participant_user_id,
  conv."createdAt",
  conv."createdAt" + interval '3 hours'
FROM (
  SELECT
    sc.conv_idx,
    1 AS role_order,
    ml."sellerId" AS participant_user_id
  FROM seed_conversations sc
  JOIN "MarketplaceListing" ml
    ON ml.id = concat('80000000-0000-0000-0000-', lpad(sc.listing_idx::TEXT, 12, '0'))
  WHERE sc.type = 'MARKETPLACE'

  UNION ALL

  SELECT
    smb.conv_idx,
    2 AS role_order,
    concat('10000000-0000-0000-0000-', lpad(smb.buyer_idx::TEXT, 12, '0')) AS participant_user_id
  FROM seed_market_buyers smb

  UNION ALL

  SELECT
    conv_idx,
    1,
    concat('10000000-0000-0000-0000-', lpad((ARRAY[1, 3, 5, 7, 9, 11, 13, 15])[conv_idx - 10]::TEXT, 12, '0'))
  FROM seed_conversations
  WHERE conv_idx BETWEEN 11 AND 18

  UNION ALL

  SELECT 19, 1, concat('10000000-0000-0000-0000-', lpad(12::TEXT, 12, '0'))

  UNION ALL

  SELECT 20, 1, concat('10000000-0000-0000-0000-', lpad(6::TEXT, 12, '0'))
) participant_seed
JOIN seed_conversations sc
  ON sc.conv_idx = participant_seed.conv_idx
JOIN "Conversation" conv
  ON conv.id = concat('90000000-0000-0000-0000-', lpad(sc.conv_idx::TEXT, 12, '0'))
ORDER BY sc.conv_idx, role_order;

INSERT INTO "Message" (
  id,
  "conversationId",
  "senderUserId",
  "senderType",
  "messageType",
  body,
  "mediaAssetId",
  metadata,
  "createdAt",
  "updatedAt"
)
SELECT
  concat('92000000-0000-0000-0000-', lpad(row_number() OVER (ORDER BY message_order, conversation_id, created_at)::TEXT, 12, '0')),
  conversation_id,
  sender_user_id,
  sender_type,
  'TEXT'::"MessageType",
  body,
  NULL,
  metadata,
  created_at,
  created_at
FROM (
  SELECT
    1 AS message_order,
    conv.id AS conversation_id,
    concat('10000000-0000-0000-0000-', lpad(smb.buyer_idx::TEXT, 12, '0')) AS sender_user_id,
    'USER'::"MessageSenderType" AS sender_type,
    concat('Is the listing "', ml.title, '" still available for pickup this week?') AS body,
    json_build_object('channel', 'marketplace', 'listingId', ml.id) AS metadata,
    conv."createdAt" + interval '10 minutes' AS created_at
  FROM seed_market_buyers smb
  JOIN "Conversation" conv
    ON conv.id = concat('90000000-0000-0000-0000-', lpad(smb.conv_idx::TEXT, 12, '0'))
  JOIN "MarketplaceListing" ml
    ON ml.id = conv."listingId"

  UNION ALL

  SELECT
    2,
    conv.id,
    ml."sellerId",
    'USER'::"MessageSenderType",
    concat('Yes, "', ml.title, '" is still available. I can hold it until this evening.'),
    json_build_object('channel', 'marketplace', 'listingId', ml.id, 'role', 'seller'),
    conv."createdAt" + interval '28 minutes'
  FROM seed_market_buyers smb
  JOIN "Conversation" conv
    ON conv.id = concat('90000000-0000-0000-0000-', lpad(smb.conv_idx::TEXT, 12, '0'))
  JOIN "MarketplaceListing" ml
    ON ml.id = conv."listingId"

  UNION ALL

  SELECT
    3,
    conv.id,
    concat('10000000-0000-0000-0000-', lpad((ARRAY[1, 3, 5, 7, 9])[conv_idx - 10]::TEXT, 12, '0')),
    'USER'::"MessageSenderType",
    concat('Need help with ', sc.topic, '. What should I check first?'),
    json_build_object('channel', 'assistant', 'topic', sc.topic),
    conv."createdAt" + interval '5 minutes'
  FROM seed_conversations sc
  JOIN "Conversation" conv
    ON conv.id = concat('90000000-0000-0000-0000-', lpad(sc.conv_idx::TEXT, 12, '0'))
  WHERE sc.conv_idx BETWEEN 11 AND 15

  UNION ALL

  SELECT
    4,
    conv.id,
    NULL,
    'ASSISTANT'::"MessageSenderType",
    concat('Start by reviewing the last care action, recent weather, and the latest plant photo for ', sc.topic, '.'),
    json_build_object('channel', 'assistant', 'topic', sc.topic, 'confidence', 0.87),
    conv."createdAt" + interval '12 minutes'
  FROM seed_conversations sc
  JOIN "Conversation" conv
    ON conv.id = concat('90000000-0000-0000-0000-', lpad(sc.conv_idx::TEXT, 12, '0'))
  WHERE sc.conv_idx BETWEEN 11 AND 15
) message_seed
ORDER BY message_order, conversation_id, created_at;

COMMIT;
