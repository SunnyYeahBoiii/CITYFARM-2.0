import type {
  JournalEntryItem,
  JournalTaskHistoryEvent,
} from "../types/garden";

const TASK_HISTORY_DAILY_PREFIX = "[TASK_HISTORY_DAILY]";

export type DisplayJournalEntry = JournalEntryItem & {
  taskHistory: JournalTaskHistoryEvent[];
};

function isTaskHistoryDailyEntry(entry: JournalEntryItem) {
  return entry.note?.startsWith(TASK_HISTORY_DAILY_PREFIX) ?? false;
}

function getTaskHistory(entry: JournalEntryItem): JournalTaskHistoryEvent[] {
  const taskHistory = entry.aiAnalysis?.taskHistory;
  return Array.isArray(taskHistory) ? taskHistory : [];
}

function getHistoryImageAssetId(
  entry: JournalEntryItem,
  history: JournalTaskHistoryEvent[],
) {
  return (
    entry.imageAsset?.id ??
    history.find((event) => typeof event.imageAssetId === "string")
      ?.imageAssetId ??
    null
  );
}

function getTaskHistoryKey(event: JournalTaskHistoryEvent) {
  return [
    event.action,
    event.taskId,
    event.timestamp,
    event.title,
    event.taskType,
  ].join(":");
}

function mergeTaskHistory(
  primary: JournalTaskHistoryEvent[],
  secondary: JournalTaskHistoryEvent[],
) {
  const seen = new Set<string>();
  const merged: JournalTaskHistoryEvent[] = [];

  for (const event of [...primary, ...secondary]) {
    const key = getTaskHistoryKey(event);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(event);
  }

  return merged;
}

export function getDisplayJournalEntries(
  entries: JournalEntryItem[],
): DisplayJournalEntry[] {
  const normalImageAssetIds = new Set(
    entries
      .filter((entry) => !isTaskHistoryDailyEntry(entry))
      .map((entry) => entry.imageAsset?.id)
      .filter((id): id is string => Boolean(id)),
  );
  const syntheticHistoryByImageAssetId = new Map<
    string,
    JournalTaskHistoryEvent[]
  >();

  for (const entry of entries) {
    if (!isTaskHistoryDailyEntry(entry)) {
      continue;
    }

    const history = getTaskHistory(entry);
    const imageAssetId = getHistoryImageAssetId(entry, history);

    if (!imageAssetId || !normalImageAssetIds.has(imageAssetId)) {
      continue;
    }

    syntheticHistoryByImageAssetId.set(
      imageAssetId,
      mergeTaskHistory(
        syntheticHistoryByImageAssetId.get(imageAssetId) ?? [],
        history,
      ),
    );
  }

  return entries.flatMap((entry) => {
    const history = getTaskHistory(entry);

    if (isTaskHistoryDailyEntry(entry)) {
      const imageAssetId = getHistoryImageAssetId(entry, history);
      if (imageAssetId && normalImageAssetIds.has(imageAssetId)) {
        return [];
      }

      return [{ ...entry, taskHistory: history }];
    }

    const syntheticHistory = entry.imageAsset?.id
      ? syntheticHistoryByImageAssetId.get(entry.imageAsset.id)
      : undefined;

    return [
      {
        ...entry,
        taskHistory: mergeTaskHistory(history, syntheticHistory ?? []),
      },
    ];
  });
}
