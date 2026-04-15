import type { FeedPostRow, ModerationStatus, PostFilterState, PostType } from "./types";

export function statusLabel(status: ModerationStatus): string {
  switch (status) {
    case "PUBLISHED":
      return "Published";
    case "NEEDS_REVIEW":
      return "Needs review";
    case "FLAGGED":
      return "Flagged";
    case "HIDDEN":
      return "Hidden";
    case "DELETED":
      return "Deleted";
    default:
      return status;
  }
}

export function statusTone(status: ModerationStatus): "success" | "warning" | "danger" | "neutral" | "info" {
  switch (status) {
    case "PUBLISHED":
      return "success";
    case "NEEDS_REVIEW":
      return "warning";
    case "FLAGGED":
      return "danger";
    case "HIDDEN":
      return "neutral";
    case "DELETED":
      return "neutral";
    default:
      return "neutral";
  }
}

export function postTypeLabel(type: PostType): string {
  switch (type) {
    case "SHOWCASE":
      return "Showcase";
    case "QUESTION":
      return "Question";
    case "PLANT_SHARE":
      return "Plant share";
    case "MARKETPLACE_SHARE":
      return "Market share";
    case "HARVEST_UPDATE":
      return "Harvest update";
    default:
      return type;
  }
}

export function applyPostFilters(rows: FeedPostRow[], filters: PostFilterState): FeedPostRow[] {
  const q = filters.q.trim().toLowerCase();

  return rows.filter((row) => {
    if (filters.status !== "ALL" && row.status !== filters.status) return false;
    if (filters.type !== "ALL" && row.postType !== filters.type) return false;
    if (filters.district !== "ALL" && row.visibilityDistrict !== filters.district) return false;
    if (filters.hasImage && !row.imageUrl) return false;
    if (filters.reportedOnly && row.signals.reports === 0) return false;

    if (!q) return true;
    const haystack = [
      row.id,
      row.authorName,
      row.authorDistrict,
      row.visibilityDistrict ?? "",
      row.postType,
      row.caption,
      row.riskNotes.join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function summarizeQueue(rows: FeedPostRow[]) {
  const total = rows.length;
  const flagged = rows.filter((r) => r.status === "FLAGGED").length;
  const needsReview = rows.filter((r) => r.status === "NEEDS_REVIEW").length;
  const published = rows.filter((r) => r.status === "PUBLISHED").length;
  const reported = rows.filter((r) => r.signals.reports > 0).length;

  return { total, flagged, needsReview, published, reported };
}
