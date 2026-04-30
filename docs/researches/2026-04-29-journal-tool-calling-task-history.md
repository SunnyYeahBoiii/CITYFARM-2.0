# Research: Journal + Tool Calling Task History

Date: 2026-04-29

## Research Question

Hiện tại CITYFARM “journal” và “AI tool-calling” đang hoạt động thế nào, và “lịch sử thêm/cập nhật/xóa task” đang được gắn vào “daily journal entry” theo cách nào (kể cả khi có ảnh upload).

## Current Implementation Map (as of today)

### 1. AI tool schemas (NestJS -> Model API)

- Tool metadata được khai báo trong `apps/api/src/ai/tool-definitions.ts`.
- Các tool liên quan đến journal/task hiện có:
  - `create_care_task`
  - `log_journal_entry`
  - `get_pending_tasks`
  - `update_care_task`
  - `delete_care_task`
- Điểm quan trọng để “gắn ảnh” vào task-history:
  - `create_care_task`, `update_care_task`, `delete_care_task` có trường optional `journalImageAssetId` trong `parameters`.
  - `log_journal_entry` có optional `imageAssetId`.
  - Tham chiếu: `apps/api/src/ai/tool-definitions.ts:1-165`.

### 2. Tool execution dispatcher (Model API -> NestJS -> DB)

- Tool execution được thực hiện ở `apps/api/src/ai/tool-executor.service.ts`.
- `execute()` dispatch theo `toolCall.name`:
  - `create_care_task` -> `executeCreateTask`
  - `log_journal_entry` -> `executeLogJournal`
  - `get_pending_tasks` -> `executeGetPendingTasks`
  - `update_care_task` -> `executeUpdateTask`
  - `delete_care_task` -> `executeDeleteTask`
  - Tham chiếu: `apps/api/src/ai/tool-executor.service.ts:13-448`.

#### 2.1 create/update/delete task đều append vào “daily task history”

- Trong `executeCreateTask`, sau khi tạo `CareTask` qua `gardenService.createCareTask(...)`, hệ thống gọi:
  - `gardenService.appendTaskHistoryToDailyJournal(userId, plantId, event)`
  - Event có `action: 'CREATED'`, `taskId`, `title`, `taskType`, `changes`, và `imageAssetId` lấy từ tool param `journalImageAssetId` nếu có.
  - Tham chiếu: `apps/api/src/ai/tool-executor.service.ts:34-103`.

- Trong `executeUpdateTask`, hệ thống:
  - validate task tồn tại và thuộc user,
  - chỉ cho phép update khi `status === 'PENDING'`,
  - update `CareTask`,
  - rồi gọi `appendTaskHistoryToDailyJournal(...)` với `action: 'UPDATED'` và `changes.before/after`.
  - Event `imageAssetId` cũng được lấy từ `journalImageAssetId` nếu có.
  - Tham chiếu: `apps/api/src/ai/tool-executor.service.ts:220-357`.

- Trong `executeDeleteTask`, hệ thống:
  - validate task tồn tại/thuộc user,
  - chỉ cho phép delete khi `status === 'PENDING'`,
  - delete `CareTask`,
  - rồi gọi `appendTaskHistoryToDailyJournal(...)` với `action: 'DELETED'`.
  - Event `imageAssetId` cũng được lấy từ `journalImageAssetId` nếu có.
  - Tham chiếu: `apps/api/src/ai/tool-executor.service.ts:359-447`.

#### 2.2 log_journal_entry tạo PlantJournalEntry “nhẹ”

- `executeLogJournal` gọi `gardenService.logJournalEntry(userId, plantId, dto)` với:
  - `note`, `healthStatus`, `issueSummary`, optional `imageAssetId`
  - Tham chiếu: `apps/api/src/ai/tool-executor.service.ts:105-153`.

### 3. Daily task history được lưu vào PlantJournalEntry bằng aiAnalysis JSON

- Cơ chế append được định nghĩa trong `GardenService.appendTaskHistoryToDailyJournal(...)`:
  - Xác định “dayKey”/timezone Asia/Ho_Chi_Minh.
  - Tìm một `PlantJournalEntry` sẵn cho ngày đó bằng query:
    - `note.startsWith: '[TASK_HISTORY_DAILY]'`
  - Nếu có entry:
    - đọc `aiAnalysis.taskHistory` (nếu `aiAnalysis` là object và `taskHistory` là array),
    - append event vào `nextHistory`,
    - update entry:
      - `note` được set về dạng: `[TASK_HISTORY_DAILY] Cập nhật lịch sử task ngày ${dailyLabel}`,
      - `imageAssetId` được set theo: `event.imageAssetId ?? existingDailyJournal.imageAssetId`,
      - `aiAnalysis` được set về `{ day: dayKey, taskHistory: nextHistory }`.
  - Nếu chưa có entry:
    - tạo entry mới với:
      - `note` dạng `[TASK_HISTORY_DAILY] ...`,
      - `healthStatus: plant.healthStatus`,
      - `imageAssetId: event.imageAssetId`,
      - `aiAnalysis: { day: dayKey, taskHistory }`.
  - Tham chiếu: `apps/api/src/garden/garden.service.ts:29-38` (type), `:667-752` (append logic).

### 4. Luồng “upload ảnh journal” (không đi qua tool-calling)

- Endpoint journal upload nằm trong `apps/api/src/garden/garden.controller.ts`:
  - `POST /garden/:plantId/journal` -> `gardenService.logJournal(...)`
  - Tham chiếu: `apps/api/src/garden/garden.controller.ts:69-76`.

- `GardenService.logJournal(...)`:
  - validate `plant` thuộc user (findFirst by `id, userId`)
  - validate `dto.imageAssetId` bằng cách kiểm tra `MediaAsset`:
    - `ownerId: userId`
    - `kind: 'GARDEN_JOURNAL'`
  - nếu có image:
    - gọi `modelApiService.analyzePlantHealth(...)` để lấy health analysis,
    - tạo `PlantJournalEntry` với:
      - `capturedAt`, `note` (từ `dto.note`), `healthStatus`, `leafColorNote`, `issueSummary`, `recommendationSummary`,
      - `aiAnalysis` (JSON raw từ phân tích),
      - `imageAssetId: dto.imageAssetId`.
  - update `gardenPlant.lastJournaledAt` và `healthStatus` theo kết quả cuối cùng (dto hoặc aiData),
  - Tham chiếu: `apps/api/src/garden/garden.service.ts:432-510`.

- `PlantJournalEntry` model (Prisma) có các field liên quan:
  - `imageAssetId`, `note`, `healthStatus`, `leafColorNote`, `issueSummary`, `recommendationSummary`, `aiAnalysis`
  - Tham chiếu: `apps/api/prisma/schema.prisma:406-423`.

### 5. Luồng chat -> tool-calling (tool-based nhật ký & task)

- `AppController` expose `POST /api/chat` -> `AppService.handleChatRequest` -> `processChatRequest(...)` khi có `plantId`.
  - Tham chiếu:
    - `apps/api/src/app.controller.ts:33-65`,
    - `apps/api/src/app.service.ts:228-559` (main orchestration).

- `AppService.processChatRequest(...)`:
  - build `ragContext` từ DB (currentPlant, recent journal entries, pending tasks),
  - gọi `modelApiService.getChatAdvice(..., TOOL_DEFINITIONS)`,
  - parse tool calls từ:
    - `aiResponse.tool_calls` (nếu tồn tại), hoặc
    - JSON envelope trong `aiResponse.reply` (via `extractJsonObjectFromText`)
  - execute tool calls bằng `ToolExecutorService.execute(toolCall, userId)`,
  - gửi `tool_results` sang model API bằng second call để lấy `finalResponse` dạng plain text.
  - Tham chiếu: `apps/api/src/app.service.ts:128-184` (parse), `:379-519` (tool loop), `:521-559` (save messages + return).

- Python model API (`apps/model-api/src/main.py`) hiện dùng prompt rule để hướng model output:
  - “Nếu cần gọi tool, trả về DUY NHẤT JSON object” với `type: 'tool_call'` và `tool_calls:[...]`
  - “Sau khi nhận tool_results, chỉ trả về final plain-text answer”.
  - Tham chiếu: `apps/model-api/src/main.py:161-219`, và phần attach tool_results vào prompt input: `:272-299`.

### 6. Quan hệ “uploaded image” -> “task history daily entry” hiện phụ thuộc vào tool-call payload

- Khi tạo/cập nhật/xóa task thông qua tool:
  - `journalImageAssetId` (optional) được khai báo ở tool schema (`tool-definitions`).
  - `ToolExecutorService` dùng `journalImageAssetId` để điền `event.imageAssetId` khi gọi `appendTaskHistoryToDailyJournal(...)`.
  - Daily synthetic entry sẽ được set `imageAssetId` theo `event.imageAssetId ?? existingDailyJournal.imageAssetId`.
  - Tham chiếu:
    - `apps/api/src/ai/tool-definitions.ts:42-46`, `:135-140`, `:156-160`,
    - `apps/api/src/ai/tool-executor.service.ts:61-78`, `:305-333`, `:408-424`,
    - `apps/api/src/garden/garden.service.ts:724-736`.

- Trong khi đó, frontend upload journal ảnh hiện tạo `PlantJournalEntry` bằng endpoint journal upload và chỉ truyền `imageAssetId` (không trigger tool-calling):
  - Tham chiếu UI:
    - `apps/web/components/cityfarm/features/PlantDetailScreen.tsx:348-356` (uploadAsset(kind="GARDEN_JOURNAL") -> gardenApi.logJournal(... { imageAssetId }))
  - Vì `appendTaskHistoryToDailyJournal(...)` chỉ liên kết ảnh khi `event.imageAssetId` có giá trị (từ tool param `journalImageAssetId`) hoặc synthetic daily entry đã có image trước đó, nên hiện tại “uploaded journal image” không tự động trở thành ảnh liên kết cho daily task history *trừ khi* tool-call payload có `journalImageAssetId` hoặc daily synthetic entry đã từng nhận `imageAssetId`.

## Key File References

- `apps/api/src/ai/tool-definitions.ts` (`create_care_task`/`update_care_task`/`delete_care_task` có `journalImageAssetId`)  
- `apps/api/src/ai/tool-executor.service.ts` (dispatch + tạo/append daily task history)
- `apps/api/src/garden/garden.service.ts` (`logJournal`, `logJournalEntry`, `appendTaskHistoryToDailyJournal`)
- `apps/api/src/app.service.ts` (parse tool calls + tool loop)
- `apps/model-api/src/main.py` (prompt rule cho tool-calling)
- `apps/api/prisma/schema.prisma` (`PlantJournalEntry`, `CareTask`, enum `PlantHealthStatus`)
- `apps/web/components/cityfarm/features/PlantDetailScreen.tsx` (upload ảnh journal + gọi `logJournal`)
