import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getDisplayJournalEntries } from "./journal.ts";

describe("journal display entries", () => {
  it("merges task history daily entries into the matching image journal card", () => {
    const entries = [
      {
        id: "journal-1",
        capturedAt: "2026-05-09T04:00:00.000Z",
        note: null,
        healthStatus: "CRITICAL",
        leafColorNote: null,
        issueSummary: "Aphids",
        recommendationSummary: "Remove infected leaves.",
        aiAnalysis: null,
        imageAsset: {
          id: "asset-1",
          publicUrl: "https://cdn.example.com/aphids.jpg",
        },
      },
      {
        id: "daily-1",
        capturedAt: "2026-05-09T04:01:00.000Z",
        note: "[TASK_HISTORY_DAILY] Cập nhật lịch sử task ngày 9/5/26",
        healthStatus: "CRITICAL",
        leafColorNote: null,
        issueSummary: null,
        recommendationSummary: null,
        aiAnalysis: {
          taskHistory: [
            {
              action: "CREATED",
              taskId: "task-1",
              title: "Kiểm tra rệp",
              taskType: "PEST_CHECK",
              imageAssetId: "asset-1",
              timestamp: "2026-05-09T04:01:00.000Z",
            },
          ],
        },
        imageAsset: {
          id: "asset-1",
          publicUrl: "https://cdn.example.com/aphids.jpg",
        },
      },
    ];

    const displayEntries = getDisplayJournalEntries(entries);

    assert.equal(displayEntries.length, 1);
    assert.equal(displayEntries[0].id, "journal-1");
    assert.deepEqual(displayEntries[0].taskHistory, [
      {
        action: "CREATED",
        taskId: "task-1",
        title: "Kiểm tra rệp",
        taskType: "PEST_CHECK",
        imageAssetId: "asset-1",
        timestamp: "2026-05-09T04:01:00.000Z",
      },
    ]);
  });

  it("keeps unmatched task history entries visible", () => {
    const entries = [
      {
        id: "daily-1",
        capturedAt: "2026-05-09T04:01:00.000Z",
        note: "[TASK_HISTORY_DAILY] Cập nhật lịch sử task ngày 9/5/26",
        healthStatus: "WARNING",
        leafColorNote: null,
        issueSummary: null,
        recommendationSummary: null,
        aiAnalysis: {
          taskHistory: [
            {
              action: "UPDATED",
              taskId: "task-1",
              title: "Tưới nước",
              imageAssetId: "asset-1",
            },
          ],
        },
        imageAsset: null,
      },
    ];

    const displayEntries = getDisplayJournalEntries(entries);

    assert.equal(displayEntries.length, 1);
    assert.equal(displayEntries[0].id, "daily-1");
    assert.equal(displayEntries[0].taskHistory.length, 1);
  });
});
