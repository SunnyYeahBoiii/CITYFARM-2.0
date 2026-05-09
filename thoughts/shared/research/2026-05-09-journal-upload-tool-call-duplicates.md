---
date: 2026-05-09T11:16:24+07:00
researcher: Codex
git_commit: f5e32c83a8d8f986c94f2d8f9c3c4350963a8992
branch: main
repository: CITYFARM-2.0
topic: "Journal image upload tool calling duplicate execution"
tags: [research, codebase, journal, tool-calling, webapp]
status: complete
last_updated: 2026-05-09
last_updated_by: Codex
last_updated_note: "Added follow-up research for merging task-history tool calls into the uploaded journal card"
---

# Research: Journal image upload tool calling duplicate execution

**Date**: 2026-05-09T11:16:24+07:00
**Researcher**: Codex
**Git Commit**: f5e32c83a8d8f986c94f2d8f9c3c4350963a8992
**Branch**: main
**Repository**: CITYFARM-2.0

## Research Question

Deep research the current webapp journal image upload tool-calling flow and fix a bug where daily image upload duplicates because tool calls are executed multiple times.

## Summary

The journal image upload flow starts in the web plant detail screen, uploads a `GARDEN_JOURNAL` media asset, posts that asset ID to the Nest garden journal endpoint, persists a `PlantJournalEntry`, then runs journal-upload tool calling to adjust pending care tasks and append task history to the daily journal.

The duplicate bug was reproduced with a unit test where the model returned two identical `create_care_task` tool calls with different tool call IDs. Before the fix, `AppService.processJournalUploadToolCalling()` filtered relevant task tools and executed all of them, so the same semantic tool action could run twice and append duplicate daily task history.

The fix adds semantic dedupe for journal-upload tool calls before execution and adds an in-flight guard in the web image upload handler so one UI selection cannot start multiple concurrent uploads.

## Detailed Findings

### Web journal upload path

- `apps/web/app/(detail)/garden/[plantId]/page.tsx` renders `PlantDetailScreen` for a plant detail route.
- `apps/web/components/cityfarm/features/PlantDetailScreen.tsx:349` handles selected files. It uploads via `uploadAsset(file, "GARDEN_JOURNAL")`, calls `gardenApi.logJournal(plantId, { imageAssetId: asset.id })`, refetches detail, and switches to the `Journal` tab.
- `apps/web/components/cityfarm/shared/ImageCaptureActions.tsx` owns the camera/gallery selection UI and calls its `onSelect(file, source)` callback for gallery and camera-confirmed files.
- `apps/web/lib/api/assets.api.ts:10` posts `FormData` to `/assets/upload`.
- `apps/web/lib/api/garden.api.ts:37` posts the journal payload to `/garden/:plantId/journal`.

### Backend journal upload path

- `apps/api/src/assets/assets.controller.ts:19` handles `POST /assets/upload`.
- `apps/api/src/assets/assets.service.ts:12` uploads the file to Supabase storage and creates `MediaAsset`.
- `apps/api/src/garden/garden.controller.ts:69` handles `POST /garden/:plantId/journal`.
- `apps/api/src/garden/garden.service.ts:432` validates the plant and journal image asset, analyzes the image if present, creates `PlantJournalEntry`, and updates plant journal/health fields.
- `apps/api/src/garden/garden.controller.ts:79` calls `AppService.processJournalUploadToolCalling()` after the journal entry is committed.

### Journal-upload tool calling

- `apps/api/src/app.service.ts:710` sends `mode: 'journal_upload'`, `journalImageAssetId`, plant context, pending tasks, and `TOOL_DEFINITIONS` to the model API.
- `apps/api/src/app.service.ts:720` parses tool calls from the model response.
- `apps/api/src/app.service.ts:721` now deduplicates task mutation tool calls before execution.
- `apps/api/src/app.service.ts:729` executes relevant calls with `ToolExecutorService.execute()`.
- `apps/api/src/ai/tool-definitions.ts` defines `create_care_task`, `update_care_task`, and `delete_care_task`, each with optional `journalImageAssetId`.
- `apps/api/src/ai/tool-executor.service.ts` dispatches tool calls and appends task history to the daily journal after create/update/delete actions.
- `apps/api/src/garden/garden.service.ts:667` stores daily task history in a synthetic `PlantJournalEntry` whose note starts with `[TASK_HISTORY_DAILY]` and whose `aiAnalysis.taskHistory` array receives appended events.

### Duplicate fix

- `apps/api/src/ai/journal-tool-call-dedupe.ts:1` defines the journal-upload tool call shape.
- `apps/api/src/ai/journal-tool-call-dedupe.ts:6` builds a dedupe key from tool name plus sorted arguments, excluding `journalImageAssetId` because the orchestration layer injects it.
- `apps/api/src/ai/journal-tool-call-dedupe.ts:16` keeps the first matching semantic tool call and filters later duplicates.
- `apps/api/src/app.service.ts:721` applies this dedupe only to the journal-upload task mutation tools.
- `apps/web/components/cityfarm/features/PlantDetailScreen.tsx:331` stores an in-flight upload ref.
- `apps/web/components/cityfarm/features/PlantDetailScreen.tsx:349` returns early when a photo upload is already in progress, then resets the ref in `finally`.

### Regression coverage

- `apps/api/src/app.service.spec.ts:202` stubs two identical `create_care_task` journal-upload tool calls with different IDs.
- `apps/api/src/app.service.spec.ts:282` asserts `toolExecutorService.execute` is called once.
- `apps/api/src/app.service.spec.ts:283` asserts the surviving call still receives the injected `journalImageAssetId`.

## Code References

- `apps/web/components/cityfarm/features/PlantDetailScreen.tsx:349` - upload photo handler and UI in-flight guard.
- `apps/api/src/app.service.ts:720` - parse and dedupe journal-upload task tool calls.
- `apps/api/src/ai/journal-tool-call-dedupe.ts:16` - semantic dedupe implementation.
- `apps/api/src/app.service.spec.ts:202` - duplicate model tool-call regression test.
- `apps/api/src/ai/tool-executor.service.ts:34` - create task execution and task-history append path.
- `apps/api/src/garden/garden.service.ts:667` - daily task history persistence in `PlantJournalEntry.aiAnalysis`.

## Architecture Documentation

The current journal image path is a direct web-to-Nest API flow. It does not use a Next.js server action. The journal row and daily task history are separate `PlantJournalEntry` concepts: the uploaded photo creates a normal journal entry, while task mutations append to or create a synthetic `[TASK_HISTORY_DAILY]` journal entry. The journal-upload orchestration links these through `journalImageAssetId`.

There is no persisted `ToolCall` table. Tool-call effects persist through `CareTask`, `PlantJournalEntry.aiAnalysis.taskHistory`, normal journal rows, and chat `Message` rows.

## Historical Context

- `docs/researches/2026-04-29-journal-tool-calling-task-history.md` documents the earlier journal/tool-calling task history map and the relationship between uploaded images and daily task history.
- No directly relevant prior research was found in `thoughts/shared/research`.

## Verification

- `npm test -- app.service.spec.ts --runInBand` in `apps/api`
- `npm run build` in `apps/api`
- `npm run check-types` in `apps/web`
- `git diff --check`

## Open Questions

- None for the reproduced duplicate-within-one-model-response bug.

## Follow-up Research 2026-05-09T11:45:00+07:00

The journal list can receive two entries for one uploaded image:

- the normal image journal entry from `GardenService.logJournal()`;
- a synthetic `[TASK_HISTORY_DAILY]` entry from task-history persistence when journal-upload tool calls create/update/delete care tasks.

The web display now merges these for presentation:

- `apps/web/lib/cityfarm/journal.ts` identifies synthetic task-history entries by the `[TASK_HISTORY_DAILY]` note prefix.
- It groups synthetic `aiAnalysis.taskHistory` events by the matching image asset ID.
- It returns one display entry for the normal image journal card and attaches merged `taskHistory`.
- If a synthetic entry cannot be matched to an image journal card, it remains visible as a fallback.
- `apps/web/components/cityfarm/features/PlantDetailScreen.tsx` renders those task updates inside the same AI Health Check card under the recommendation.
- `apps/web/lib/cityfarm/journal.test.mjs` covers the merge case shown in the UI and the unmatched fallback case.
