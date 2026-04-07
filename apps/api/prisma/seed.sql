-- CITYFARM 2.0 Database Seed Script - PART 1
-- Source of truth: prisma/schema.prisma
-- Execution: psql "$DATABASE_URL" -f prisma/seed.sql
-- Safe for development only.

BEGIN;

TRUNCATE TABLE "Message" CASCADE;
TRUNCATE TABLE "ConversationParticipant" CASCADE;
TRUNCATE TABLE "Conversation" CASCADE;
TRUNCATE TABLE "PostReaction" CASCADE;
TRUNCATE TABLE "FeedComment" CASCADE;
TRUNCATE TABLE "FeedPost" CASCADE;
TRUNCATE TABLE "MarketplaceListing" CASCADE;
TRUNCATE TABLE "PlantJournalEntry" CASCADE;
TRUNCATE TABLE "CareTask" CASCADE;
TRUNCATE TABLE "CareSchedule" CASCADE;
TRUNCATE TABLE "GardenPlant" CASCADE;
TRUNCATE TABLE "ScanVisualization" CASCADE;
TRUNCATE TABLE "ScanRecommendation" CASCADE;
TRUNCATE TABLE "SpaceScan" CASCADE;
TRUNCATE TABLE "KitActivationCode" CASCADE;
TRUNCATE TABLE "OrderItem" CASCADE;
TRUNCATE TABLE "Order" CASCADE;
TRUNCATE TABLE "ProductComponent" CASCADE;
TRUNCATE TABLE "Product" CASCADE;
TRUNCATE TABLE "PlantCareProfile" CASCADE;
TRUNCATE TABLE "PlantSpecies" CASCADE;
TRUNCATE TABLE "UserProfile" CASCADE;
TRUNCATE TABLE "MediaAsset" CASCADE;
TRUNCATE TABLE "User" CASCADE;

CREATE TEMP TABLE seed_users (
  idx INTEGER PRIMARY KEY,
  display_name TEXT NOT NULL,
  district TEXT NOT NULL,
  ward TEXT NOT NULL,
  role "UserRole" NOT NULL,
  bio TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_users (idx, display_name, district, ward, role, bio) VALUES
(1, 'Lam Nguyen', 'District 1', 'Ben Nghe', 'USER', 'Runs a compact balcony garden focused on tomatoes and herbs.'),
(2, 'An Tran', 'District 3', 'Ward 6', 'USER', 'Tests leafy green rotations for apartment-friendly growing.'),
(3, 'Minh Pham', 'District 5', 'Ward 11', 'USER', 'Grows culinary herbs and shares small-batch harvest tips.'),
(4, 'Thao Le', 'District 7', 'Tan Phu', 'USER', 'Builds trellis systems for cucumbers and beans on a sunny terrace.'),
(5, 'Bao Hoang', 'Thu Duc City', 'Linh Trung', 'USER', 'Experiments with peppers and soil moisture tracking.'),
(6, 'Vy Do', 'District 12', 'Thanh Xuan', 'USER', 'Documents indoor and semi-shaded container setups.'),
(7, 'Khanh Bui', 'Binh Thanh', 'Ward 22', 'USER', 'Keeps a high-output rooftop tomato lane for family meals.'),
(8, 'Quynh Vo', 'Tan Binh', 'Ward 2', 'USER', 'Combines kits and manual propagation in a narrow side yard.'),
(9, 'Hieu Dang', 'Go Vap', 'Ward 10', 'USER', 'Uses scan recommendations before committing to new crops.'),
(10, 'Nhi Phan', 'Phu Nhuan', 'Ward 8', 'USER', 'Maintains salad greens and bok choy in rail planters.'),
(11, 'Tuan Mai', 'District 10', 'Ward 12', 'USER', 'Runs quick basil and cilantro cycles for weekly cooking.'),
(12, 'Linh Vu', 'District 11', 'Ward 5', 'USER', 'Focuses on shade-tolerant greens and careful care logging.'),
(13, 'Dat Truong', 'Tan Phu', 'Phu Thanh', 'USER', 'Prefers hydroponic scallions and nutrient tracking.'),
(14, 'Nga Nguyen', 'Binh Tan', 'Binh Tri Dong', 'USER', 'Trying kale and dill in a small morning-sun courtyard.'),
(15, 'Son Duong', 'District 4', 'Ward 13', 'USER', 'Keeps rosemary and thyme trimmed for frequent harvest.'),
(16, 'My Ta', 'District 8', 'Ward 7', 'USER', 'Tests mixed light beds with spinach and lettuce.'),
(17, 'Hai Pham', 'District 2', 'An Khanh', 'USER', 'Grows premium tomatoes with a strict care checklist.'),
(18, 'Chau Le', 'District 6', 'Ward 9', 'USER', 'Tracks peppermint and chili propagation with photo journals.'),
(19, 'Nhat Nguyen', 'District 1', 'Da Kao', 'USER', 'Planning a first season and mostly observing the community.'),
(20, 'Uyen Tran', 'District 7', 'Tan Quy', 'USER', 'Uses CITYFARM for support and seasonal planning.'),
(21, 'CityFarm Supply Hub', 'Thu Duc City', 'Hiep Binh Chanh', 'SUPPLIER', 'Supplies starter kits, media pots and add-ons for pilots.'),
(22, 'Urban Soil Studio', 'Binh Thanh', 'Ward 25', 'SUPPLIER', 'Provides potting mix, coco coir and nutrient blends.'),
(23, 'Dr. Hanh Pham', 'District 3', 'Ward 7', 'EXPERT', 'Supports pest diagnosis and balcony growing best practices.'),
(24, 'Admin CityFarm', 'District 1', 'Ben Thanh', 'ADMIN', 'Operates the development environment and moderation tools.');

INSERT INTO "User" (
  id,
  email,
  "passwordHash",
  "externalAuthId",
  role,
  "createdAt",
  "updatedAt"
)
SELECT
  concat('10000000-0000-0000-0000-', lpad(idx::TEXT, 12, '0')),
  concat(lower(replace(display_name, ' ', '.')), '@cityfarm.local'),
  concat('dev-hash-', lpad(idx::TEXT, 2, '0')),
  CASE WHEN idx <= 6 THEN concat('auth0|cityfarm-', lpad(idx::TEXT, 4, '0')) END,
  role,
  timestamp '2026-01-01 08:00:00' + ((idx - 1) * interval '1 day'),
  timestamp '2026-01-01 08:00:00' + ((idx - 1) * interval '1 day')
FROM seed_users
ORDER BY idx;

WITH media_seed AS (
  SELECT
    i AS idx,
    i AS owner_idx,
    'PROFILE_AVATAR'::"MediaKind" AS kind,
    concat('avatars/user-', lpad(i::TEXT, 2, '0'), '.jpg') AS storage_key,
    concat('https://cdn.cityfarm.local/avatars/user-', lpad(i::TEXT, 2, '0'), '.jpg') AS public_url,
    320 AS width,
    320 AS height,
    concat('Avatar for user ', i) AS alt_text
  FROM generate_series(1, 10) AS gs(i)

  UNION ALL

  SELECT
    10 + i,
    ((i - 1) % 5) + 1,
    'SPACE_SCAN'::"MediaKind",
    concat('scans/space-', lpad(i::TEXT, 2, '0'), '.jpg'),
    concat('https://cdn.cityfarm.local/scans/space-', lpad(i::TEXT, 2, '0'), '.jpg'),
    1280,
    960,
    concat('Space scan image ', i)
  FROM generate_series(1, 5) AS gs(i)

  UNION ALL

  SELECT
    15 + i,
    ((i - 1) % 4) + 1,
    'VISUALIZATION'::"MediaKind",
    concat('visualizations/output-', lpad(i::TEXT, 2, '0'), '.png'),
    concat('https://cdn.cityfarm.local/visualizations/output-', lpad(i::TEXT, 2, '0'), '.png'),
    1440,
    1080,
    concat('Visualization output ', i)
  FROM generate_series(1, 4) AS gs(i)

  UNION ALL

  SELECT
    19 + i,
    ((i - 1) % 6) + 1,
    'GARDEN_JOURNAL'::"MediaKind",
    concat('journals/entry-', lpad(i::TEXT, 2, '0'), '.jpg'),
    concat('https://cdn.cityfarm.local/journals/entry-', lpad(i::TEXT, 2, '0'), '.jpg'),
    1080,
    1080,
    concat('Garden journal image ', i)
  FROM generate_series(1, 4) AS gs(i)

  UNION ALL

  SELECT
    23 + i,
    ((i - 1) % 4) + 1,
    'MARKETPLACE'::"MediaKind",
    concat('market/listing-', lpad(i::TEXT, 2, '0'), '.jpg'),
    concat('https://cdn.cityfarm.local/market/listing-', lpad(i::TEXT, 2, '0'), '.jpg'),
    1200,
    900,
    concat('Marketplace listing image ', i)
  FROM generate_series(1, 2) AS gs(i)

  UNION ALL

  SELECT
    25 + i,
    ((i - 1) % 6) + 3,
    'POST_IMAGE'::"MediaKind",
    concat('posts/post-', lpad(i::TEXT, 2, '0'), '.jpg'),
    concat('https://cdn.cityfarm.local/posts/post-', lpad(i::TEXT, 2, '0'), '.jpg'),
    1200,
    1200,
    concat('Feed post image ', i)
  FROM generate_series(1, 2) AS gs(i)

  UNION ALL

  SELECT
    27 + i,
    NULL::INTEGER,
    'PRODUCT_IMAGE'::"MediaKind",
    concat('products/product-', lpad(i::TEXT, 2, '0'), '.jpg'),
    concat('https://cdn.cityfarm.local/products/product-', lpad(i::TEXT, 2, '0'), '.jpg'),
    1200,
    1200,
    concat('Product cover image ', i)
  FROM generate_series(1, 2) AS gs(i)

  UNION ALL

  SELECT
    30,
    5,
    'MESSAGE_ATTACHMENT'::"MediaKind",
    'messages/diagnosis-board.jpg',
    'https://cdn.cityfarm.local/messages/diagnosis-board.jpg',
    1280,
    720,
    'Shared diagnosis board'
)
INSERT INTO "MediaAsset" (
  id,
  "ownerId",
  kind,
  "storageKey",
  "publicUrl",
  "mimeType",
  width,
  height,
  "altText",
  metadata,
  "createdAt",
  "updatedAt"
)
SELECT
  concat('20000000-0000-0000-0000-', lpad(idx::TEXT, 12, '0')),
  CASE
    WHEN owner_idx IS NULL THEN NULL
    ELSE concat('10000000-0000-0000-0000-', lpad(owner_idx::TEXT, 12, '0'))
  END,
  kind,
  storage_key,
  public_url,
  CASE
    WHEN kind IN ('VISUALIZATION', 'PRODUCT_IMAGE') THEN 'image/png'
    ELSE 'image/jpeg'
  END,
  width,
  height,
  alt_text,
  json_build_object('seedIndex', idx, 'kind', kind::TEXT),
  timestamp '2026-01-05 09:00:00' + ((idx - 1) * interval '2 hours'),
  timestamp '2026-01-05 09:00:00' + ((idx - 1) * interval '2 hours')
FROM media_seed
ORDER BY idx;

INSERT INTO "UserProfile" (
  id,
  "userId",
  "displayName",
  bio,
  "avatarAssetId",
  city,
  district,
  ward,
  "growerVerificationStatus",
  "verifiedGrowerAt",
  "totalHarvests",
  "totalCareLogs",
  "createdAt",
  "updatedAt"
)
SELECT
  concat('21000000-0000-0000-0000-', lpad(idx::TEXT, 12, '0')),
  concat('10000000-0000-0000-0000-', lpad(idx::TEXT, 12, '0')),
  display_name,
  bio,
  CASE
    WHEN idx <= 10 THEN concat('20000000-0000-0000-0000-', lpad(idx::TEXT, 12, '0'))
    ELSE NULL
  END,
  'Ho Chi Minh City',
  district,
  ward,
  CASE
    WHEN idx BETWEEN 1 AND 12 THEN 'PENDING'::"VerificationStatus"
    ELSE 'NONE'::"VerificationStatus"
  END,
  NULL,
  0,
  0,
  timestamp '2026-01-06 08:00:00' + ((idx - 1) * interval '6 hours'),
  timestamp '2026-01-06 08:00:00' + ((idx - 1) * interval '6 hours')
FROM seed_users
ORDER BY idx;

CREATE TEMP TABLE seed_species (
  idx INTEGER PRIMARY KEY,
  slug TEXT NOT NULL,
  common_name TEXT NOT NULL,
  scientific_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty "PlantDifficulty" NOT NULL,
  light_requirement "LightLevel" NOT NULL,
  harvest_days_min INTEGER,
  harvest_days_max INTEGER,
  min_light_score INTEGER,
  max_light_score INTEGER,
  recommended_min_area NUMERIC(6, 2),
  temperature_min INTEGER,
  temperature_max INTEGER,
  humidity_notes TEXT,
  marketplace_eligible BOOLEAN NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_species VALUES
(1, 'cherry-tomato', 'Cherry Tomato', 'Solanum lycopersicum var. cerasiforme', 'Vegetable', 'Compact cherry tomato suitable for balcony containers and rooftop rails.', 'MODERATE', 'FULL_SUN', 75, 95, 72, 100, 0.35, 22, 34, 'Needs steady airflow in humid weather.', TRUE),
(2, 'butterhead-lettuce', 'Butterhead Lettuce', 'Lactuca sativa', 'Leafy Green', 'Soft butterhead lettuce for quick salad cycles in shallow planters.', 'EASY', 'PARTIAL_SUN', 35, 50, 40, 72, 0.10, 16, 28, 'Prefers consistently moist soil.', TRUE),
(3, 'thai-basil', 'Thai Basil', 'Ocimum basilicum var. thyrsiflora', 'Herb', 'Fast-growing basil with strong aroma and repeat harvest potential.', 'EASY', 'FULL_SUN', 35, 55, 60, 96, 0.08, 20, 34, 'Trim often to avoid woody stems.', TRUE),
(4, 'vining-cucumber', 'Vining Cucumber', 'Cucumis sativus', 'Vegetable', 'High-yield cucumber that benefits from vertical trellis support.', 'MODERATE', 'FULL_SUN', 50, 70, 72, 100, 0.45, 20, 35, 'Responds well to deep watering in hot weeks.', TRUE),
(5, 'red-chili', 'Red Chili', 'Capsicum annuum', 'Vegetable', 'Productive chili pepper for patio pots and warm corners.', 'MODERATE', 'FULL_SUN', 90, 130, 70, 100, 0.18, 22, 35, 'Avoid overwatering during flowering.', TRUE),
(6, 'peppermint', 'Peppermint', 'Mentha x piperita', 'Herb', 'Rapid mint spreader suited for cut-and-come-again harvesting.', 'EASY', 'PARTIAL_SHADE', 30, 45, 30, 68, 0.12, 16, 30, 'Thrives in humid shaded areas.', TRUE),
(7, 'baby-spinach', 'Baby Spinach', 'Spinacia oleracea', 'Leafy Green', 'Quick spinach crop for cool windows and mixed light shelves.', 'EASY', 'PARTIAL_SUN', 28, 42, 38, 70, 0.08, 15, 26, 'Sensitive to prolonged heat spikes.', TRUE),
(8, 'zucchini-compact', 'Compact Zucchini', 'Cucurbita pepo', 'Vegetable', 'Space-conscious zucchini selected for urban trellis buckets.', 'MODERATE', 'FULL_SUN', 48, 65, 72, 100, 0.60, 20, 34, 'Needs aggressive feeding after flowering.', TRUE),
(9, 'cilantro', 'Cilantro', 'Coriandrum sativum', 'Herb', 'Fast herb cycle ideal for partial sun rail planters.', 'EASY', 'PARTIAL_SUN', 32, 48, 42, 74, 0.05, 16, 28, 'Bolts quickly in exposed afternoon heat.', TRUE),
(10, 'purple-eggplant', 'Purple Eggplant', 'Solanum melongena', 'Vegetable', 'Container eggplant with steady fruiting under strong sun.', 'MODERATE', 'FULL_SUN', 72, 100, 75, 100, 0.28, 22, 34, 'Benefits from staking during fruit set.', TRUE),
(11, 'rosemary', 'Rosemary', 'Salvia rosmarinus', 'Herb', 'Woody herb for drier corners and decorative edible borders.', 'MODERATE', 'FULL_SUN', 60, 90, 65, 100, 0.12, 18, 32, 'Keep foliage dry to reduce mildew.', TRUE),
(12, 'spring-onion', 'Spring Onion', 'Allium fistulosum', 'Leafy Green', 'Reliable scallion crop for tight troughs and shallow beds.', 'EASY', 'PARTIAL_SUN', 28, 45, 40, 78, 0.07, 16, 30, 'Tolerates regular trimming.', TRUE),
(13, 'curly-kale', 'Curly Kale', 'Brassica oleracea var. sabellica', 'Leafy Green', 'Cut-and-come kale for cooler weeks and shaded balconies.', 'EASY', 'PARTIAL_SUN', 55, 75, 40, 74, 0.15, 15, 28, 'Performs best with regular nitrogen top-ups.', TRUE),
(14, 'dill', 'Dill', 'Anethum graveolens', 'Herb', 'Feathery herb suited for fast succession sowing.', 'EASY', 'FULL_SUN', 40, 60, 56, 90, 0.08, 16, 30, 'Needs support when exposed to strong wind.', TRUE),
(15, 'yellow-bell-pepper', 'Yellow Bell Pepper', 'Capsicum annuum grossum', 'Vegetable', 'Longer season pepper for growers willing to log consistent care.', 'HARD', 'FULL_SUN', 105, 145, 78, 100, 0.24, 22, 34, 'Feed steadily once fruit sets.', TRUE),
(16, 'arugula', 'Arugula', 'Eruca vesicaria', 'Leafy Green', 'Peppery salad leaf that matures quickly in partial sun.', 'EASY', 'PARTIAL_SUN', 24, 38, 40, 70, 0.06, 16, 28, 'Keep soil cool with mulch or shade cloth.', TRUE),
(17, 'oregano', 'Oregano', 'Origanum vulgare', 'Herb', 'Low-maintenance herb for hot balconies and border pots.', 'EASY', 'FULL_SUN', 45, 70, 60, 96, 0.08, 18, 32, 'Likes slightly drier soil between waterings.', TRUE),
(18, 'napa-cabbage', 'Napa Cabbage', 'Brassica rapa subsp. pekinensis', 'Leafy Green', 'Compact napa cabbage adapted for shoulder-season production.', 'MODERATE', 'PARTIAL_SUN', 58, 85, 42, 78, 0.26, 16, 28, 'Watch closely for chewing pests.', TRUE),
(19, 'thyme', 'Thyme', 'Thymus vulgaris', 'Herb', 'Dense woody herb for sunny ledges and low-water systems.', 'EASY', 'FULL_SUN', 55, 85, 64, 100, 0.05, 18, 32, 'Needs excellent drainage.', TRUE),
(20, 'mini-broccoli', 'Mini Broccoli', 'Brassica oleracea var. italica', 'Vegetable', 'Small-space broccoli chosen for container heat resilience.', 'MODERATE', 'FULL_SUN', 68, 95, 52, 88, 0.22, 16, 28, 'Prefers extra airflow and lower night temperatures.', TRUE),
(21, 'flat-leaf-parsley', 'Flat-leaf Parsley', 'Petroselinum crispum', 'Herb', 'Dense parsley for repeated clipping and bundle sales.', 'EASY', 'PARTIAL_SUN', 45, 65, 42, 76, 0.08, 16, 30, 'Slow starter but dependable once established.', TRUE),
(22, 'snap-bean', 'Snap Bean', 'Phaseolus vulgaris', 'Vegetable', 'Bush bean for medium containers and fast turnover harvests.', 'EASY', 'FULL_SUN', 48, 68, 64, 98, 0.25, 20, 32, 'Avoid wet foliage late in the day.', TRUE),
(23, 'chives', 'Chives', 'Allium schoenoprasum', 'Herb', 'Mild onion herb for compact herb corners and companion planting.', 'EASY', 'PARTIAL_SUN', 30, 50, 40, 76, 0.05, 16, 30, 'Recovers fast after clipping.', TRUE),
(24, 'mini-bok-choy', 'Mini Bok Choy', 'Brassica rapa subsp. chinensis', 'Leafy Green', 'Quick bok choy crop for shaded balconies and rotation beds.', 'EASY', 'PARTIAL_SUN', 32, 46, 38, 70, 0.09, 16, 28, 'Monitor moisture closely to avoid bitterness.', TRUE);

INSERT INTO "PlantSpecies" (
  id,
  slug,
  "commonName",
  "scientificName",
  category,
  description,
  difficulty,
  "lightRequirement",
  "harvestDaysMin",
  "harvestDaysMax",
  "minLightScore",
  "maxLightScore",
  "recommendedMinAreaSqm",
  "temperatureMinC",
  "temperatureMaxC",
  "humidityNotes",
  "isHcmcSuitable",
  "isMarketplaceEligible",
  "createdAt",
  "updatedAt"
)
SELECT
  concat('30000000-0000-0000-0000-', lpad(idx::TEXT, 12, '0')),
  slug,
  common_name,
  scientific_name,
  category,
  description,
  difficulty,
  light_requirement,
  harvest_days_min,
  harvest_days_max,
  min_light_score,
  max_light_score,
  recommended_min_area,
  temperature_min,
  temperature_max,
  humidity_notes,
  TRUE,
  marketplace_eligible,
  timestamp '2026-01-08 08:00:00' + ((idx - 1) * interval '3 hours'),
  timestamp '2026-01-08 08:00:00' + ((idx - 1) * interval '3 hours')
FROM seed_species
ORDER BY idx;

INSERT INTO "PlantCareProfile" (
  id,
  "plantSpeciesId",
  "sunlightSummary",
  "wateringSummary",
  "soilSummary",
  "fertilizingSummary",
  "companionNotes",
  "commonPests",
  "growthTimeline",
  "createdAt",
  "updatedAt"
)
SELECT
  concat('31000000-0000-0000-0000-', lpad(ss.idx::TEXT, 12, '0')),
  concat('30000000-0000-0000-0000-', lpad(ss.idx::TEXT, 12, '0')),
  CASE ss.light_requirement
    WHEN 'FULL_SUN' THEN concat(ss.common_name, ' needs a bright, open exposure for at least 6 hours each day.')
    WHEN 'PARTIAL_SUN' THEN concat(ss.common_name, ' performs best with bright morning light and afternoon protection.')
    WHEN 'PARTIAL_SHADE' THEN concat(ss.common_name, ' should be kept in filtered light to avoid stress in peak heat.')
    ELSE concat(ss.common_name, ' can be maintained under supplemental lighting with consistent intensity.')
  END,
  CASE
    WHEN ss.category = 'Herb' THEN 'Water when the top layer just begins to dry, then prune lightly after active growth.'
    WHEN ss.category = 'Leafy Green' THEN 'Keep moisture even and avoid letting the root zone dry out completely.'
    ELSE 'Use deeper watering cycles and monitor drainage so roots stay oxygenated.'
  END,
  CASE
    WHEN ss.category = 'Leafy Green' THEN 'Use light, moisture-retentive soil with steady organic matter.'
    WHEN ss.category = 'Herb' THEN 'Use airy potting mix with good drainage and moderate compost content.'
    ELSE 'Use rich container mix with drainage support and top-dress as plants size up.'
  END,
  CASE
    WHEN ss.difficulty = 'HARD' THEN 'Feed lightly every 7 to 10 days once the plant is established.'
    WHEN ss.category = 'Vegetable' THEN 'Feed every 10 to 14 days during active fruiting or heavy leaf production.'
    ELSE 'A diluted feed every 2 weeks is usually enough for stable growth.'
  END,
  CASE
    WHEN ss.category = 'Herb' THEN 'Pairs well with other compact herbs in mixed balcony planters.'
    ELSE 'Avoid overcrowding and keep airflow open when pairing with neighboring containers.'
  END,
  json_build_array(
    json_build_object('name', 'aphids', 'severity', CASE WHEN ss.category = 'Herb' THEN 'medium' ELSE 'high' END),
    json_build_object('name', 'powdery mildew', 'severity', CASE WHEN ss.light_requirement = 'FULL_SUN' THEN 'low' ELSE 'medium' END)
  ),
  json_build_array(
    json_build_object('stage', 'seedling', 'days', 10),
    json_build_object('stage', 'vegetative', 'days', GREATEST(COALESCE(ss.harvest_days_min, 35) - 15, 12)),
    json_build_object('stage', 'harvest_window', 'days', LEAST(COALESCE(ss.harvest_days_max, 60), 30))
  ),
  timestamp '2026-01-09 08:00:00' + ((ss.idx - 1) * interval '90 minutes'),
  timestamp '2026-01-09 08:00:00' + ((ss.idx - 1) * interval '90 minutes')
FROM seed_species ss
ORDER BY ss.idx;

CREATE TEMP TABLE seed_products (
  idx INTEGER PRIMARY KEY,
  sku TEXT NOT NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  type "ProductType" NOT NULL,
  description TEXT NOT NULL,
  price_amount INTEGER NOT NULL,
  plant_species_idx INTEGER,
  cover_asset_idx INTEGER,
  metadata JSON
) ON COMMIT DROP;

INSERT INTO seed_products VALUES
(1, 'KIT-TOM-001', 'balcony-tomato-starter-kit', 'Balcony Tomato Starter Kit', 'KIT', 'A starter bundle for one bright-sun tomato lane with soil, pot and nutrient support.', 349000, 1, 28, json_build_object('kitTheme', 'fruiting', 'difficulty', 'moderate')),
(2, 'KIT-LET-001', 'salad-greens-balcony-kit', 'Salad Greens Balcony Kit', 'KIT', 'Quick-start kit for lettuce and mixed greens in shallow balcony containers.', 329000, 2, 28, json_build_object('kitTheme', 'leafy', 'difficulty', 'easy')),
(3, 'KIT-HER-001', 'herb-window-box-kit', 'Herb Window Box Kit', 'KIT', 'Compact herb box with basil-first setup for windows and narrow ledges.', 289000, 3, 29, json_build_object('kitTheme', 'herb', 'difficulty', 'easy')),
(4, 'KIT-CUC-001', 'cucumber-trellis-kit', 'Cucumber Trellis Kit', 'KIT', 'Vertical setup for cucumbers with trellis support and deeper media.', 369000, 4, 29, json_build_object('kitTheme', 'trellis', 'difficulty', 'moderate')),
(5, 'KIT-PEP-001', 'pepper-patio-kit', 'Pepper Patio Kit', 'KIT', 'Patio-focused pepper kit with deeper rooting volume and steady feeding.', 379000, 5, 28, json_build_object('kitTheme', 'pepper', 'difficulty', 'moderate')),
(6, 'KIT-HYD-001', 'hydro-herb-sensor-kit', 'Hydro Herb Sensor Kit', 'KIT', 'A sensor-supported herb starter for cilantro and quick hydro trials.', 399000, 9, 29, json_build_object('kitTheme', 'hydro', 'difficulty', 'moderate')),
(7, 'SEED-TOM-001', 'cherry-tomato-seeds', 'Cherry Tomato Seeds', 'SEED', 'Premium cherry tomato seed packet selected for container vigor.', 39000, 1, 28, json_build_object('packetSize', 20)),
(8, 'SEED-LET-001', 'butterhead-lettuce-seeds', 'Butterhead Lettuce Seeds', 'SEED', 'Leaf lettuce seed packet for dense salad rotations.', 32000, 2, 28, json_build_object('packetSize', 120)),
(9, 'SEED-BAS-001', 'thai-basil-seeds', 'Thai Basil Seeds', 'SEED', 'Thai basil seed packet with strong germination for warm weather.', 28000, 3, 29, json_build_object('packetSize', 150)),
(10, 'SEED-CUC-001', 'cucumber-seeds', 'Cucumber Seeds', 'SEED', 'Cucumber seeds for vertical summer production.', 36000, 4, 29, json_build_object('packetSize', 18)),
(11, 'SEED-CHI-001', 'red-chili-seeds', 'Red Chili Seeds', 'SEED', 'Hot chili seed packet designed for sunny balcony containers.', 42000, 5, 28, json_build_object('packetSize', 30)),
(12, 'SEED-BOK-001', 'mini-bok-choy-seeds', 'Mini Bok Choy Seeds', 'SEED', 'Quick bok choy packet for compact leafy cycles.', 30000, 24, 29, json_build_object('packetSize', 100)),
(13, 'SOIL-COIR-001', 'organic-coco-coir-mix', 'Organic Coco Coir Mix', 'SOIL', 'Light coco coir base for drainage-heavy fruiting crops.', 89000, NULL, 28, json_build_object('volumeLiters', 18)),
(14, 'SOIL-HYD-001', 'lightweight-hydro-soil', 'Lightweight Hydro Soil', 'SOIL', 'Fast-draining media blend for herbs and sensor setups.', 99000, NULL, 29, json_build_object('volumeLiters', 16)),
(15, 'SOIL-WORM-001', 'worm-castings-blend', 'Worm Castings Blend', 'SOIL', 'Biologically active soil additive for steady feeding.', 79000, NULL, 28, json_build_object('volumeLiters', 12)),
(16, 'SOIL-SEED-001', 'seedling-potting-mix', 'Seedling Potting Mix', 'SOIL', 'Fine-texture mix intended for shallow leafy green trays.', 69000, NULL, 29, json_build_object('volumeLiters', 14)),
(17, 'POT-SW-001', 'self-watering-pot-25cm', '25cm Self Watering Pot', 'POT', 'Compact self-watering pot for tomatoes and herbs.', 129000, NULL, 28, json_build_object('diameterCm', 25)),
(18, 'POT-WIN-001', 'window-rail-planter', 'Window Rail Planter', 'POT', 'Slim planter sized for lettuce, basil and bok choy rows.', 139000, NULL, 29, json_build_object('lengthCm', 55)),
(19, 'POT-TRE-001', 'trellis-grow-bag', 'Trellis Grow Bag', 'POT', 'Fabric grow bag with trellis anchors for cucumbers and beans.', 149000, NULL, 28, json_build_object('volumeLiters', 25)),
(20, 'POT-DEEP-001', 'deep-root-pot', 'Deep Root Pot', 'POT', 'Deep container for peppers and eggplants.', 159000, NULL, 29, json_build_object('volumeLiters', 22)),
(21, 'SNS-MOIST-001', 'soil-moisture-sensor', 'Soil Moisture Sensor', 'SENSOR', 'Basic sensor for moisture checks and reminder tuning.', 169000, NULL, 28, json_build_object('battery', 'CR2032')),
(22, 'SNS-CLIMATE-001', 'mini-climate-sensor', 'Mini Climate Sensor', 'SENSOR', 'Tracks light and humidity around sensitive greens and herbs.', 199000, NULL, 29, json_build_object('battery', 'USB-C')),
(23, 'ADD-NUTE-001', 'liquid-nutrient-starter', 'Liquid Nutrient Starter', 'ADD_ON', 'Balanced starter nutrient for weekly feeding routines.', 59000, NULL, 28, json_build_object('sizeMl', 250)),
(24, 'ADD-TREL-001', 'bamboo-trellis-pack', 'Bamboo Trellis Pack', 'ADD_ON', 'Reusable bamboo support set for climbers and tall stems.', 49000, NULL, 29, json_build_object('pieces', 12));

INSERT INTO "Product" (
  id,
  sku,
  slug,
  name,
  type,
  description,
  "priceAmount",
  currency,
  "isActive",
  "plantSpeciesId",
  "coverAssetId",
  metadata,
  "createdAt",
  "updatedAt"
)
SELECT
  concat('40000000-0000-0000-0000-', lpad(idx::TEXT, 12, '0')),
  sku,
  slug,
  name,
  type,
  description,
  price_amount,
  'VND',
  TRUE,
  CASE
    WHEN plant_species_idx IS NULL THEN NULL
    ELSE concat('30000000-0000-0000-0000-', lpad(plant_species_idx::TEXT, 12, '0'))
  END,
  CASE
    WHEN cover_asset_idx IS NULL THEN NULL
    ELSE concat('20000000-0000-0000-0000-', lpad(cover_asset_idx::TEXT, 12, '0'))
  END,
  metadata,
  timestamp '2026-01-10 08:00:00' + ((idx - 1) * interval '4 hours'),
  timestamp '2026-01-10 08:00:00' + ((idx - 1) * interval '4 hours')
FROM seed_products
ORDER BY idx;

CREATE TEMP TABLE seed_product_components (
  idx INTEGER PRIMARY KEY,
  kit_idx INTEGER NOT NULL,
  component_product_idx INTEGER NOT NULL,
  component_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT,
  notes TEXT
) ON COMMIT DROP;

INSERT INTO seed_product_components VALUES
(1, 1, 7, 'Cherry Tomato Seeds', 1, 'packet', 'Matches the tomato starter flow.'),
(2, 1, 13, 'Organic Coco Coir Mix', 1, 'bag', 'Fast draining base for fruiting roots.'),
(3, 1, 17, '25cm Self Watering Pot', 1, 'pot', 'Keeps moisture more stable on balconies.'),
(4, 1, 23, 'Liquid Nutrient Starter', 1, 'bottle', 'Starter feed for early vegetative growth.'),
(5, 2, 8, 'Butterhead Lettuce Seeds', 1, 'packet', 'Fast salad green rotation.'),
(6, 2, 16, 'Seedling Potting Mix', 1, 'bag', 'Fine texture for shallow roots.'),
(7, 2, 18, 'Window Rail Planter', 1, 'planter', 'Sized for dense leafy planting.'),
(8, 2, 23, 'Liquid Nutrient Starter', 1, 'bottle', 'Helps sustain repeat harvests.'),
(9, 3, 9, 'Thai Basil Seeds', 1, 'packet', 'Core seed for the herb box.'),
(10, 3, 16, 'Seedling Potting Mix', 1, 'bag', 'Supports dense herb germination.'),
(11, 3, 18, 'Window Rail Planter', 1, 'planter', 'Fits windows and narrow ledges.'),
(12, 3, 24, 'Bamboo Trellis Pack', 1, 'set', 'Included as a simple support and marker set.'),
(13, 4, 10, 'Cucumber Seeds', 1, 'packet', 'Trellis-ready cucumber line.'),
(14, 4, 14, 'Lightweight Hydro Soil', 1, 'bag', 'Keeps root zone aerated in larger containers.'),
(15, 4, 19, 'Trellis Grow Bag', 1, 'bag', 'Main vertical growing container.'),
(16, 4, 24, 'Bamboo Trellis Pack', 1, 'set', 'Support structure for vines.'),
(17, 5, 11, 'Red Chili Seeds', 1, 'packet', 'Warm-weather chili starter.'),
(18, 5, 15, 'Worm Castings Blend', 1, 'bag', 'Slow feeding support for peppers.'),
(19, 5, 20, 'Deep Root Pot', 1, 'pot', 'Extra depth for peppers and eggplant.'),
(20, 5, 21, 'Soil Moisture Sensor', 1, 'sensor', 'Helps tune patio watering.'),
(21, 6, 9, 'Thai Basil Seeds', 1, 'packet', 'Secondary herb packet for the hydro bundle.'),
(22, 6, 14, 'Lightweight Hydro Soil', 1, 'bag', 'Sensor-friendly medium for herbs.'),
(23, 6, 17, '25cm Self Watering Pot', 1, 'pot', 'Compact reservoir for fast herbs.'),
(24, 6, 22, 'Mini Climate Sensor', 1, 'sensor', 'Supports light and humidity monitoring.');

INSERT INTO "ProductComponent" (
  id,
  "productId",
  "componentProductId",
  "componentName",
  quantity,
  unit,
  notes,
  "createdAt",
  "updatedAt"
)
SELECT
  concat('41000000-0000-0000-0000-', lpad(idx::TEXT, 12, '0')),
  concat('40000000-0000-0000-0000-', lpad(kit_idx::TEXT, 12, '0')),
  concat('40000000-0000-0000-0000-', lpad(component_product_idx::TEXT, 12, '0')),
  component_name,
  quantity,
  unit,
  notes,
  timestamp '2026-01-12 08:00:00' + ((idx - 1) * interval '45 minutes'),
  timestamp '2026-01-12 08:00:00' + ((idx - 1) * interval '45 minutes')
FROM seed_product_components
ORDER BY idx;

COMMIT;
