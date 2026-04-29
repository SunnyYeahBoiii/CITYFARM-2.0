# Journal Upload -> AI Tool Calling (Task Adjust + Health Support) Implementation Plan

## Overview

Hiện tại hệ thống đã có nền tảng tool-calling cho chat và cơ chế lưu “task add/update/delete history” vào một `PlantJournalEntry` tổng hợp theo ngày (prefix `[TASK_HISTORY_DAILY]` trong `note` và mảng `aiAnalysis.taskHistory`).

Phần còn thiếu theo yêu cầu của bạn là: khi người dùng **upload ảnh journal** (tức tạo nhật ký sức khỏe bằng `POST /garden/:plantId/journal`), hệ thống cần **trigger tool-calling từ journal** để:

1) Tự động tạo/cập nhật/xóa care tasks (cho phép điều chỉnh task).  
2) Gắn hình ảnh đã upload vào “daily task history” (hỗ trợ chăm sóc sức khỏe cho cây dựa trên bằng chứng ảnh).

## Current State Analysis (as-is)

- Upload ảnh journal hiện chỉ gọi:
  - `GardenService.logJournal(...)` để phân tích ảnh (`analyzePlantHealth`) rồi tạo `PlantJournalEntry`.
  - Tham chiếu: `apps/api/src/garden/garden.service.ts:432-510`.
- Luồng tool-calling hiện chạy theo chat:
  - `AppService.processChatRequest()` -> Python model -> tool execution -> second pass final reply.
  - Tham chiếu: `apps/api/src/app.service.ts:379-519`.
- Cơ chế daily task history đã có:
  - `appendTaskHistoryToDailyJournal(...)` tạo/update entry với `note.startsWith('[TASK_HISTORY_DAILY]')` và `aiAnalysis.taskHistory`.
  - Tham chiếu: `apps/api/src/garden/garden.service.ts:667-752`.
- Liên kết ảnh cho daily task history phụ thuộc vào tool payload:
  - Tool `create/update/delete` có `journalImageAssetId` optional và `ToolExecutorService` dùng nó làm `event.imageAssetId`.
  - Tham chiếu:
    - `apps/api/src/ai/tool-definitions.ts:42-46`, `:135-140`, `:156-160`
    - `apps/api/src/ai/tool-executor.service.ts:61-78`, `:305-333`, `:408-424`

## Desired End State

Khi upload journal photo xong:

1. Backend chạy AI tool-calling để tạo/cập nhật/xóa care tasks tương ứng với phân tích sức khỏe.
2. Những mutation task đó được ghi vào `[TASK_HISTORY_DAILY]` entry bằng `aiAnalysis.taskHistory`.
3. `aiAnalysis.taskHistory[].imageAssetId` (và `PlantJournalEntry.imageAssetId` của daily entry) gắn đúng với `imageAssetId` của ảnh journal vừa upload.

## What We’re Not Doing

- Không tạo bảng Prisma riêng cho audit logs.
- Không yêu cầu thay đổi màn hình mới; UI hiện tại sẽ tự refresh danh sách tasks/journal theo `fetchDetail()` sau khi upload.
- Không migrate dữ liệu cũ.

## Phase 1: Trigger tool-calling từ endpoint upload journal

### Changes Required

1. **File**: `apps/api/src/garden/garden.service.ts`
   - Sau khi tạo `PlantJournalEntry` trong `logJournal(...)` (sau transaction tạo entry thành công), gọi orchestration tool-calling cho “journal mode”.
   - Orchestration này cần:
     - truyền `TOOL_DEFINITIONS` cho model,
     - cung cấp “context từ phân tích ảnh” (healthStatus/issueSummary/recommendationSummary/plant info),
     - yêu cầu model ưu tiên `create_care_task` / `update_care_task` / `delete_care_task` để điều chỉnh task.

2. **Parsing tool calls**
   - Backend cần tái sử dụng logic parse tool calls đang có trong `AppService` (hệ thống hiện parse JSON envelope trong `reply`).
   - Nếu không tách được thành helper dùng chung, implement tương đương trong phạm vi journal trigger.

3. **Execution**
   - Thực thi tool calls bằng `ToolExecutorService.execute(toolCall, userId)` để đảm bảo:
     - task mutations đều append vào daily task history,
     - validation quyền sở hữu plant/task được kiểm soát giống chat.

### Success Criteria

- Upload journal ảnh xong sẽ tạo/cập nhật task trong DB (và xuất hiện ở tab “Care” sau `fetchDetail()`).

## Phase 2: Đảm bảo daily task history “dính” đúng ảnh journal vừa upload

### Changes Required

1. **Inject `journalImageAssetId` vào tool call arguments**
   - Khi gọi tool execution cho `create_care_task`, `update_care_task`, `delete_care_task`:
     - đặt `toolCall.arguments.journalImageAssetId = dto.imageAssetId` (image vừa upload) cho tất cả tool call thuộc 3 action trên.
   - Lý do: hiện “image linkage” phụ thuộc tool payload (`event.imageAssetId`), không tự động suy ra từ `PlantJournalEntry` do `appendTaskHistoryToDailyJournal` chỉ đọc image từ event (hoặc daily entry đã có sẵn).

2. **Daily entry update behavior**
   - `appendTaskHistoryToDailyJournal` hiện đã giữ `imageAssetId` theo:
     - `event.imageAssetId ?? existingDailyJournal.imageAssetId`
   - Vì vậy, khi inject từ Phase 2, daily entry sẽ nhận ảnh đúng.

### Success Criteria

- Trong `PlantJournalEntry.note` prefix `[TASK_HISTORY_DAILY]`, `imageAssetId` của daily entry được set đúng.
- `aiAnalysis.taskHistory` chứa event với ảnh liên kết (thể hiện qua `imageAssetId` của daily entry và payload event).

## Phase 3: Nâng rules tool-calling để hỗ trợ “điều chỉnh task” theo nội dung journal

### Changes Required

1. **File**: `apps/model-api/src/main.py`
   - Mở rộng/điều chỉnh block “Tool calling instructions” để:
     - khi xử lý journal upload (photo analysis), model có quy tắc “điều chỉnh task” thay vì chỉ tạo mới.
     - ví dụ:
       - nếu đã có task pending liên quan (ví dụ `PEST_CHECK`), model dùng `update_care_task` để reschedule/đổi title/notes,
       - nếu analysis cho thấy không cần thiết, model dùng `delete_care_task`.

2. **Tránh ghi journal duplicate**
   - Vì `logJournal(...)` đã tạo `PlantJournalEntry`, tool `log_journal_entry` chỉ cần cho các case “journal text” (chat) nếu có.
   - Trong journal upload mode, ưu tiên không gọi `log_journal_entry` để tránh duplicate entries (hoặc chỉ gọi trong trường hợp cần ghi thêm).

### Success Criteria

- Kịch bản pest/warning CRITICAL trên ảnh -> task được tạo hoặc update phù hợp (không tạo trùng khi có task pending cùng logic).

## Phase 4: UX/Contract của endpoint journal upload

### Changes Required

- Endpoint hiện tại `POST /garden/:plantId/journal` trả về `PlantJournalEntry`.
- Xác nhận chiến lược hiển thị:
  - UI hiện gọi `fetchDetail()` sau khi logJournal xong, nên tasks sẽ tự xuất hiện ở tab “Care”.
  - Không cần thêm màn hình mới.
- Nếu cần feedback rõ cho user, có thể cân nhắc trả kèm “tool result summaries” (tùy scope).

## Verification / Testing Strategy

### Automated (khi có thay đổi code)

- `npm run -w apps/api lint`
- `npm run -w apps/api build`

### Manual smoke scenarios

1. Upload ảnh cho thấy deep pest/warning:
   - tạo `PEST_CHECK` hoặc `CUSTOM` task.
   - daily synthetic entry `[TASK_HISTORY_DAILY] ...` được cập nhật `aiAnalysis.taskHistory`.
2. Upload ảnh tiếp theo trong cùng ngày:
   - `appendTaskHistoryToDailyJournal` cộng event vào cùng một daily entry (note prefix giữ nguyên).
3. Khi có task pending sẵn:
   - model/flow dùng `update_care_task` để điều chỉnh (reschedule/notes) thay vì tạo trùng.
4. Khi model quyết định không cần task:
   - `delete_care_task` delete task pending và append `DELETED` vào taskHistory.

## References

- `apps/api/src/garden/garden.service.ts` (`logJournal`, `logJournalEntry`, `appendTaskHistoryToDailyJournal`)
- `apps/api/src/ai/tool-definitions.ts` (các tool + `journalImageAssetId`)
- `apps/api/src/ai/tool-executor.service.ts` (dispatch + append history)
- `apps/api/src/app.service.ts` (parse tool call + orchestration hiện tại cho chat)
- `apps/model-api/src/main.py` (prompt rule tool-calling)
