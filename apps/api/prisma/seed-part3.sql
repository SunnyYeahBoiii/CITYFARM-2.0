-- CITYFARM 2.0 Database Seed Script - PART 3
-- Scan analysis flow: SpaceScan -> ScanRecommendation -> ScanVisualization
-- Execution: psql "$DATABASE_URL" -f prisma/seed-part3.sql

BEGIN;

CREATE TEMP TABLE seed_scan_plan (
  scan_idx INTEGER PRIMARY KEY,
  user_idx INTEGER NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_scan_plan (scan_idx, user_idx)
SELECT gs, gs
FROM generate_series(1, 24) AS gs;

INSERT INTO "SpaceScan" (
  id,
  "userId",
  "sourceAssetId",
  status,
  "locationCity",
  "locationDistrict",
  "lightLevel",
  "lightScore",
  "availableAreaSqm",
  "capacityEstimate",
  "weatherSummary",
  "analysisSummary",
  "rawAnalysis",
  "detectedZones",
  "errorMessage",
  "createdAt",
  "updatedAt"
)
SELECT
  concat('60000000-0000-0000-0000-', lpad(sp.scan_idx::TEXT, 12, '0')),
  concat('10000000-0000-0000-0000-', lpad(sp.user_idx::TEXT, 12, '0')),
  CASE
    WHEN sp.scan_idx IN (6, 12, 18, 24) THEN NULL
    ELSE concat('20000000-0000-0000-0000-', lpad((10 + (((sp.scan_idx - 1) % 5) + 1))::TEXT, 12, '0'))
  END,
  CASE
    WHEN sp.scan_idx IN (6, 12, 18, 24) THEN 'FAILED'::"ScanStatus"
    ELSE 'ANALYZED'::"ScanStatus"
  END,
  'Ho Chi Minh City',
  up.district,
  CASE
    WHEN sp.scan_idx IN (6, 12, 18, 24) THEN NULL
    ELSE (ARRAY['FULL_SUN', 'PARTIAL_SUN', 'PARTIAL_SHADE', 'FULL_SUN', 'INDOOR_GROW_LIGHT'])[1 + ((sp.scan_idx - 1) % 5)]::"LightLevel"
  END,
  CASE
    WHEN sp.scan_idx IN (6, 12, 18, 24) THEN NULL
    ELSE 48 + (sp.scan_idx * 2)
  END,
  CASE
    WHEN sp.scan_idx IN (6, 12, 18, 24) THEN NULL
    ELSE ROUND((1.20 + (sp.scan_idx * 0.22))::NUMERIC, 2)
  END,
  CASE
    WHEN sp.scan_idx IN (6, 12, 18, 24) THEN NULL
    ELSE 2 + (sp.scan_idx % 6)
  END,
  CASE
    WHEN sp.scan_idx IN (6, 12, 18, 24) THEN 'Image capture failed in low stability conditions.'
    ELSE concat('Dry season balcony check with ', up.district, ' exposure profile.')
  END,
  CASE
    WHEN sp.scan_idx IN (6, 12, 18, 24) THEN 'Scan failed because the source image was too dark or blurry.'
    WHEN sp.scan_idx % 5 = 0 THEN 'Strong light and open airflow suggest fruiting crops or premium herbs.'
    WHEN sp.scan_idx % 3 = 0 THEN 'Mixed exposure favors leafy greens and compact herbs with careful watering.'
    ELSE 'Usable urban growing space with enough light for one focused crop plan.'
  END,
  CASE
    WHEN sp.scan_idx IN (6, 12, 18, 24) THEN json_build_object('quality', 'insufficient', 'retrySuggested', TRUE)
    ELSE json_build_object(
      'confidence', ROUND((0.74 + (sp.scan_idx * 0.008))::NUMERIC, 2),
      'surfaceType', CASE WHEN sp.scan_idx % 2 = 0 THEN 'balcony' ELSE 'rooftop' END,
      'windExposure', CASE WHEN sp.scan_idx % 4 = 0 THEN 'high' ELSE 'moderate' END
    )
  END,
  CASE
    WHEN sp.scan_idx IN (6, 12, 18, 24) THEN NULL
    ELSE json_build_object(
      'frontRail', json_build_object('areaSqm', ROUND((0.45 + (sp.scan_idx * 0.05))::NUMERIC, 2), 'light', 'PARTIAL_SUN'),
      'mainZone', json_build_object('areaSqm', ROUND((0.75 + (sp.scan_idx * 0.12))::NUMERIC, 2), 'light', 'FULL_SUN')
    )
  END,
  CASE
    WHEN sp.scan_idx IN (6, 12, 18, 24) THEN 'Image quality too low for reliable zone extraction.'
    ELSE NULL
  END,
  timestamp '2026-02-01 08:00:00' + ((sp.scan_idx - 1) * interval '1 day'),
  timestamp '2026-02-01 08:00:00' + ((sp.scan_idx - 1) * interval '1 day')
FROM seed_scan_plan sp
JOIN "UserProfile" up
  ON up."userId" = concat('10000000-0000-0000-0000-', lpad(sp.user_idx::TEXT, 12, '0'))
ORDER BY sp.scan_idx;

CREATE TEMP TABLE seed_recommendation_plan (
  rec_idx INTEGER PRIMARY KEY,
  scan_idx INTEGER NOT NULL,
  species_idx INTEGER NOT NULL,
  rank INTEGER NOT NULL
) ON COMMIT DROP;

INSERT INTO seed_recommendation_plan (rec_idx, scan_idx, species_idx, rank)
SELECT
  row_number() OVER (ORDER BY scan_idx, rank) AS rec_idx,
  scan_idx,
  species_idx,
  rank
FROM (
  SELECT scan_idx, scan_idx AS species_idx, 1 AS rank
  FROM generate_series(1, 20) AS scan_idx

  UNION ALL

  SELECT scan_idx, scan_idx + 10 AS species_idx, 2 AS rank
  FROM generate_series(1, 10) AS scan_idx
) seeded;

INSERT INTO "ScanRecommendation" (
  id,
  "scanId",
  "plantSpeciesId",
  rank,
  "matchScore",
  reason,
  rationale,
  "createdAt",
  "updatedAt"
)
SELECT
  concat('61000000-0000-0000-0000-', lpad(rp.rec_idx::TEXT, 12, '0')),
  concat('60000000-0000-0000-0000-', lpad(rp.scan_idx::TEXT, 12, '0')),
  concat('30000000-0000-0000-0000-', lpad(rp.species_idx::TEXT, 12, '0')),
  rp.rank,
  (CASE WHEN rp.rank = 1 THEN 92 ELSE 84 END) - ((rp.scan_idx - 1) % 6),
  concat(
    ps."commonName",
    ' matches the light profile in ',
    sc."locationDistrict",
    ' and fits the available area for an early dev recommendation set.'
  ),
  json_build_object(
    'lightScore', sc."lightScore",
    'availableAreaSqm', sc."availableAreaSqm",
    'capacityEstimate', sc."capacityEstimate",
    'rank', rp.rank
  ),
  sc."createdAt" + ((rp.rank * 15) * interval '1 minute'),
  sc."createdAt" + ((rp.rank * 15) * interval '1 minute')
FROM seed_recommendation_plan rp
JOIN "SpaceScan" sc
  ON sc.id = concat('60000000-0000-0000-0000-', lpad(rp.scan_idx::TEXT, 12, '0'))
JOIN "PlantSpecies" ps
  ON ps.id = concat('30000000-0000-0000-0000-', lpad(rp.species_idx::TEXT, 12, '0'))
ORDER BY rp.rec_idx;

INSERT INTO "ScanVisualization" (
  id,
  "scanId",
  "visualizationType",
  "sourceAssetId",
  "outputAssetId",
  prompt,
  metadata,
  "createdAt",
  "updatedAt"
)
SELECT
  concat('62000000-0000-0000-0000-', lpad(row_number() OVER (ORDER BY sc.id)::TEXT, 12, '0')),
  sc.id,
  CASE
    WHEN (row_number() OVER (ORDER BY sc.id)) % 2 = 0 THEN 'GENERATIVE'::"VisualizationType"
    ELSE 'OVERLAY'::"VisualizationType"
  END,
  sc."sourceAssetId",
  concat(
    '20000000-0000-0000-0000-',
    lpad((15 + (((row_number() OVER (ORDER BY sc.id)) - 1) % 4) + 1)::TEXT, 12, '0')
  ),
  CASE
    WHEN (row_number() OVER (ORDER BY sc.id)) % 2 = 0
      THEN 'Generate a compact planting preview with crop zoning and walking clearance.'
    ELSE 'Overlay recommended growing zones and light confidence on top of the source scan.'
  END,
  json_build_object(
    'renderPreset', CASE
      WHEN (row_number() OVER (ORDER BY sc.id)) % 2 = 0 THEN 'preview'
      ELSE 'zones'
    END,
    'recommendationCount', (
      SELECT COUNT(*)
      FROM "ScanRecommendation" sr
      WHERE sr."scanId" = sc.id
    )
  ),
  sc."createdAt" + interval '40 minutes',
  sc."createdAt" + interval '40 minutes'
FROM "SpaceScan" sc
WHERE sc.status = 'ANALYZED'
ORDER BY sc.id;

COMMIT;
