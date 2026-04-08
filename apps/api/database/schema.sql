-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'SUPPLIER', 'EXPERT');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NONE', 'PENDING', 'VERIFIED', 'REVOKED');

-- CreateEnum
CREATE TYPE "PlantDifficulty" AS ENUM ('EASY', 'MODERATE', 'HARD');

-- CreateEnum
CREATE TYPE "LightLevel" AS ENUM ('LOW', 'PARTIAL_SHADE', 'PARTIAL_SUN', 'FULL_SUN', 'INDOOR_GROW_LIGHT');

-- CreateEnum
CREATE TYPE "PlantHealthStatus" AS ENUM ('UNKNOWN', 'HEALTHY', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "GardenPlantStatus" AS ENUM ('PLANNED', 'ACTIVE', 'HARVEST_READY', 'HARVESTED', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PlantGrowthStage" AS ENUM ('SEEDED', 'SPROUTING', 'VEGETATIVE', 'FLOWERING', 'FRUITING', 'HARVEST_READY', 'HARVESTED');

-- CreateEnum
CREATE TYPE "CareTaskType" AS ENUM ('WATERING', 'FERTILIZING', 'PRUNING', 'ROTATING', 'PEST_CHECK', 'HARVEST', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CareTaskStatus" AS ENUM ('PENDING', 'COMPLETED', 'SKIPPED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('KIT', 'SEED', 'SOIL', 'POT', 'SENSOR', 'ADD_ON');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'PENDING_CONFIRMATION', 'CONFIRMED', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH_ON_PICKUP', 'CASH_ON_DELIVERY', 'UNPAID');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('PENDING', 'ANALYZED', 'FAILED');

-- CreateEnum
CREATE TYPE "VisualizationType" AS ENUM ('OVERLAY', 'GENERATIVE');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('PROFILE_AVATAR', 'SPACE_SCAN', 'VISUALIZATION', 'GARDEN_JOURNAL', 'MARKETPLACE', 'POST_IMAGE', 'PRODUCT_IMAGE', 'MESSAGE_ATTACHMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('SHOWCASE', 'QUESTION', 'PLANT_SHARE', 'MARKETPLACE_SHARE', 'HARVEST_UPDATE');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'SUPPORT', 'THANKS');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RESERVED', 'SOLD', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('AI_ASSISTANT', 'MARKETPLACE', 'COMMUNITY', 'SUPPORT');

-- CreateEnum
CREATE TYPE "MessageSenderType" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'SYSTEM_EVENT');

-- CreateTable
CREATE TABLE "PlantSpecies" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "commonName" TEXT NOT NULL,
    "scientificName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "difficulty" "PlantDifficulty" NOT NULL,
    "lightRequirement" "LightLevel" NOT NULL,
    "harvestDaysMin" INTEGER,
    "harvestDaysMax" INTEGER,
    "minLightScore" INTEGER,
    "maxLightScore" INTEGER,
    "recommendedMinAreaSqm" DECIMAL(6,2),
    "temperatureMinC" INTEGER,
    "temperatureMaxC" INTEGER,
    "humidityNotes" TEXT,
    "isHcmcSuitable" BOOLEAN NOT NULL DEFAULT true,
    "isMarketplaceEligible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantSpecies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantCareProfile" (
    "id" TEXT NOT NULL,
    "plantSpeciesId" TEXT NOT NULL,
    "sunlightSummary" TEXT,
    "wateringSummary" TEXT,
    "soilSummary" TEXT,
    "fertilizingSummary" TEXT,
    "companionNotes" TEXT,
    "commonPests" JSONB,
    "growthTimeline" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantCareProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProductType" NOT NULL,
    "description" TEXT,
    "priceAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "plantSpeciesId" TEXT,
    "coverAssetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductComponent" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "componentProductId" TEXT,
    "componentName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderCode" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH_ON_PICKUP',
    "subtotalAmount" INTEGER NOT NULL,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "pickupCity" TEXT NOT NULL DEFAULT 'Ho Chi Minh City',
    "pickupDistrict" TEXT,
    "pickupAddressNote" TEXT,
    "customerNote" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "readyForPickupAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceAmount" INTEGER NOT NULL,
    "totalPriceAmount" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KitActivationCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "redeemedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KitActivationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedPost" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gardenPlantId" TEXT,
    "listingId" TEXT,
    "postType" "PostType" NOT NULL,
    "caption" TEXT NOT NULL,
    "contentJson" JSONB,
    "imageAssetId" TEXT,
    "visibilityDistrict" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentCommentId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostReaction" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reactionType" "ReactionType" NOT NULL DEFAULT 'LIKE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceListing" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "gardenPlantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(8,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "priceAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "pickupCity" TEXT NOT NULL DEFAULT 'Ho Chi Minh City',
    "pickupDistrict" TEXT NOT NULL,
    "pickupWard" TEXT,
    "pickupNote" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'NONE',
    "verificationSnapshot" TEXT,
    "documentedDays" INTEGER NOT NULL DEFAULT 0,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "soldAt" TIMESTAMP(3),
    "imageAssetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketplaceListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "type" "ConversationType" NOT NULL DEFAULT 'MARKETPLACE',
    "listingId" TEXT,
    "assistantContext" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3),

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderUserId" TEXT,
    "senderType" "MessageSenderType" NOT NULL,
    "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
    "body" TEXT,
    "mediaAssetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GardenPlant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plantSpeciesId" TEXT NOT NULL,
    "activationCodeId" TEXT,
    "sourceScanId" TEXT,
    "nickname" TEXT,
    "status" "GardenPlantStatus" NOT NULL DEFAULT 'ACTIVE',
    "growthStage" "PlantGrowthStage" NOT NULL DEFAULT 'SEEDED',
    "healthStatus" "PlantHealthStatus" NOT NULL DEFAULT 'UNKNOWN',
    "zoneName" TEXT,
    "locationDetail" TEXT,
    "plantedAt" TIMESTAMP(3) NOT NULL,
    "expectedHarvestAt" TIMESTAMP(3),
    "actualHarvestAt" TIMESTAMP(3),
    "lastJournaledAt" TIMESTAMP(3),
    "lastCareAt" TIMESTAMP(3),
    "verifiedForMarketplaceAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GardenPlant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareSchedule" (
    "id" TEXT NOT NULL,
    "gardenPlantId" TEXT NOT NULL,
    "taskType" "CareTaskType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cadenceDays" INTEGER,
    "preferredHour" INTEGER,
    "preferredMinute" INTEGER DEFAULT 0,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareTask" (
    "id" TEXT NOT NULL,
    "gardenPlantId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "taskType" "CareTaskType" NOT NULL,
    "status" "CareTaskStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "skippedAt" TIMESTAMP(3),
    "aiSummary" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantJournalEntry" (
    "id" TEXT NOT NULL,
    "gardenPlantId" TEXT NOT NULL,
    "imageAssetId" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "healthStatus" "PlantHealthStatus",
    "leafColorNote" TEXT,
    "issueSummary" TEXT,
    "recommendationSummary" TEXT,
    "aiAnalysis" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantJournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "refreshToken" TEXT,
    "externalAuthId" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "bio" TEXT,
    "avatarAssetId" TEXT,
    "city" TEXT,
    "district" TEXT,
    "ward" TEXT,
    "growerVerificationStatus" "VerificationStatus" NOT NULL DEFAULT 'NONE',
    "verifiedGrowerAt" TIMESTAMP(3),
    "totalHarvests" INTEGER NOT NULL DEFAULT 0,
    "totalCareLogs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "kind" "MediaKind" NOT NULL DEFAULT 'OTHER',
    "storageKey" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "altText" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpaceScan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceAssetId" TEXT,
    "status" "ScanStatus" NOT NULL DEFAULT 'PENDING',
    "locationCity" TEXT,
    "locationDistrict" TEXT,
    "lightLevel" "LightLevel",
    "lightScore" INTEGER,
    "availableAreaSqm" DECIMAL(6,2),
    "capacityEstimate" INTEGER,
    "weatherSummary" TEXT,
    "analysisSummary" TEXT,
    "rawAnalysis" JSONB,
    "detectedZones" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpaceScan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanRecommendation" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "plantSpeciesId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "matchScore" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "rationale" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScanRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanVisualization" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "visualizationType" "VisualizationType" NOT NULL DEFAULT 'OVERLAY',
    "sourceAssetId" TEXT,
    "outputAssetId" TEXT,
    "prompt" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScanVisualization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlantSpecies_slug_key" ON "PlantSpecies"("slug");

-- CreateIndex
CREATE INDEX "PlantSpecies_category_idx" ON "PlantSpecies"("category");

-- CreateIndex
CREATE INDEX "PlantSpecies_isHcmcSuitable_idx" ON "PlantSpecies"("isHcmcSuitable");

-- CreateIndex
CREATE UNIQUE INDEX "PlantCareProfile_plantSpeciesId_key" ON "PlantCareProfile"("plantSpeciesId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_type_isActive_idx" ON "Product"("type", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderCode_key" ON "Order"("orderCode");

-- CreateIndex
CREATE INDEX "Order_buyerId_status_createdAt_idx" ON "Order"("buyerId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "KitActivationCode_code_key" ON "KitActivationCode"("code");

-- CreateIndex
CREATE INDEX "KitActivationCode_orderItemId_idx" ON "KitActivationCode"("orderItemId");

-- CreateIndex
CREATE INDEX "KitActivationCode_productId_idx" ON "KitActivationCode"("productId");

-- CreateIndex
CREATE INDEX "FeedPost_userId_createdAt_idx" ON "FeedPost"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "FeedPost_visibilityDistrict_createdAt_idx" ON "FeedPost"("visibilityDistrict", "createdAt");

-- CreateIndex
CREATE INDEX "FeedComment_postId_createdAt_idx" ON "FeedComment"("postId", "createdAt");

-- CreateIndex
CREATE INDEX "FeedComment_userId_idx" ON "FeedComment"("userId");

-- CreateIndex
CREATE INDEX "PostReaction_userId_idx" ON "PostReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PostReaction_postId_userId_key" ON "PostReaction"("postId", "userId");

-- CreateIndex
CREATE INDEX "MarketplaceListing_sellerId_status_idx" ON "MarketplaceListing"("sellerId", "status");

-- CreateIndex
CREATE INDEX "MarketplaceListing_pickupDistrict_status_expiresAt_idx" ON "MarketplaceListing"("pickupDistrict", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "MarketplaceListing_gardenPlantId_idx" ON "MarketplaceListing"("gardenPlantId");

-- CreateIndex
CREATE INDEX "Conversation_listingId_createdAt_idx" ON "Conversation"("listingId", "createdAt");

-- CreateIndex
CREATE INDEX "ConversationParticipant_userId_idx" ON "ConversationParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON "ConversationParticipant"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_senderUserId_idx" ON "Message"("senderUserId");

-- CreateIndex
CREATE UNIQUE INDEX "GardenPlant_activationCodeId_key" ON "GardenPlant"("activationCodeId");

-- CreateIndex
CREATE INDEX "GardenPlant_userId_status_idx" ON "GardenPlant"("userId", "status");

-- CreateIndex
CREATE INDEX "GardenPlant_plantSpeciesId_status_idx" ON "GardenPlant"("plantSpeciesId", "status");

-- CreateIndex
CREATE INDEX "GardenPlant_sourceScanId_idx" ON "GardenPlant"("sourceScanId");

-- CreateIndex
CREATE INDEX "CareSchedule_gardenPlantId_isActive_idx" ON "CareSchedule"("gardenPlantId", "isActive");

-- CreateIndex
CREATE INDEX "CareTask_gardenPlantId_status_dueAt_idx" ON "CareTask"("gardenPlantId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "CareTask_scheduleId_idx" ON "CareTask"("scheduleId");

-- CreateIndex
CREATE INDEX "PlantJournalEntry_gardenPlantId_capturedAt_idx" ON "PlantJournalEntry"("gardenPlantId", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_externalAuthId_key" ON "User"("externalAuthId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_avatarAssetId_key" ON "UserProfile"("avatarAssetId");

-- CreateIndex
CREATE INDEX "UserProfile_district_idx" ON "UserProfile"("district");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");

-- CreateIndex
CREATE INDEX "SpaceScan_userId_createdAt_idx" ON "SpaceScan"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ScanRecommendation_plantSpeciesId_idx" ON "ScanRecommendation"("plantSpeciesId");

-- CreateIndex
CREATE UNIQUE INDEX "ScanRecommendation_scanId_rank_key" ON "ScanRecommendation"("scanId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "ScanRecommendation_scanId_plantSpeciesId_key" ON "ScanRecommendation"("scanId", "plantSpeciesId");

-- CreateIndex
CREATE INDEX "ScanVisualization_scanId_createdAt_idx" ON "ScanVisualization"("scanId", "createdAt");

-- AddForeignKey
ALTER TABLE "PlantCareProfile" ADD CONSTRAINT "PlantCareProfile_plantSpeciesId_fkey" FOREIGN KEY ("plantSpeciesId") REFERENCES "PlantSpecies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_plantSpeciesId_fkey" FOREIGN KEY ("plantSpeciesId") REFERENCES "PlantSpecies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_coverAssetId_fkey" FOREIGN KEY ("coverAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductComponent" ADD CONSTRAINT "ProductComponent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductComponent" ADD CONSTRAINT "ProductComponent_componentProductId_fkey" FOREIGN KEY ("componentProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitActivationCode" ADD CONSTRAINT "KitActivationCode_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitActivationCode" ADD CONSTRAINT "KitActivationCode_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_gardenPlantId_fkey" FOREIGN KEY ("gardenPlantId") REFERENCES "GardenPlant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedPost" ADD CONSTRAINT "FeedPost_imageAssetId_fkey" FOREIGN KEY ("imageAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedComment" ADD CONSTRAINT "FeedComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedComment" ADD CONSTRAINT "FeedComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedComment" ADD CONSTRAINT "FeedComment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "FeedComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostReaction" ADD CONSTRAINT "PostReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostReaction" ADD CONSTRAINT "PostReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_gardenPlantId_fkey" FOREIGN KEY ("gardenPlantId") REFERENCES "GardenPlant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceListing" ADD CONSTRAINT "MarketplaceListing_imageAssetId_fkey" FOREIGN KEY ("imageAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "MarketplaceListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_mediaAssetId_fkey" FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GardenPlant" ADD CONSTRAINT "GardenPlant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GardenPlant" ADD CONSTRAINT "GardenPlant_plantSpeciesId_fkey" FOREIGN KEY ("plantSpeciesId") REFERENCES "PlantSpecies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GardenPlant" ADD CONSTRAINT "GardenPlant_activationCodeId_fkey" FOREIGN KEY ("activationCodeId") REFERENCES "KitActivationCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GardenPlant" ADD CONSTRAINT "GardenPlant_sourceScanId_fkey" FOREIGN KEY ("sourceScanId") REFERENCES "SpaceScan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareSchedule" ADD CONSTRAINT "CareSchedule_gardenPlantId_fkey" FOREIGN KEY ("gardenPlantId") REFERENCES "GardenPlant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareTask" ADD CONSTRAINT "CareTask_gardenPlantId_fkey" FOREIGN KEY ("gardenPlantId") REFERENCES "GardenPlant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareTask" ADD CONSTRAINT "CareTask_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "CareSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantJournalEntry" ADD CONSTRAINT "PlantJournalEntry_gardenPlantId_fkey" FOREIGN KEY ("gardenPlantId") REFERENCES "GardenPlant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlantJournalEntry" ADD CONSTRAINT "PlantJournalEntry_imageAssetId_fkey" FOREIGN KEY ("imageAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_avatarAssetId_fkey" FOREIGN KEY ("avatarAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceScan" ADD CONSTRAINT "SpaceScan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceScan" ADD CONSTRAINT "SpaceScan_sourceAssetId_fkey" FOREIGN KEY ("sourceAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanRecommendation" ADD CONSTRAINT "ScanRecommendation_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "SpaceScan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanRecommendation" ADD CONSTRAINT "ScanRecommendation_plantSpeciesId_fkey" FOREIGN KEY ("plantSpeciesId") REFERENCES "PlantSpecies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanVisualization" ADD CONSTRAINT "ScanVisualization_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "SpaceScan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanVisualization" ADD CONSTRAINT "ScanVisualization_sourceAssetId_fkey" FOREIGN KEY ("sourceAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanVisualization" ADD CONSTRAINT "ScanVisualization_outputAssetId_fkey" FOREIGN KEY ("outputAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
