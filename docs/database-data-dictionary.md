# CITYFARM 2.0 Data Dictionary

## Conventions

- Tất cả bảng dùng `id: UUID`.
- Tất cả bảng nghiệp vụ chính có `createdAt`, `updatedAt`.
- Tiền tệ dùng `Int` theo đơn vị VND.
- Các cột `Json` chứa payload AI hoặc metadata linh hoạt, không dùng cho business rule cốt lõi.

## Enums

| Enum | Values |
| --- | --- |
| `UserRole` | `USER`, `ADMIN`, `SUPPLIER`, `EXPERT` |
| `VerificationStatus` | `NONE`, `PENDING`, `VERIFIED`, `REVOKED` |
| `PlantDifficulty` | `EASY`, `MODERATE`, `HARD` |
| `LightLevel` | `LOW`, `PARTIAL_SHADE`, `PARTIAL_SUN`, `FULL_SUN`, `INDOOR_GROW_LIGHT` |
| `PlantHealthStatus` | `UNKNOWN`, `HEALTHY`, `WARNING`, `CRITICAL` |
| `GardenPlantStatus` | `PLANNED`, `ACTIVE`, `HARVEST_READY`, `HARVESTED`, `FAILED`, `ARCHIVED` |
| `PlantGrowthStage` | `SEEDED`, `SPROUTING`, `VEGETATIVE`, `FLOWERING`, `FRUITING`, `HARVEST_READY`, `HARVESTED` |
| `CareTaskType` | `WATERING`, `FERTILIZING`, `PRUNING`, `ROTATING`, `PEST_CHECK`, `HARVEST`, `CUSTOM` |
| `CareTaskStatus` | `PENDING`, `COMPLETED`, `SKIPPED`, `OVERDUE` |
| `ProductType` | `KIT`, `SEED`, `SOIL`, `POT`, `SENSOR`, `ADD_ON` |
| `OrderStatus` | `DRAFT`, `PENDING_CONFIRMATION`, `CONFIRMED`, `READY_FOR_PICKUP`, `COMPLETED`, `CANCELLED` |
| `PaymentMethod` | `CASH_ON_PICKUP`, `CASH_ON_DELIVERY`, `UNPAID` |
| `ScanStatus` | `PENDING`, `ANALYZED`, `FAILED` |
| `VisualizationType` | `OVERLAY`, `GENERATIVE` |
| `MediaKind` | `PROFILE_AVATAR`, `SPACE_SCAN`, `VISUALIZATION`, `GARDEN_JOURNAL`, `MARKETPLACE`, `POST_IMAGE`, `PRODUCT_IMAGE`, `MESSAGE_ATTACHMENT`, `OTHER` |
| `PostType` | `SHOWCASE`, `QUESTION`, `PLANT_SHARE`, `MARKETPLACE_SHARE`, `HARVEST_UPDATE` |
| `ReactionType` | `LIKE`, `SUPPORT`, `THANKS` |
| `ListingStatus` | `DRAFT`, `ACTIVE`, `RESERVED`, `SOLD`, `EXPIRED`, `CANCELLED` |
| `ConversationType` | `AI_ASSISTANT`, `MARKETPLACE`, `COMMUNITY`, `SUPPORT` |
| `MessageSenderType` | `USER`, `ASSISTANT`, `SYSTEM` |
| `MessageType` | `TEXT`, `IMAGE`, `SYSTEM_EVENT` |

## Identity

### `User`

| Field | Type | Notes |
| --- | --- | --- |
| `email` | `String?` | Nullable unique để hỗ trợ auth social hoặc phone-first. |
| `externalAuthId` | `String?` | Bridge tới auth provider bên ngoài. |
| `role` | `UserRole` | Mặc định `USER`. |

Indexes and constraints:

- Unique: `email`, `externalAuthId`

### `UserProfile`

| Field | Type | Notes |
| --- | --- | --- |
| `userId` | `String` | One-to-one với `User`. |
| `displayName` | `String` | Tên hiển thị trong feed/listing. |
| `city`, `district`, `ward` | `String?` | Chỉ lưu coarse location. |
| `growerVerificationStatus` | `VerificationStatus` | Cache trạng thái verified grower. |
| `verifiedGrowerAt` | `DateTime?` | Mốc user được verify. |
| `totalHarvests` | `Int` | Counter dẫn xuất. |
| `totalCareLogs` | `Int` | Counter dẫn xuất. |

Indexes and constraints:

- Unique: `userId`, `avatarAssetId`
- Index: `district`

### `MediaAsset`

| Field | Type | Notes |
| --- | --- | --- |
| `ownerId` | `String?` | User upload hoặc sở hữu asset. |
| `kind` | `MediaKind` | Phân loại nơi dùng. |
| `storageKey` | `String` | Key object storage, unique. |
| `publicUrl` | `String` | URL render ra client. |
| `metadata` | `Json?` | EXIF, generation config, crop metadata. |

Indexes and constraints:

- Unique: `storageKey`

## Plant Catalog And Commerce

### `PlantSpecies`

| Field | Type | Notes |
| --- | --- | --- |
| `slug` | `String` | Stable identifier cho route/API. |
| `commonName` | `String` | Tên phổ biến. |
| `scientificName` | `String` | Tên khoa học. |
| `category` | `String` | Herb, vegetable, fruiting plant. |
| `difficulty` | `PlantDifficulty` | Độ khó. |
| `lightRequirement` | `LightLevel` | Điều kiện sáng chính. |
| `harvestDaysMin`, `harvestDaysMax` | `Int?` | Khung thời gian thu hoạch. |
| `recommendedMinAreaSqm` | `Decimal?` | Diện tích tối thiểu gợi ý. |
| `isHcmcSuitable` | `Boolean` | Lọc catalog cho thị trường mục tiêu. |

Indexes and constraints:

- Unique: `slug`
- Index: `category`, `isHcmcSuitable`

### `PlantCareProfile`

| Field | Type | Notes |
| --- | --- | --- |
| `plantSpeciesId` | `String` | One-to-one với `PlantSpecies`. |
| `sunlightSummary`, `wateringSummary`, `soilSummary`, `fertilizingSummary` | `String?` | Nội dung care guide. |
| `commonPests` | `Json?` | Danh sách pest/issue. |
| `growthTimeline` | `Json?` | Timeline chuẩn hóa cho UI. |

Indexes and constraints:

- Unique: `plantSpeciesId`

### `Product`

| Field | Type | Notes |
| --- | --- | --- |
| `sku` | `String` | Mã bán hàng. |
| `slug` | `String` | Dùng cho route hoặc storefront. |
| `type` | `ProductType` | `KIT`, `SEED`, `SOIL`, `POT`... |
| `priceAmount` | `Int` | Giá VND. |
| `plantSpeciesId` | `String?` | Dùng cho hạt giống hoặc SKU chuyên biệt theo loài. |
| `metadata` | `Json?` | Thuộc tính mở rộng của catalog. |

Indexes and constraints:

- Unique: `sku`, `slug`
- Index: `type + isActive`

### `ProductComponent`

| Field | Type | Notes |
| --- | --- | --- |
| `productId` | `String` | Product cha, thường là kit. |
| `componentProductId` | `String?` | Product con nếu component đã được catalog hóa. |
| `componentName` | `String` | Tên hiển thị nếu chưa có SKU riêng. |
| `quantity` | `Int` | Số lượng trong kit. |
| `unit` | `String?` | `pcs`, `g`, `L`... |

### `Order`

| Field | Type | Notes |
| --- | --- | --- |
| `orderCode` | `String` | Human-readable code. |
| `buyerId` | `String` | Người mua. |
| `status` | `OrderStatus` | Trạng thái đơn. |
| `paymentMethod` | `PaymentMethod` | Hiện mặc định `CASH_ON_PICKUP`. |
| `subtotalAmount`, `discountAmount`, `totalAmount` | `Int` | Giá trị đơn hàng theo VND. |
| `pickupDistrict` | `String?` | Quận/huyện nhận hàng. |

Indexes and constraints:

- Unique: `orderCode`
- Index: `buyerId + status + createdAt`

### `OrderItem`

| Field | Type | Notes |
| --- | --- | --- |
| `orderId` | `String` | Thuộc đơn nào. |
| `productId` | `String` | Product nào được mua. |
| `quantity` | `Int` | Số lượng. |
| `unitPriceAmount` | `Int` | Giá tại thời điểm mua. |
| `totalPriceAmount` | `Int` | Snapshot tổng tiền dòng hàng. |
| `metadata` | `Json?` | Cấu hình chọn thêm khi checkout. |

### `KitActivationCode`

| Field | Type | Notes |
| --- | --- | --- |
| `code` | `String` | Unique QR/activation code. |
| `orderItemId` | `String` | Dòng hàng phát sinh code. |
| `productId` | `String` | Product được kích hoạt. |
| `expiresAt` | `DateTime?` | Optional expiration. |
| `redeemedAt` | `DateTime?` | Null nếu chưa dùng. |

Indexes and constraints:

- Unique: `code`
- Quan hệ `GardenPlant.activationCodeId` đảm bảo mỗi code chỉ gắn một cây

## Scan And AI

### `SpaceScan`

| Field | Type | Notes |
| --- | --- | --- |
| `userId` | `String` | Chủ sở hữu scan. |
| `sourceAssetId` | `String?` | Ảnh gốc. |
| `status` | `ScanStatus` | Pending, analyzed, failed. |
| `locationDistrict` | `String?` | Khu vực phục vụ gợi ý nội địa hóa. |
| `lightLevel`, `lightScore` | `Enum`, `Int?` | Kết quả phân tích ánh sáng. |
| `availableAreaSqm` | `Decimal?` | Diện tích ước lượng. |
| `capacityEstimate` | `Int?` | Số chậu hoặc số cây gợi ý. |
| `rawAnalysis`, `detectedZones` | `Json?` | Payload CV thô. |

Indexes and constraints:

- Index: `userId + createdAt`

### `ScanRecommendation`

| Field | Type | Notes |
| --- | --- | --- |
| `scanId` | `String` | Thuộc scan nào. |
| `plantSpeciesId` | `String` | Cây được đề xuất. |
| `rank` | `Int` | Thứ hạng hiển thị. |
| `matchScore` | `Int` | Điểm % hoặc score chuẩn hóa. |
| `reason` | `String` | Lý do tóm tắt cho UI. |
| `rationale` | `Json?` | Explainability payload đầy đủ. |

Indexes and constraints:

- Unique: `scanId + rank`
- Unique: `scanId + plantSpeciesId`

### `ScanVisualization`

| Field | Type | Notes |
| --- | --- | --- |
| `scanId` | `String` | Gắn với scan gốc. |
| `visualizationType` | `VisualizationType` | Overlay hoặc generative. |
| `sourceAssetId`, `outputAssetId` | `String?` | Input/output image. |
| `prompt` | `String?` | Prompt dùng cho generation nếu có. |
| `metadata` | `Json?` | Transform, zones, generation params. |

## Garden Tracking

### `GardenPlant`

| Field | Type | Notes |
| --- | --- | --- |
| `userId` | `String` | Người trồng. |
| `plantSpeciesId` | `String` | Giống cây gốc. |
| `activationCodeId` | `String?` | Cây được tạo từ kit nếu có. |
| `sourceScanId` | `String?` | Scan dẫn đến quyết định trồng. |
| `nickname` | `String?` | Tên do người dùng đặt. |
| `status` | `GardenPlantStatus` | Trạng thái vòng đời. |
| `growthStage` | `PlantGrowthStage` | Stage hiện tại. |
| `healthStatus` | `PlantHealthStatus` | Sức khỏe hiện tại. |
| `zoneName` | `String?` | Ví dụ `East balcony rack`. |
| `plantedAt` | `DateTime` | Mốc bắt đầu. |
| `expectedHarvestAt`, `actualHarvestAt` | `DateTime?` | Forecast và actual. |
| `verifiedForMarketplaceAt` | `DateTime?` | Cache điều kiện bán hàng. |

Indexes and constraints:

- Unique: `activationCodeId`
- Index: `userId + status`, `plantSpeciesId + status`, `sourceScanId`

### `CareSchedule`

| Field | Type | Notes |
| --- | --- | --- |
| `gardenPlantId` | `String` | Thuộc cây nào. |
| `taskType` | `CareTaskType` | Loại công việc. |
| `cadenceDays` | `Int?` | Tần suất lặp theo ngày. |
| `preferredHour`, `preferredMinute` | `Int?` | Gợi ý giờ nhắc. |
| `startsAt`, `endsAt` | `DateTime` | Vòng đời schedule. |
| `isActive` | `Boolean` | Cho phép disable mà không xóa dữ liệu. |

### `CareTask`

| Field | Type | Notes |
| --- | --- | --- |
| `gardenPlantId` | `String` | Thuộc cây nào. |
| `scheduleId` | `String?` | Nếu task được spawn từ schedule. |
| `taskType` | `CareTaskType` | Watering, fertilizing... |
| `status` | `CareTaskStatus` | Pending/completed/skipped/overdue. |
| `dueAt` | `DateTime` | Hạn công việc. |
| `completedAt`, `skippedAt` | `DateTime?` | Mốc xử lý. |
| `aiSummary` | `String?` | Tóm tắt AI nếu action liên quan ảnh. |
| `metadata` | `Json?` | Dữ liệu mở rộng cho notification/UI. |

Indexes and constraints:

- Index: `gardenPlantId + status + dueAt`

### `PlantJournalEntry`

| Field | Type | Notes |
| --- | --- | --- |
| `gardenPlantId` | `String` | Cây được ghi nhật ký. |
| `imageAssetId` | `String?` | Ảnh ngày hôm đó. |
| `capturedAt` | `DateTime` | Mốc ảnh được chụp. |
| `healthStatus` | `PlantHealthStatus?` | Kết quả AI ngắn gọn. |
| `leafColorNote` | `String?` | Human-readable note. |
| `issueSummary` | `String?` | Tóm tắt vấn đề. |
| `recommendationSummary` | `String?` | Hành động gợi ý. |
| `aiAnalysis` | `Json?` | Payload model chi tiết. |

Indexes and constraints:

- Index: `gardenPlantId + capturedAt`

## Community And Marketplace

### `FeedPost`

| Field | Type | Notes |
| --- | --- | --- |
| `userId` | `String` | Tác giả bài viết. |
| `gardenPlantId` | `String?` | Nếu bài viết chia sẻ progress của cây. |
| `listingId` | `String?` | Nếu bài viết chia sẻ listing. |
| `postType` | `PostType` | Showcase, question, plant-share... |
| `caption` | `String` | Nội dung chính. |
| `contentJson` | `Json?` | Dữ liệu mở rộng cho rich post. |
| `visibilityDistrict` | `String?` | Feed lọc nội khu. |

Indexes and constraints:

- Index: `userId + createdAt`, `visibilityDistrict + createdAt`

### `FeedComment`

| Field | Type | Notes |
| --- | --- | --- |
| `postId` | `String` | Post gốc. |
| `userId` | `String` | Người comment. |
| `parentCommentId` | `String?` | Hỗ trợ reply thread nông. |
| `body` | `String` | Nội dung comment. |

Indexes and constraints:

- Index: `postId + createdAt`, `userId`

### `PostReaction`

| Field | Type | Notes |
| --- | --- | --- |
| `postId` | `String` | Post được react. |
| `userId` | `String` | User react. |
| `reactionType` | `ReactionType` | Hiện cho phép 1 reaction/user/post. |

Indexes and constraints:

- Unique: `postId + userId`

### `MarketplaceListing`

| Field | Type | Notes |
| --- | --- | --- |
| `sellerId` | `String` | Người bán. |
| `gardenPlantId` | `String` | Bắt buộc để truy xuất nguồn gốc. |
| `quantity` | `Decimal` | Cho phép bán theo kg/bundle. |
| `unit` | `String` | `kg`, `bundle`, `box`... |
| `priceAmount` | `Int` | Giá bán VND. |
| `pickupDistrict` | `String` | Trường quan trọng cho hyper-local filter. |
| `verificationStatus` | `VerificationStatus` | Snapshot badge cho listing. |
| `verificationSnapshot` | `String?` | Ví dụ `45 days documented with AI checks`. |
| `documentedDays` | `Int` | Snapshot số ngày có log. |
| `status` | `ListingStatus` | DRAFT, ACTIVE, SOLD... |
| `expiresAt` | `DateTime?` | Dùng cho auto-expire sau 7 ngày. |

Indexes and constraints:

- Index: `sellerId + status`
- Index: `pickupDistrict + status + expiresAt`
- Index: `gardenPlantId`

### `Conversation`

| Field | Type | Notes |
| --- | --- | --- |
| `type` | `ConversationType` | AI assistant hoặc marketplace chat. |
| `listingId` | `String?` | Có giá trị nếu chat gắn với listing. |
| `assistantContext` | `Json?` | Context cây hoặc listing cho AI. |

### `ConversationParticipant`

| Field | Type | Notes |
| --- | --- | --- |
| `conversationId` | `String` | Conversation nào. |
| `userId` | `String` | User tham gia. |
| `lastReadAt` | `DateTime?` | Hỗ trợ unread count. |

Indexes and constraints:

- Unique: `conversationId + userId`
- Index: `userId`

### `Message`

| Field | Type | Notes |
| --- | --- | --- |
| `conversationId` | `String` | Chat thread. |
| `senderUserId` | `String?` | Null nếu là system hoặc assistant bot. |
| `senderType` | `MessageSenderType` | `USER`, `ASSISTANT`, `SYSTEM`. |
| `messageType` | `MessageType` | Text, image, system event. |
| `body` | `String?` | Optional để hỗ trợ image-only message. |
| `mediaAssetId` | `String?` | Attachment nếu có. |
| `metadata` | `Json?` | Delivery state, AI confidence, tool traces. |

Indexes and constraints:

- Index: `conversationId + createdAt`
- Index: `senderUserId`

## Frontend Mapping Reference

| Frontend type | Prisma model |
| --- | --- |
| `Plant` | `GardenPlant` |
| `CareHistoryEntry` | `CareTask` |
| `JournalEntry` | `PlantJournalEntry` |
| `Reminder` | `CareTask` |
| `FeedPost` | `FeedPost` |
| `MarketListing` | `MarketplaceListing` |
| `ScanRecommendation` | `ScanRecommendation` |
| `ScanAnalysis` | `SpaceScan` |
| `Kit` | `Product` + `ProductComponent` |

## Deferred Decisions

- Chưa tạo bảng auth provider riêng; dùng `externalAuthId` để bridge tạm thời.
- Chưa dùng PostGIS hoặc lat/lng chính xác.
- Chưa chuẩn hóa district/ward thành lookup tables.
- Chưa tách document store cho AI payload.
