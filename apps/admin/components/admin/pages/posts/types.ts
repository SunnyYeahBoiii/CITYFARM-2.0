export type PostType = "SHOWCASE" | "QUESTION" | "PLANT_SHARE" | "MARKETPLACE_SHARE" | "HARVEST_UPDATE";

export type ModerationStatus = "PUBLISHED" | "NEEDS_REVIEW" | "FLAGGED" | "HIDDEN" | "DELETED";

export type ReactionSignal = {
  likes: number;
  comments: number;
  reports: number;
};

export type FeedPostRow = {
  id: string;
  authorName: string;
  authorDistrict: string;
  authorVerifiedGrower?: boolean;
  createdAtLabel: string;
  postType: PostType;
  caption: string;
  imageUrl?: string;
  visibilityDistrict?: string;
  signals: ReactionSignal;
  status: ModerationStatus;
  riskNotes: string[];
};

export type PostFilterState = {
  q: string;
  status: ModerationStatus | "ALL";
  type: PostType | "ALL";
  district: string | "ALL";
  hasImage: boolean;
  reportedOnly: boolean;
};
