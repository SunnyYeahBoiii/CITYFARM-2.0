-- CITYFARM 2.0 Seed Verification
-- Execution: psql "$DATABASE_URL" -f prisma/seed-verify.sql

\echo '======================================================================'
\echo 'CITYFARM 2.0 SEED VERIFICATION REPORT'
\echo '======================================================================'

\echo ''
\echo '--- EXPECTED ROW COUNTS ---'
WITH expected AS (
  SELECT * FROM (VALUES
    ('User', 24),
    ('UserProfile', 24),
    ('MediaAsset', 30),
    ('PlantSpecies', 24),
    ('PlantCareProfile', 24),
    ('Product', 24),
    ('ProductComponent', 24),
    ('Order', 20),
    ('OrderItem', 24),
    ('KitActivationCode', 24),
    ('SpaceScan', 24),
    ('ScanRecommendation', 30),
    ('ScanVisualization', 20),
    ('GardenPlant', 24),
    ('CareSchedule', 24),
    ('CareTask', 30),
    ('PlantJournalEntry', 30),
    ('MarketplaceListing', 20),
    ('FeedPost', 24),
    ('FeedComment', 30),
    ('PostReaction', 30),
    ('Conversation', 20),
    ('ConversationParticipant', 30),
    ('Message', 30)
  ) AS t(table_name, expected_count)
),
actual AS (
  SELECT 'User' AS table_name, COUNT(*) AS actual_count FROM "User"
  UNION ALL SELECT 'UserProfile', COUNT(*) FROM "UserProfile"
  UNION ALL SELECT 'MediaAsset', COUNT(*) FROM "MediaAsset"
  UNION ALL SELECT 'PlantSpecies', COUNT(*) FROM "PlantSpecies"
  UNION ALL SELECT 'PlantCareProfile', COUNT(*) FROM "PlantCareProfile"
  UNION ALL SELECT 'Product', COUNT(*) FROM "Product"
  UNION ALL SELECT 'ProductComponent', COUNT(*) FROM "ProductComponent"
  UNION ALL SELECT 'Order', COUNT(*) FROM "Order"
  UNION ALL SELECT 'OrderItem', COUNT(*) FROM "OrderItem"
  UNION ALL SELECT 'KitActivationCode', COUNT(*) FROM "KitActivationCode"
  UNION ALL SELECT 'SpaceScan', COUNT(*) FROM "SpaceScan"
  UNION ALL SELECT 'ScanRecommendation', COUNT(*) FROM "ScanRecommendation"
  UNION ALL SELECT 'ScanVisualization', COUNT(*) FROM "ScanVisualization"
  UNION ALL SELECT 'GardenPlant', COUNT(*) FROM "GardenPlant"
  UNION ALL SELECT 'CareSchedule', COUNT(*) FROM "CareSchedule"
  UNION ALL SELECT 'CareTask', COUNT(*) FROM "CareTask"
  UNION ALL SELECT 'PlantJournalEntry', COUNT(*) FROM "PlantJournalEntry"
  UNION ALL SELECT 'MarketplaceListing', COUNT(*) FROM "MarketplaceListing"
  UNION ALL SELECT 'FeedPost', COUNT(*) FROM "FeedPost"
  UNION ALL SELECT 'FeedComment', COUNT(*) FROM "FeedComment"
  UNION ALL SELECT 'PostReaction', COUNT(*) FROM "PostReaction"
  UNION ALL SELECT 'Conversation', COUNT(*) FROM "Conversation"
  UNION ALL SELECT 'ConversationParticipant', COUNT(*) FROM "ConversationParticipant"
  UNION ALL SELECT 'Message', COUNT(*) FROM "Message"
)
SELECT
  e.table_name,
  e.expected_count,
  a.actual_count,
  (e.expected_count = a.actual_count) AS matches
FROM expected e
JOIN actual a USING (table_name)
ORDER BY e.table_name;

\echo ''
\echo '--- CORE INTEGRITY CHECKS ---'
SELECT 'garden plants with missing user' AS check_name, COUNT(*) AS issues
FROM "GardenPlant" gp
LEFT JOIN "User" u ON u.id = gp."userId"
WHERE u.id IS NULL
UNION ALL
SELECT 'garden plants with missing species', COUNT(*)
FROM "GardenPlant" gp
LEFT JOIN "PlantSpecies" ps ON ps.id = gp."plantSpeciesId"
WHERE ps.id IS NULL
UNION ALL
SELECT 'listings with seller different from plant owner', COUNT(*)
FROM "MarketplaceListing" ml
JOIN "GardenPlant" gp ON gp.id = ml."gardenPlantId"
WHERE ml."sellerId" <> gp."userId"
UNION ALL
SELECT 'redeemed codes without garden plant', COUNT(*)
FROM "KitActivationCode" kac
LEFT JOIN "GardenPlant" gp ON gp."activationCodeId" = kac.id
WHERE kac."redeemedAt" IS NOT NULL AND gp.id IS NULL
UNION ALL
SELECT 'recommendation duplicate rank conflicts', COUNT(*)
FROM (
  SELECT "scanId", rank
  FROM "ScanRecommendation"
  GROUP BY "scanId", rank
  HAVING COUNT(*) > 1
) dup
UNION ALL
SELECT 'reaction duplicate user-post pairs', COUNT(*)
FROM (
  SELECT "postId", "userId"
  FROM "PostReaction"
  GROUP BY "postId", "userId"
  HAVING COUNT(*) > 1
) dup
UNION ALL
SELECT 'participant duplicate conversation-user pairs', COUNT(*)
FROM (
  SELECT "conversationId", "userId"
  FROM "ConversationParticipant"
  GROUP BY "conversationId", "userId"
  HAVING COUNT(*) > 1
) dup;

\echo ''
\echo '--- FLOW COUNTS ---'
SELECT
  (SELECT COUNT(*) FROM "KitActivationCode" WHERE "redeemedAt" IS NOT NULL) AS redeemed_codes,
  (SELECT COUNT(*) FROM "GardenPlant" WHERE "activationCodeId" IS NOT NULL) AS kit_plants,
  (SELECT COUNT(*) FROM "GardenPlant" WHERE "sourceScanId" IS NOT NULL) AS scan_plants,
  (SELECT COUNT(*) FROM "GardenPlant" WHERE "activationCodeId" IS NULL AND "sourceScanId" IS NULL) AS manual_plants,
  (SELECT COUNT(*) FROM "MarketplaceListing" WHERE "verificationStatus" = 'VERIFIED') AS verified_listings,
  (SELECT COUNT(*) FROM "Conversation" WHERE type = 'MARKETPLACE') AS marketplace_conversations,
  (SELECT COUNT(*) FROM "Conversation" WHERE type = 'AI_ASSISTANT') AS ai_conversations;

\echo ''
\echo '--- STATUS DISTRIBUTIONS ---'
SELECT 'order_status' AS category, status::TEXT AS value, COUNT(*) AS total
FROM "Order"
GROUP BY status
UNION ALL
SELECT 'scan_status', status::TEXT, COUNT(*)
FROM "SpaceScan"
GROUP BY status
UNION ALL
SELECT 'garden_plant_status', status::TEXT, COUNT(*)
FROM "GardenPlant"
GROUP BY status
UNION ALL
SELECT 'listing_status', status::TEXT, COUNT(*)
FROM "MarketplaceListing"
GROUP BY status
UNION ALL
SELECT 'care_task_status', status::TEXT, COUNT(*)
FROM "CareTask"
GROUP BY status
UNION ALL
SELECT 'conversation_type', type::TEXT, COUNT(*)
FROM "Conversation"
GROUP BY type
ORDER BY category, value;

\echo ''
\echo '--- TEMPORAL CONSISTENCY CHECKS ---'
SELECT 'orders with broken lifecycle timestamps' AS check_name, COUNT(*) AS issues
FROM "Order"
WHERE ("confirmedAt" IS NOT NULL AND "confirmedAt" < "createdAt")
   OR ("readyForPickupAt" IS NOT NULL AND "confirmedAt" IS NOT NULL AND "readyForPickupAt" < "confirmedAt")
   OR ("completedAt" IS NOT NULL AND "readyForPickupAt" IS NOT NULL AND "completedAt" < "readyForPickupAt")
   OR ("cancelledAt" IS NOT NULL AND "cancelledAt" < "createdAt")
UNION ALL
SELECT 'journal entries before planting', COUNT(*)
FROM "PlantJournalEntry" pje
JOIN "GardenPlant" gp ON gp.id = pje."gardenPlantId"
WHERE pje."capturedAt" < gp."plantedAt"
UNION ALL
SELECT 'tasks before planting', COUNT(*)
FROM "CareTask" ct
JOIN "GardenPlant" gp ON gp.id = ct."gardenPlantId"
WHERE ct."dueAt" < gp."plantedAt"
UNION ALL
SELECT 'published listings without publish date', COUNT(*)
FROM "MarketplaceListing"
WHERE status IN ('ACTIVE', 'RESERVED', 'SOLD', 'EXPIRED') AND "publishedAt" IS NULL;

\echo ''
\echo '--- MARKETPLACE SNAPSHOT ---'
SELECT
  MIN("priceAmount") AS min_price_vnd,
  MAX("priceAmount") AS max_price_vnd,
  ROUND(AVG("priceAmount"))::INTEGER AS avg_price_vnd,
  COUNT(*) FILTER (WHERE "verificationStatus" = 'VERIFIED') AS verified_count,
  COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_count
FROM "MarketplaceListing";

\echo ''
\echo '--- USER ACTIVITY SNAPSHOT ---'
SELECT
  up."displayName",
  up."growerVerificationStatus",
  up."totalHarvests",
  up."totalCareLogs",
  COUNT(DISTINCT fp.id) AS posts,
  COUNT(DISTINCT fc.id) AS comments
FROM "UserProfile" up
LEFT JOIN "FeedPost" fp ON fp."userId" = up."userId"
LEFT JOIN "FeedComment" fc ON fc."userId" = up."userId"
GROUP BY up.id
ORDER BY up."totalCareLogs" DESC, posts DESC
LIMIT 10;

\echo ''
\echo 'Verification complete.'
