-- CITYFARM 2.0 Database Seed Script - PART 4
-- Garden tracking flow: GardenPlant -> CareSchedule -> CareTask -> PlantJournalEntry
-- Execution: psql "$DATABASE_URL" -f prisma/seed-part4.sql

BEGIN;

CREATE TEMP TABLE seed_garden_plants (
  plant_idx INTEGER PRIMARY KEY,
  user_idx INTEGER NOT NULL,
  activation_idx INTEGER,
  scan_idx INTEGER,
  manual_species_idx INTEGER,
  nickname TEXT NOT NULL,
  status "GardenPlantStatus" NOT NULL,
  growth_stage "PlantGrowthStage" NOT NULL,
  health_status "PlantHealthStatus" NOT NULL,
  zone_name TEXT,
  location_detail TEXT,
  planted_at TIMESTAMP NOT NULL,
  expected_harvest_at TIMESTAMP,
  actual_harvest_at TIMESTAMP,
  notes TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_garden_plants VALUES
(1, 1, 1, NULL, NULL, 'South Rail Cherry', 'ACTIVE', 'VEGETATIVE', 'HEALTHY', 'South Rail', 'Self-watering pot near balcony glass', '2026-01-20 07:30:00', '2026-04-10 08:00:00', NULL, 'Redeemed from tomato starter kit and growing steadily.'),
(2, 2, 2, NULL, NULL, 'Salad Greens Tray', 'ACTIVE', 'VEGETATIVE', 'HEALTHY', 'Leafy Shelf', 'Window rail planter under morning sun', '2026-01-21 07:45:00', '2026-03-10 08:00:00', NULL, 'Lettuce kit running as a dense cut-and-come-again tray.'),
(3, 3, 3, NULL, NULL, 'Kitchen Basil Box', 'ACTIVE', 'VEGETATIVE', 'HEALTHY', 'Herb Corner', 'Window box with strong airflow', '2026-01-22 08:00:00', '2026-03-20 08:00:00', NULL, 'Basil kit is being pinched regularly for bushier growth.'),
(4, 4, 4, NULL, NULL, 'Trellis Cucumber', 'HARVEST_READY', 'HARVEST_READY', 'HEALTHY', 'Main Trellis', 'Fabric grow bag against the terrace wall', '2026-01-23 07:20:00', '2026-04-05 08:00:00', NULL, 'First wave of cucumbers is ready for harvest.'),
(5, 5, 5, NULL, NULL, 'Patio Chili One', 'ACTIVE', 'FLOWERING', 'WARNING', 'Warm Corner', 'Deep root pot beside reflective wall', '2026-01-24 08:15:00', '2026-05-05 08:00:00', NULL, 'Flowering well but a few older leaves show stress.'),
(6, 6, 6, NULL, NULL, 'Sensor Cilantro', 'ACTIVE', 'VEGETATIVE', 'HEALTHY', 'Indoor Rack', 'Sensor-supported herb shelf', '2026-01-26 09:00:00', '2026-03-25 08:00:00', NULL, 'Cilantro is stable under indoor supplemental light.'),
(7, 7, 7, NULL, NULL, 'Rooftop Tomato Lane', 'HARVESTED', 'HARVESTED', 'HEALTHY', 'Rooftop Row', 'Large self-watering pot on windy roof edge', '2026-01-18 07:15:00', '2026-04-02 08:00:00', '2026-04-04 06:30:00', 'Completed a clean harvest and yielded multiple ripe clusters.'),
(8, 8, 8, NULL, NULL, 'Starter Lettuce Two', 'ACTIVE', 'SPROUTING', 'WARNING', 'Side Yard', 'Shallow planter under mixed light', '2026-02-02 08:30:00', '2026-03-25 08:00:00', NULL, 'Late germination and uneven sprouting after a hot week.'),
(9, 9, NULL, 9, NULL, 'Scan Basil Trial', 'ACTIVE', 'VEGETATIVE', 'HEALTHY', 'Scan Main Zone', 'Recommendation from the scan report main zone', '2026-02-18 08:00:00', '2026-04-05 08:00:00', NULL, 'Started directly from scan recommendation #1.'),
(10, 10, NULL, 10, NULL, 'Eggplant Scan Plot', 'ACTIVE', 'VEGETATIVE', 'HEALTHY', 'Planter A', 'Sunny ledge chosen after balcony scan', '2026-02-20 08:00:00', '2026-05-10 08:00:00', NULL, 'Eggplant is still building structure and branching.'),
(11, 11, NULL, 11, NULL, 'Rosemary From Scan', 'HARVEST_READY', 'HARVEST_READY', 'HEALTHY', 'Dry Corner', 'Low-water herb pot selected from scan output', '2026-02-14 08:30:00', '2026-04-01 08:00:00', NULL, 'Dense rosemary is ready for repeated clipping and bundles.'),
(12, 12, NULL, 13, NULL, 'Kale Shade Bed', 'ACTIVE', 'VEGETATIVE', 'WARNING', 'North Rail', 'Partial-sun balcony matched to kale recommendation', '2026-02-21 08:30:00', '2026-04-20 08:00:00', NULL, 'Minor yellowing showed up after a missed feed.'),
(13, 13, NULL, 14, NULL, 'Dill Hydro Trial', 'ACTIVE', 'VEGETATIVE', 'HEALTHY', 'Hydro Channel', 'Nutrient tray under bright window', '2026-02-24 09:00:00', '2026-04-10 08:00:00', NULL, 'Dill is growing fast in a light hydroponic setup.'),
(14, 14, NULL, 15, NULL, 'Pepper Scan Retry', 'FAILED', 'SPROUTING', 'CRITICAL', 'Courtyard Pot', 'Started after scan but lost due to poor germination', '2026-02-25 09:15:00', '2026-05-15 08:00:00', NULL, 'Seedlings collapsed after weak germination and heat stress.'),
(15, 15, NULL, 16, NULL, 'Arugula Quick Run', 'ACTIVE', 'VEGETATIVE', 'HEALTHY', 'Cool Shelf', 'Mixed light tray near kitchen vent', '2026-02-28 08:00:00', '2026-03-25 08:00:00', NULL, 'Arugula is on a fast cycle with regular harvest cuts.'),
(16, 16, NULL, 17, NULL, 'Oregano Test Pot', 'ARCHIVED', 'HARVESTED', 'HEALTHY', 'Back Shelf', 'Archived after a successful herb cycle', '2026-02-10 08:00:00', '2026-03-30 08:00:00', '2026-03-28 08:00:00', 'Archived after trimming and drying a full batch.'),
(17, 17, NULL, NULL, 1, 'Premium Tomato Bed', 'ACTIVE', 'FRUITING', 'HEALTHY', 'Main Bed', 'Manually planned high-light tomato container', '2026-01-12 07:00:00', '2026-04-08 08:00:00', NULL, 'Manual tomato setup aimed at premium marketplace quality.'),
(18, 18, NULL, NULL, 6, 'Mint Propagation Tray', 'ACTIVE', 'VEGETATIVE', 'WARNING', 'Propagation Table', 'Cuttings tray near humid wall', '2026-02-05 08:00:00', '2026-03-20 08:00:00', NULL, 'Peppermint spreads fast but needs runner control.'),
(19, 19, NULL, NULL, 24, 'Bok Choy Plan', 'PLANNED', 'SEEDED', 'UNKNOWN', 'Future Shelf', 'Seeds prepared for the next planting slot', '2026-04-09 08:00:00', '2026-05-15 08:00:00', NULL, 'Planned crop waiting for cooler weather and space clearance.'),
(20, 20, NULL, NULL, 20, 'Broccoli Compact Test', 'ACTIVE', 'VEGETATIVE', 'HEALTHY', 'West Corner', 'Container trial for mini broccoli', '2026-02-15 08:00:00', '2026-04-30 08:00:00', NULL, 'Compact broccoli is still forming a stable crown.'),
(21, 21, NULL, NULL, 21, 'Supplier Parsley Demo', 'ACTIVE', 'VEGETATIVE', 'HEALTHY', 'Demo Bench', 'Supplier demo pot for bundle production', '2026-01-15 08:00:00', '2026-03-25 08:00:00', NULL, 'Used as a live demo plant for supplier pickup days.'),
(22, 22, NULL, NULL, 12, 'Scallion Fast Turn', 'HARVEST_READY', 'HARVEST_READY', 'HEALTHY', 'Harvest Trough', 'Dense spring onion cluster for quick bundles', '2026-02-01 08:00:00', '2026-04-02 08:00:00', NULL, 'Spring onions are ready to be bundled and sold.'),
(23, 23, NULL, NULL, 19, 'Expert Thyme Pot', 'ACTIVE', 'VEGETATIVE', 'HEALTHY', 'Clinic Shelf', 'Expert-maintained thyme pot for support demos', '2026-01-10 08:00:00', '2026-03-20 08:00:00', NULL, 'Reference herb pot used in diagnosis examples.'),
(24, 24, NULL, NULL, 23, 'Admin Chives Pot', 'ACTIVE', 'VEGETATIVE', 'WARNING', 'Office Ledge', 'Low-maintenance chives by the ops desk', '2026-02-08 08:00:00', '2026-03-28 08:00:00', NULL, 'Office chives are productive but slightly rootbound.');

INSERT INTO "GardenPlant" (
  id,
  "userId",
  "plantSpeciesId",
  "activationCodeId",
  "sourceScanId",
  nickname,
  status,
  "growthStage",
  "healthStatus",
  "zoneName",
  "locationDetail",
  "plantedAt",
  "expectedHarvestAt",
  "actualHarvestAt",
  "lastJournaledAt",
  "lastCareAt",
  "verifiedForMarketplaceAt",
  notes,
  "createdAt",
  "updatedAt"
)
SELECT
  concat('70000000-0000-0000-0000-', lpad(gp.plant_idx::TEXT, 12, '0')),
  concat('10000000-0000-0000-0000-', lpad(gp.user_idx::TEXT, 12, '0')),
  COALESCE(
    prod."plantSpeciesId",
    sr."plantSpeciesId",
    concat('30000000-0000-0000-0000-', lpad(gp.manual_species_idx::TEXT, 12, '0'))
  ),
  CASE
    WHEN gp.activation_idx IS NULL THEN NULL
    ELSE concat('52000000-0000-0000-0000-', lpad(gp.activation_idx::TEXT, 12, '0'))
  END,
  CASE
    WHEN gp.scan_idx IS NULL THEN NULL
    ELSE concat('60000000-0000-0000-0000-', lpad(gp.scan_idx::TEXT, 12, '0'))
  END,
  gp.nickname,
  gp.status,
  gp.growth_stage,
  gp.health_status,
  gp.zone_name,
  gp.location_detail,
  gp.planted_at,
  gp.expected_harvest_at,
  gp.actual_harvest_at,
  NULL,
  NULL,
  NULL,
  gp.notes,
  gp.planted_at,
  gp.planted_at
FROM seed_garden_plants gp
LEFT JOIN "KitActivationCode" kac
  ON kac.id = concat('52000000-0000-0000-0000-', lpad(gp.activation_idx::TEXT, 12, '0'))
LEFT JOIN "Product" prod
  ON prod.id = kac."productId"
LEFT JOIN "ScanRecommendation" sr
  ON sr."scanId" = concat('60000000-0000-0000-0000-', lpad(gp.scan_idx::TEXT, 12, '0'))
 AND sr.rank = 1
ORDER BY gp.plant_idx;

INSERT INTO "CareSchedule" (
  id,
  "gardenPlantId",
  "taskType",
  title,
  description,
  "cadenceDays",
  "preferredHour",
  "preferredMinute",
  "startsAt",
  "endsAt",
  "isActive",
  metadata,
  "createdAt",
  "updatedAt"
)
SELECT
  concat('71000000-0000-0000-0000-', lpad(seq.plant_idx::TEXT, 12, '0')),
  concat('70000000-0000-0000-0000-', lpad(seq.plant_idx::TEXT, 12, '0')),
  CASE
    WHEN seq.plant_idx IN (3, 11, 17, 21) THEN 'PRUNING'::"CareTaskType"
    WHEN seq.plant_idx IN (5, 10, 18, 24) THEN 'FERTILIZING'::"CareTaskType"
    WHEN seq.plant_idx IN (4, 7, 22) THEN 'HARVEST'::"CareTaskType"
    WHEN seq.plant_idx IN (6, 13, 19) THEN 'PEST_CHECK'::"CareTaskType"
    ELSE 'WATERING'::"CareTaskType"
  END,
  CASE
    WHEN seq.plant_idx IN (4, 7, 22) THEN concat('Harvest cadence for ', gp.nickname)
    WHEN seq.plant_idx IN (3, 11, 17, 21) THEN concat('Pruning cadence for ', gp.nickname)
    WHEN seq.plant_idx IN (5, 10, 18, 24) THEN concat('Feeding cadence for ', gp.nickname)
    WHEN seq.plant_idx IN (6, 13, 19) THEN concat('Health check cadence for ', gp.nickname)
    ELSE concat('Watering cadence for ', gp.nickname)
  END,
  concat('Auto-generated early-dev care schedule for ', gp.nickname, '.'),
  CASE
    WHEN seq.plant_idx IN (4, 7, 22) THEN 5
    WHEN seq.plant_idx IN (3, 11, 17, 21) THEN 7
    WHEN seq.plant_idx IN (5, 10, 18, 24) THEN 10
    WHEN seq.plant_idx IN (6, 13, 19) THEN 6
    ELSE 2
  END,
  7 + (seq.plant_idx % 5),
  0,
  gp."plantedAt" + interval '1 day',
  CASE
    WHEN gp.status IN ('HARVESTED', 'ARCHIVED', 'FAILED') THEN COALESCE(gp."actualHarvestAt", gp."expectedHarvestAt")
    ELSE NULL
  END,
  CASE
    WHEN gp.status IN ('HARVESTED', 'ARCHIVED', 'FAILED') THEN FALSE
    ELSE TRUE
  END,
  json_build_object('plantIndex', seq.plant_idx, 'status', gp.status::TEXT),
  gp."createdAt" + interval '30 minutes',
  gp."createdAt" + interval '30 minutes'
FROM (
  SELECT
    gp.id,
    row_number() OVER (ORDER BY gp.id) AS plant_idx
  FROM "GardenPlant" gp
) seq
JOIN "GardenPlant" gp
  ON gp.id = seq.id
ORDER BY seq.plant_idx;

WITH base_tasks AS (
  SELECT
    row_number() OVER (ORDER BY gp.id) AS task_idx,
    gp.id AS garden_plant_id,
    cs.id AS schedule_id,
    cs."taskType" AS task_type,
    gp.nickname,
    gp."plantedAt" + ((14 + row_number() OVER (ORDER BY gp.id)) * interval '1 day') AS due_at
  FROM "GardenPlant" gp
  JOIN "CareSchedule" cs
    ON cs."gardenPlantId" = gp.id
)
INSERT INTO "CareTask" (
  id,
  "gardenPlantId",
  "scheduleId",
  "taskType",
  status,
  title,
  description,
  "dueAt",
  "completedAt",
  "skippedAt",
  "aiSummary",
  metadata,
  "createdAt",
  "updatedAt"
)
SELECT
  concat('72000000-0000-0000-0000-', lpad(task_idx::TEXT, 12, '0')),
  garden_plant_id,
  schedule_id,
  task_type,
  CASE
    WHEN task_idx IN (1, 3, 4, 7, 9, 11, 13, 15, 17, 20, 21, 22) THEN 'COMPLETED'::"CareTaskStatus"
    WHEN task_idx IN (5, 12, 24) THEN 'OVERDUE'::"CareTaskStatus"
    WHEN task_idx = 8 THEN 'SKIPPED'::"CareTaskStatus"
    ELSE 'PENDING'::"CareTaskStatus"
  END,
  concat(initcap(replace(task_type::TEXT, '_', ' ')), ' for ', nickname),
  concat('Primary scheduled task for ', nickname, '.'),
  due_at,
  CASE
    WHEN task_idx IN (1, 3, 4, 7, 9, 11, 13, 15, 17, 20, 21, 22) THEN due_at - interval '2 hours'
    ELSE NULL
  END,
  CASE
    WHEN task_idx = 8 THEN due_at + interval '4 hours'
    ELSE NULL
  END,
  CASE
    WHEN task_idx IN (1, 3, 4, 7, 9, 11, 13, 15, 17, 20, 21, 22) THEN 'Task completed on time during seed timeline.'
    WHEN task_idx IN (5, 12, 24) THEN 'Task is intentionally overdue to test reminder and escalation flows.'
    WHEN task_idx = 8 THEN 'Task was skipped because weather conditions changed.'
    ELSE NULL
  END,
  json_build_object('source', 'schedule', 'taskIndex', task_idx),
  due_at - interval '1 day',
  COALESCE(
    CASE WHEN task_idx IN (1, 3, 4, 7, 9, 11, 13, 15, 17, 20, 21, 22) THEN due_at - interval '2 hours' END,
    CASE WHEN task_idx = 8 THEN due_at + interval '4 hours' END,
    due_at - interval '1 day'
  )
FROM base_tasks
ORDER BY task_idx;

CREATE TEMP TABLE seed_extra_tasks (
  task_idx INTEGER PRIMARY KEY,
  plant_idx INTEGER NOT NULL,
  task_type "CareTaskType" NOT NULL,
  status "CareTaskStatus" NOT NULL,
  day_offset INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_extra_tasks VALUES
(25, 1, 'PEST_CHECK', 'COMPLETED', 48, 'Humidity Pest Check', 'Manual pest check after a humid week on the tomato rail.'),
(26, 4, 'HARVEST', 'COMPLETED', 72, 'First Cucumber Harvest', 'Document the first trellis cucumber harvest batch.'),
(27, 7, 'HARVEST', 'COMPLETED', 76, 'Weigh Tomato Harvest', 'Capture rooftop harvest weight for yield notes.'),
(28, 10, 'FERTILIZING', 'PENDING', 40, 'Pre-fruiting Feed', 'Boost eggplant before full fruit set begins.'),
(29, 18, 'PRUNING', 'SKIPPED', 30, 'Trim Mint Runners', 'Hold back peppermint runners from overtaking the tray.'),
(30, 22, 'HARVEST', 'COMPLETED', 60, 'Bundle Spring Onions', 'Harvest and bundle spring onions for pickup.');

INSERT INTO "CareTask" (
  id,
  "gardenPlantId",
  "scheduleId",
  "taskType",
  status,
  title,
  description,
  "dueAt",
  "completedAt",
  "skippedAt",
  "aiSummary",
  metadata,
  "createdAt",
  "updatedAt"
)
SELECT
  concat('72000000-0000-0000-0000-', lpad(et.task_idx::TEXT, 12, '0')),
  gp.id,
  NULL,
  et.task_type,
  et.status,
  et.title,
  et.description,
  gp."plantedAt" + (et.day_offset * interval '1 day'),
  CASE
    WHEN et.status = 'COMPLETED' THEN gp."plantedAt" + (et.day_offset * interval '1 day') + interval '1 hour'
    ELSE NULL
  END,
  CASE
    WHEN et.status = 'SKIPPED' THEN gp."plantedAt" + (et.day_offset * interval '1 day') + interval '2 hours'
    ELSE NULL
  END,
  CASE
    WHEN et.status = 'COMPLETED' THEN 'Extra manual task completed successfully.'
    WHEN et.status = 'SKIPPED' THEN 'Skipped to preserve plant stability during weather change.'
    ELSE NULL
  END,
  json_build_object('source', 'manual', 'taskIndex', et.task_idx),
  gp."plantedAt" + ((et.day_offset - 1) * interval '1 day'),
  COALESCE(
    CASE WHEN et.status = 'COMPLETED' THEN gp."plantedAt" + (et.day_offset * interval '1 day') + interval '1 hour' END,
    CASE WHEN et.status = 'SKIPPED' THEN gp."plantedAt" + (et.day_offset * interval '1 day') + interval '2 hours' END,
    gp."plantedAt" + ((et.day_offset - 1) * interval '1 day')
  )
FROM seed_extra_tasks et
JOIN "GardenPlant" gp
  ON gp.id = concat('70000000-0000-0000-0000-', lpad(et.plant_idx::TEXT, 12, '0'))
ORDER BY et.task_idx;

WITH base_journals AS (
  SELECT
    row_number() OVER (ORDER BY gp.id) AS journal_idx,
    gp.id AS garden_plant_id,
    gp.nickname,
    gp."healthStatus" AS plant_health_status,
    gp."plantedAt" + ((18 + row_number() OVER (ORDER BY gp.id)) * interval '1 day') AS captured_at
  FROM "GardenPlant" gp
)
INSERT INTO "PlantJournalEntry" (
  id,
  "gardenPlantId",
  "imageAssetId",
  "capturedAt",
  note,
  "healthStatus",
  "leafColorNote",
  "issueSummary",
  "recommendationSummary",
  "aiAnalysis",
  "createdAt",
  "updatedAt"
)
SELECT
  concat('73000000-0000-0000-0000-', lpad(journal_idx::TEXT, 12, '0')),
  garden_plant_id,
  CASE
    WHEN journal_idx <= 18 THEN concat(
      '20000000-0000-0000-0000-',
      lpad((20 + (((journal_idx - 1) % 4) + 1))::TEXT, 12, '0')
    )
    ELSE NULL
  END,
  captured_at,
  concat('Routine journal snapshot for ', nickname, '.'),
  plant_health_status,
  CASE
    WHEN plant_health_status = 'WARNING' THEN 'Older leaves show slight yellowing.'
    WHEN plant_health_status = 'CRITICAL' THEN 'Leaf tissue is soft and discolored.'
    ELSE 'Leaf color is stable and on target.'
  END,
  CASE
    WHEN plant_health_status = 'WARNING' THEN 'Monitor watering balance and nutrient timing.'
    WHEN plant_health_status = 'CRITICAL' THEN 'Plant declined rapidly after weak establishment.'
    ELSE NULL
  END,
  CASE
    WHEN plant_health_status = 'WARNING' THEN 'Keep logging daily until the plant stabilizes.'
    WHEN plant_health_status = 'CRITICAL' THEN 'Stop listing this plant and restart the batch.'
    ELSE 'Continue the current care plan and repeat observation in 3 to 5 days.'
  END,
  json_build_object('confidence', 0.88, 'journalIndex', journal_idx),
  captured_at,
  captured_at
FROM base_journals
ORDER BY journal_idx;

CREATE TEMP TABLE seed_extra_journals (
  journal_idx INTEGER PRIMARY KEY,
  plant_idx INTEGER NOT NULL,
  day_offset INTEGER NOT NULL,
  note TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_extra_journals VALUES
(25, 1, 68, 'Fruit set started on the south rail tomatoes.'),
(26, 4, 74, 'Cucumber harvest window confirmed with strong leaf turgor.'),
(27, 7, 78, 'Final rooftop tomato harvest completed and logged.'),
(28, 10, 46, 'Eggplant branching accelerated after warmer conditions.'),
(29, 17, 82, 'Premium tomato bed is carrying multiple ripening clusters.'),
(30, 22, 62, 'Spring onion bundles are thick enough for marketplace packaging.');

INSERT INTO "PlantJournalEntry" (
  id,
  "gardenPlantId",
  "imageAssetId",
  "capturedAt",
  note,
  "healthStatus",
  "leafColorNote",
  "issueSummary",
  "recommendationSummary",
  "aiAnalysis",
  "createdAt",
  "updatedAt"
)
SELECT
  concat('73000000-0000-0000-0000-', lpad(sej.journal_idx::TEXT, 12, '0')),
  gp.id,
  concat(
    '20000000-0000-0000-0000-',
    lpad((20 + (((sej.journal_idx - 1) % 4) + 1))::TEXT, 12, '0')
  ),
  gp."plantedAt" + (sej.day_offset * interval '1 day'),
  sej.note,
  gp."healthStatus",
  CASE
    WHEN gp."healthStatus" = 'WARNING' THEN 'Targeted pruning and watering adjustments are visible.'
    ELSE 'Color remains vibrant and growth is tracking as expected.'
  END,
  CASE
    WHEN gp."healthStatus" = 'WARNING' THEN 'Mild stress is improving but still worth monitoring.'
    ELSE NULL
  END,
  'Continue the established routine and compare against the previous photo set.',
  json_build_object('confidence', 0.92, 'followUp', TRUE),
  gp."plantedAt" + (sej.day_offset * interval '1 day'),
  gp."plantedAt" + (sej.day_offset * interval '1 day')
FROM seed_extra_journals sej
JOIN "GardenPlant" gp
  ON gp.id = concat('70000000-0000-0000-0000-', lpad(sej.plant_idx::TEXT, 12, '0'))
ORDER BY sej.journal_idx;

UPDATE "GardenPlant" gp
SET
  "lastJournaledAt" = journal_stats.last_journaled_at,
  "lastCareAt" = task_stats.last_care_at,
  "updatedAt" = GREATEST(
    gp."updatedAt",
    COALESCE(journal_stats.last_journaled_at, gp."updatedAt"),
    COALESCE(task_stats.last_care_at, gp."updatedAt")
  )
FROM (
  SELECT "gardenPlantId", MAX("capturedAt") AS last_journaled_at
  FROM "PlantJournalEntry"
  GROUP BY "gardenPlantId"
) journal_stats
LEFT JOIN (
  SELECT
    "gardenPlantId",
    MAX(COALESCE("completedAt", "skippedAt", "dueAt")) AS last_care_at
  FROM "CareTask"
  GROUP BY "gardenPlantId"
) task_stats
  ON task_stats."gardenPlantId" = journal_stats."gardenPlantId"
WHERE gp.id = journal_stats."gardenPlantId";

WITH profile_metrics AS (
  SELECT
    gp."userId",
    COUNT(DISTINCT CASE WHEN gp.status = 'HARVESTED' THEN gp.id END) AS total_harvests,
    COUNT(DISTINCT pje.id) AS journal_entries,
    COUNT(DISTINCT CASE WHEN ct.status IN ('COMPLETED', 'SKIPPED') THEN ct.id END) AS care_logs,
    MIN(gp."plantedAt") AS oldest_planted_at
  FROM "GardenPlant" gp
  LEFT JOIN "PlantJournalEntry" pje
    ON pje."gardenPlantId" = gp.id
  LEFT JOIN "CareTask" ct
    ON ct."gardenPlantId" = gp.id
  GROUP BY gp."userId"
)
UPDATE "UserProfile" up
SET
  "totalHarvests" = COALESCE(pm.total_harvests, 0),
  "totalCareLogs" = COALESCE(pm.journal_entries, 0) + COALESCE(pm.care_logs, 0),
  "growerVerificationStatus" = CASE
    WHEN pm.oldest_planted_at <= timestamp '2026-03-01 00:00:00'
      AND COALESCE(pm.journal_entries, 0) >= 1
      AND COALESCE(pm.care_logs, 0) >= 1 THEN 'VERIFIED'::"VerificationStatus"
    WHEN COALESCE(pm.journal_entries, 0) + COALESCE(pm.care_logs, 0) >= 1 THEN 'PENDING'::"VerificationStatus"
    ELSE 'NONE'::"VerificationStatus"
  END,
  "verifiedGrowerAt" = CASE
    WHEN pm.oldest_planted_at <= timestamp '2026-03-01 00:00:00'
      AND COALESCE(pm.journal_entries, 0) >= 1
      AND COALESCE(pm.care_logs, 0) >= 1 THEN pm.oldest_planted_at + interval '40 days'
    ELSE NULL
  END,
  "updatedAt" = timestamp '2026-04-02 09:00:00'
FROM profile_metrics pm
WHERE up."userId" = pm."userId";

UPDATE "GardenPlant" gp
SET
  "verifiedForMarketplaceAt" = CASE
    WHEN up."growerVerificationStatus" = 'VERIFIED'
      AND gp.status IN ('ACTIVE', 'HARVEST_READY', 'HARVESTED')
      AND gp."plantedAt" <= timestamp '2026-03-01 00:00:00'
      THEN gp."plantedAt" + interval '35 days'
    ELSE NULL
  END,
  "updatedAt" = GREATEST(gp."updatedAt", COALESCE(up."verifiedGrowerAt", gp."updatedAt"))
FROM "UserProfile" up
WHERE up."userId" = gp."userId";

COMMIT;
