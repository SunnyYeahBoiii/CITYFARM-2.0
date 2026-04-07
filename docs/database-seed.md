### Summary

  - Dùng seed.sql thuần cho PostgreSQL, dữ liệu deterministic theo kịch bản nghiệp vụ cố
    định để dev có thể reset và nạp lại nhiều lần mà không bị lệch state.
  - Nguồn sự thật cho dữ liệu sẽ bám theo docs/database-schema.md và apps/api/prisma/
    schema.prisma, không lấy frontend mock làm chuẩn chính; frontend mock chỉ được dùng để
    tái sử dụng tone/copy ở những phần phù hợp.
  - Mục tiêu là mọi bảng đều có 20-30 dòng và các quan hệ chính đều có đường liên kết đầy
    đủ: scan -> recommendation -> visualization -> garden plant -> care/journal -> listing
    -> post/chat, và commerce -> order -> order item -> activation code -> garden plant.

  ### Key Changes

  - Thêm apps/api/prisma/seed.sql với cấu trúc:
      - BEGIN
      - TRUNCATE ... CASCADE theo chế độ dev-only để script có thể chạy lặp lại
      - INSERT theo thứ tự phụ thuộc khóa ngoại
      - COMMIT
  - Thêm script chạy seed trong apps/api/package.json, ưu tiên một lệnh kiểu psql
    "$DATABASE_URL" -f prisma/seed.sql để không phụ thuộc Prisma seed runtime hiện chưa được
    cấu hình.
  - Dùng ID, slug, SKU, order code, activation code cố định để dữ liệu stable và dễ debug
    giữa frontend, API và test.

  ### Data Shape

  - Identity:
      - User 24 dòng, chia vai trò chủ yếu USER, có một ít SUPPLIER, EXPERT, ADMIN.
      - UserProfile 24 dòng, phủ 5-6 quận tại HCMC; khoảng 8 profile VERIFIED.
      - MediaAsset 30 dòng, tái sử dụng cho avatar, scan, visualization, journal, listing,
        post, product, message.
  - Plant catalog / commerce:
      - PlantSpecies 24 dòng, tập trung nhóm rau ăn lá, cà chua, ớt, dưa leo, thảo mộc phù
        hợp HCMC.
      - PlantCareProfile 24 dòng, 1:1 với species.
      - Product 24 dòng: 6 kit, 8 seed, 4 soil, 4 pot, 2 sensor/add-on.
      - ProductComponent 24 dòng, chủ yếu gắn vào kit và tham chiếu sang seed/soil/pot/
        sensor.
      - Order 20 dòng, nhiều trạng thái từ PENDING_CONFIRMATION tới COMPLETED.
      - OrderItem 24 dòng, phần lớn gắn kit; một số gắn seed/soil/pot.
      - KitActivationCode 24 dòng, khoảng 18 code đã redeem để sinh cây, còn lại chưa redeem
        hoặc sắp hết hạn.
  - Scan / garden tracking:
      - SpaceScan 24 dòng, đa số ANALYZED, một ít FAILED.
      - ScanRecommendation 24 dòng, phân bổ cho 8 scan đã phân tích sâu, mỗi scan 3
        recommendation với rank duy nhất.
      - ScanVisualization 24 dòng, mỗi scan có 1 output; một số scan có OVERLAY, một số
        GENERATIVE.
      - GardenPlant 24 dòng, lấy từ 3 nguồn: redeem code, từ scan, và nhập trực tiếp; ưu
        tiên ACTIVE, có vài bản ghi HARVEST_READY, HARVESTED, FAILED.
      - CareSchedule 24 dòng, mỗi cây 1 lịch chính.
      - CareTask 24 dòng, bám theo schedule; có PENDING, COMPLETED, OVERDUE.
      - PlantJournalEntry 24 dòng, đủ để phản ánh tình trạng sức khỏe và cập nhật
        lastJournaledAt.
  - Community / marketplace:
      - MarketplaceListing 20 dòng, chỉ dùng GardenPlant thật và seller có profile phù hợp;
        snapshot verification phải khớp với profile/garden plant.
      - FeedPost 24 dòng, trộn PLANT_SHARE, SHOWCASE, QUESTION, MARKETPLACE_SHARE,
        HARVEST_UPDATE.
      - FeedComment 24 dòng, có cả comment gốc và reply.
      - PostReaction 24 dòng, đảm bảo unique (postId, userId).
      - Conversation 20 dòng, mix giữa MARKETPLACE và AI_ASSISTANT.
      - ConversationParticipant 24 dòng, giữ trong giới hạn 20-30 bằng cách cho phần lớn AI
        conversation có 1 user và một số marketplace conversation có 2 user.
      - Message 24 dòng, gồm USER, ASSISTANT, SYSTEM; marketplace message phải bám
        conversation của listing thật.

  ### Implementation Rules

  - Insert theo thứ tự: User -> MediaAsset -> UserProfile -> PlantSpecies ->
    PlantCareProfile -> Product -> ProductComponent -> Order -> OrderItem ->
    KitActivationCode -> SpaceScan -> ScanRecommendation -> ScanVisualization -> GardenPlant
    -> CareSchedule -> CareTask -> PlantJournalEntry -> MarketplaceListing -> FeedPost ->
    FeedComment -> PostReaction -> Conversation -> ConversationParticipant -> Message.
  - Mọi trường enum phải có phân bố thực tế, không dồn toàn bộ về default.
  - Các cột Json sẽ chứa payload nhỏ nhưng hữu ích cho dev: recommendation rationale, scan
    zone analysis, task metadata, AI journal analysis, conversation assistant context.
  - Các timestamp phải kể được câu chuyện hợp lý: order xảy ra trước activation, activation
    trước plantedAt, plantedAt trước journal/task, verified grower trước listing publish,
    post/chat sau listing hoặc sau nhật ký cây.
  - Các trường cache/derived phải đồng bộ: UserProfile.growerVerificationStatus,
    GardenPlant.verifiedForMarketplaceAt, MarketplaceListing.verificationStatus,
    verificationSnapshot, documentedDays.

  ### Test Plan

  - Chạy schema validation và migrate trước khi seed; sau đó chạy seed.sql trên DB dev trống
    và DB đã seed một lần để xác nhận script lặp lại ổn định.
  - Kiểm tra đếm dòng từng bảng đều nằm trong khoảng 20-30.
  - Kiểm tra foreign key integrity bằng các truy vấn spot-check:
      - listing luôn trỏ tới GardenPlant có thật
      - reaction không vi phạm unique (postId, userId)
      - activation code đã redeem chỉ gắn tối đa một GardenPlant
      - từ 1 order completed truy ra order item -> activation code -> garden plant
      - từ 1 analyzed scan truy ra recommendation -> visualization -> spawned plant
      - từ 1 verified seller truy ra profile -> garden plant -> listing -> feed post ->
  - Không thêm model mới; chỉ seed đúng schema hiện tại.