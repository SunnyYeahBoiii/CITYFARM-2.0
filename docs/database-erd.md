# CITYFARM 2.0 Database ERD

Tài liệu này mô tả ERD hiện tại của database CITYFARM 2.0 để có thể prompt sang công cụ vẽ diagram. Source of truth là Prisma schema hiện tại.

## Copy Prompt Để Vẽ ERD

```text
Vẽ ERD cho database CITYFARM 2.0 dựa trên mô tả as-is dưới đây.

Yêu cầu diagram:
- Nhóm bảng theo domain: Identity/Assets, Catalog/Commerce, Scan/AI, Garden Tracking, Community/Marketplace/Chat.
- Hiển thị cardinality bằng crow's foot.
- Hiển thị PK, unique key quan trọng, FK, status enum quan trọng.
- Nhấn mạnh rằng binary file không lưu trong DB; bảng MediaAsset chỉ lưu metadata trỏ sang Supabase Storage.
- Source of truth là apps/api/prisma/schema.prisma, có 26 models và 21 enums.

Lưu ý consistency:
- README/docs cũ có chỗ nói 24 models, nhưng schema.prisma hiện có 26 models.
- apps/api/database/schema.sql có thể lag so với Prisma schema; schema.prisma là canonical.
- Không thấy thư mục apps/api/prisma/migrations trong repo hiện tại.

Bảng/domain:
Identity/Assets:
- User(id PK, email UK, externalAuthId UK, role, passwordHash, refreshTokenHash, createdAt, updatedAt)
- UserProfile(id PK, userId UK FK, displayName, city, district, ward, growerVerificationStatus, avatarAssetId UK FK)
- MediaAsset(id PK, ownerId FK nullable, kind, storageBucket, storageKey UK, publicUrl, mimeType, sizeBytes, metadata)

Catalog/Commerce:
- PlantSpecies(id PK, slug UK, commonName, scientificName, difficulty, lightRequirement, imageAssetId FK nullable)
- PlantCareProfile(id PK, plantSpeciesId UK FK)
- Product(id PK, sku UK, slug UK, type, priceAmount, isActive, plantSpeciesId FK nullable, coverAssetId FK nullable)
- ProductComponent(id PK, productId FK, componentProductId FK nullable, componentName, quantity)
- Cart(id PK, userId UK FK, status, createdAt, updatedAt)
- CartItem(id PK, cartId FK, productId FK, selectedComponentId nullable, quantity, unique cartId+productId+selectedComponentId)
- Order(id PK, orderCode UK, buyerId FK, status, paymentMethod, totalAmount, shipping fields)
- OrderItem(id PK, orderId FK, productId FK, quantity, unitPriceAmount, totalPriceAmount)
- KitActivationCode(id PK, code UK, orderItemId FK, productId FK, redeemedAt nullable)

Scan/AI:
- SpaceScan(id PK, userId FK, sourceAssetId FK nullable, status, rawAnalysis Json, detectedZones Json, lightLevel, availableAreaSqm)
- ScanRecommendation(id PK, scanId FK, plantSpeciesId FK, rank, score, unique scanId+rank and scanId+plantSpeciesId)
- ScanVisualization(id PK, scanId FK, type, sourceAssetId FK nullable, outputAssetId FK nullable, prompt, metadata)

Garden Tracking:
- GardenPlant(id PK, userId FK, plantSpeciesId FK, activationCodeId UK nullable, sourceScanId FK nullable, status, growthStage, healthStatus)
- CareSchedule(id PK, gardenPlantId FK, taskType, intervalDays, isActive)
- CareTask(id PK, gardenPlantId FK, scheduleId FK nullable, taskType, status, dueAt, completedAt, createdBy nullable)
- PlantJournalEntry(id PK, gardenPlantId FK, imageAssetId FK nullable, capturedAt, healthStatus, aiAnalysis Json)

Community/Marketplace/Chat:
- FeedPost(id PK, userId FK, gardenPlantId FK nullable, listingId FK nullable, postType, imageAssetId FK nullable, content, isPublished)
- FeedComment(id PK, postId FK, userId FK, parentCommentId FK nullable, content)
- PostReaction(id PK, postId FK, userId FK, reactionType, unique postId+userId)
- MarketplaceListing(id PK, sellerId FK, gardenPlantId FK, imageAssetId FK nullable, status, verificationStatus, pickup location, price)
- Conversation(id PK, type, listingId FK nullable, createdAt)
- ConversationParticipant(id PK, conversationId FK, userId FK, unique conversationId+userId)
- Message(id PK, conversationId FK, senderUserId FK nullable, senderType, messageType, mediaAssetId FK nullable, content)

Relationships:
- User 1--0..1 UserProfile
- User 1--many MediaAsset, GardenPlant, Order, FeedPost, FeedComment, PostReaction, MarketplaceListing, SpaceScan, ConversationParticipant, Message
- User 1--0..1 Cart
- MediaAsset 1--many references from Product cover, PlantSpecies image, FeedPost image, MarketplaceListing image, PlantJournalEntry image, Message attachment, SpaceScan source image, ScanVisualization source/output, UserProfile avatar
- PlantSpecies 1--0..1 PlantCareProfile
- PlantSpecies 1--many Product, GardenPlant, ScanRecommendation
- Product self many-to-many through ProductComponent for kit composition
- Product 1--many CartItem, OrderItem, KitActivationCode
- Cart 1--many CartItem
- Order 1--many OrderItem
- OrderItem 1--many KitActivationCode
- KitActivationCode 1--0..1 GardenPlant
- SpaceScan 1--many ScanRecommendation, ScanVisualization, GardenPlant
- GardenPlant 1--many CareSchedule, CareTask, PlantJournalEntry, FeedPost, MarketplaceListing
- CareSchedule 1--many CareTask
- FeedPost 1--many FeedComment, PostReaction
- FeedComment self 1--many replies
- MarketplaceListing 1--many FeedPost and Conversation
- Conversation 1--many ConversationParticipant and Message
```

## Mermaid ERD Khởi Đầu

```mermaid
erDiagram
  User {
    String id PK
    String email UK
    String externalAuthId UK
    UserRole role
    String passwordHash
    String refreshTokenHash
    DateTime createdAt
    DateTime updatedAt
  }

  UserProfile {
    String id PK
    String userId UK_FK
    String displayName
    String city
    String district
    String ward
    VerificationStatus growerVerificationStatus
    String avatarAssetId UK_FK
  }

  MediaAsset {
    String id PK
    String ownerId FK
    MediaKind kind
    String storageBucket
    String storageKey UK
    String publicUrl
    String mimeType
    Int sizeBytes
    Json metadata
  }

  PlantSpecies {
    String id PK
    String slug UK
    String commonName
    String scientificName
    PlantDifficulty difficulty
    LightLevel lightRequirement
    String imageAssetId FK
  }

  PlantCareProfile {
    String id PK
    String plantSpeciesId UK_FK
    Json commonPests
    Json growthTimeline
  }

  Product {
    String id PK
    String sku UK
    String slug UK
    ProductType type
    Int priceAmount
    Boolean isActive
    String plantSpeciesId FK
    String coverAssetId FK
  }

  ProductComponent {
    String id PK
    String productId FK
    String componentProductId FK
    String componentName
    Int quantity
  }

  Cart {
    String id PK
    String userId UK_FK
    String status
  }

  CartItem {
    String id PK
    String cartId FK
    String productId FK
    String selectedComponentId
    Int quantity
  }

  Order {
    String id PK
    String orderCode UK
    String buyerId FK
    OrderStatus status
    PaymentMethod paymentMethod
    Int totalAmount
  }

  OrderItem {
    String id PK
    String orderId FK
    String productId FK
    Int quantity
    Int unitPriceAmount
    Int totalPriceAmount
  }

  KitActivationCode {
    String id PK
    String code UK
    String orderItemId FK
    String productId FK
    DateTime redeemedAt
  }

  SpaceScan {
    String id PK
    String userId FK
    String sourceAssetId FK
    ScanStatus status
    Json rawAnalysis
    Json detectedZones
    LightLevel lightLevel
  }

  ScanRecommendation {
    String id PK
    String scanId FK
    String plantSpeciesId FK
    Int rank
    Float score
  }

  ScanVisualization {
    String id PK
    String scanId FK
    VisualizationType type
    String sourceAssetId FK
    String outputAssetId FK
    Json metadata
  }

  GardenPlant {
    String id PK
    String userId FK
    String plantSpeciesId FK
    String activationCodeId UK_FK
    String sourceScanId FK
    GardenPlantStatus status
    PlantGrowthStage growthStage
    PlantHealthStatus healthStatus
  }

  CareSchedule {
    String id PK
    String gardenPlantId FK
    CareTaskType taskType
    Int intervalDays
    Boolean isActive
  }

  CareTask {
    String id PK
    String gardenPlantId FK
    String scheduleId FK
    CareTaskType taskType
    CareTaskStatus status
    DateTime dueAt
    String createdBy
  }

  PlantJournalEntry {
    String id PK
    String gardenPlantId FK
    String imageAssetId FK
    DateTime capturedAt
    PlantHealthStatus healthStatus
    Json aiAnalysis
  }

  FeedPost {
    String id PK
    String userId FK
    String gardenPlantId FK
    String listingId FK
    PostType postType
    String imageAssetId FK
    Boolean isPublished
  }

  FeedComment {
    String id PK
    String postId FK
    String userId FK
    String parentCommentId FK
  }

  PostReaction {
    String id PK
    String postId FK
    String userId FK
    ReactionType reactionType
  }

  MarketplaceListing {
    String id PK
    String sellerId FK
    String gardenPlantId FK
    String imageAssetId FK
    ListingStatus status
    VerificationStatus verificationStatus
    Int priceAmount
  }

  Conversation {
    String id PK
    ConversationType type
    String listingId FK
  }

  ConversationParticipant {
    String id PK
    String conversationId FK
    String userId FK
  }

  Message {
    String id PK
    String conversationId FK
    String senderUserId FK
    MessageSenderType senderType
    MessageType messageType
    String mediaAssetId FK
  }

  User ||--o| UserProfile : has
  User ||--o{ MediaAsset : owns
  User ||--o{ GardenPlant : grows
  User ||--o{ Order : buys
  User ||--o| Cart : has
  User ||--o{ FeedPost : writes
  User ||--o{ FeedComment : comments
  User ||--o{ PostReaction : reacts
  User ||--o{ MarketplaceListing : sells
  User ||--o{ SpaceScan : runs
  User ||--o{ ConversationParticipant : joins
  User ||--o{ Message : sends

  MediaAsset ||--o| UserProfile : avatar
  MediaAsset ||--o{ Product : product_image
  MediaAsset ||--o{ PlantSpecies : species_image
  MediaAsset ||--o{ FeedPost : post_image
  MediaAsset ||--o{ MarketplaceListing : listing_image
  MediaAsset ||--o{ PlantJournalEntry : journal_image
  MediaAsset ||--o{ Message : attachment
  MediaAsset ||--o{ SpaceScan : source_image
  MediaAsset ||--o{ ScanVisualization : source_or_output

  PlantSpecies ||--o| PlantCareProfile : care_profile
  PlantSpecies ||--o{ Product : catalog_products
  PlantSpecies ||--o{ GardenPlant : planted_as
  PlantSpecies ||--o{ ScanRecommendation : recommended

  Product ||--o{ ProductComponent : parent_kit
  Product ||--o{ ProductComponent : component_product
  Product ||--o{ CartItem : in_cart
  Product ||--o{ OrderItem : ordered
  Product ||--o{ KitActivationCode : activates

  Cart ||--o{ CartItem : contains
  Order ||--o{ OrderItem : contains
  OrderItem ||--o{ KitActivationCode : issues
  KitActivationCode ||--o| GardenPlant : redeems_to

  SpaceScan ||--o{ ScanRecommendation : produces
  SpaceScan ||--o{ ScanVisualization : produces
  SpaceScan ||--o{ GardenPlant : spawns

  GardenPlant ||--o{ CareSchedule : schedules
  GardenPlant ||--o{ CareTask : tasks
  CareSchedule ||--o{ CareTask : generates
  GardenPlant ||--o{ PlantJournalEntry : journals
  GardenPlant ||--o{ FeedPost : shared_posts
  GardenPlant ||--o{ MarketplaceListing : listings

  FeedPost ||--o{ FeedComment : comments
  FeedComment ||--o{ FeedComment : replies
  FeedPost ||--o{ PostReaction : reactions
  MarketplaceListing ||--o{ FeedPost : shared_in_feed
  MarketplaceListing ||--o{ Conversation : listing_chat

  Conversation ||--o{ ConversationParticipant : participants
  Conversation ||--o{ Message : messages
```

## Enums Quan Trọng

Prisma schema định nghĩa 21 enums:

- Identity: `UserRole`, `VerificationStatus`
- Plant/garden: `PlantDifficulty`, `LightLevel`, `PlantHealthStatus`, `GardenPlantStatus`, `PlantGrowthStage`, `CareTaskType`, `CareTaskStatus`
- Commerce: `ProductType`, `OrderStatus`, `PaymentMethod`
- Scan/media: `ScanStatus`, `VisualizationType`, `MediaKind`
- Community/chat: `PostType`, `ReactionType`, `ListingStatus`, `ConversationType`, `MessageSenderType`, `MessageType`

## Ghi Chú Thiết Kế Dữ Liệu

- PostgreSQL là source of truth hiện tại.
- Prisma `schema.prisma` là canonical schema.
- Ảnh/file không lưu binary trong DB; `MediaAsset` lưu `storageBucket`, `storageKey`, `publicUrl`, metadata và FK owner.
- Các payload AI chưa ổn định dùng `Json`: scan raw analysis, detected zones, journal AI analysis, visualization metadata.
- Tiền lưu bằng `Int` theo đơn vị VND.
- Location hiện lưu text `city/district/ward`, chưa dùng PostGIS.
- `KitActivationCode` chỉ redeem một lần thông qua unique `GardenPlant.activationCodeId`.
- `MarketplaceListing` gắn với `GardenPlant` để truy xuất nguồn gốc và verification.

## Nguồn Tham Chiếu Chính

- `apps/api/prisma/schema.prisma`: 26 models, 21 enums.
- `docs/database-schema.md`: domain modules và business flows.
- `docs/database-data-dictionary.md`: data dictionary hiện có.
- `apps/api/src/prisma/prisma.service.ts`: Prisma connects to Postgres via `DATABASE_URL`.
- `apps/api/src/assets/supabase-storage.service.ts`: object storage dependency.
- `apps/api/src/garden/garden.service.ts`: activation, care schedule/task, journal.
- `apps/api/src/order/order.service.ts`: order, order items, activation code generation.
- `apps/api/src/community/community.service.ts`: feed/marketplace DB access.
- `apps/api/src/app.service.ts`: chat conversations/messages and scan orchestration.
