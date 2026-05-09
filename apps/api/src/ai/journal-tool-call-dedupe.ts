type JournalUploadToolCall = {
  name: string;
  arguments: Record<string, unknown>;
};

function getJournalUploadToolCallKey(toolCall: JournalUploadToolCall): string {
  const argumentsWithoutInjectedImageId = Object.entries(
    toolCall.arguments ?? {},
  )
    .filter(([key]) => key !== 'journalImageAssetId')
    .sort(([left], [right]) => left.localeCompare(right));

  return `${toolCall.name}:${JSON.stringify(argumentsWithoutInjectedImageId)}`;
}

export function deduplicateJournalUploadToolCalls<
  T extends JournalUploadToolCall,
>(toolCalls: T[]): T[] {
  const seen = new Set<string>();

  return toolCalls.filter((toolCall) => {
    const key = getJournalUploadToolCallKey(toolCall);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
