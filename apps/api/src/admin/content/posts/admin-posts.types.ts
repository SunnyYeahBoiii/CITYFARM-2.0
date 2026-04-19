export type AdminReactionSignal = {
  likes: number;
  comments: number;
  reports: number;
};

export type AdminFeedPostRow = {
  id: string;
  authorName: string;
  authorDistrict: string;
  authorVerifiedGrower?: boolean;
  createdAtLabel: string;
  postType:
    | 'SHOWCASE'
    | 'QUESTION'
    | 'PLANT_SHARE'
    | 'MARKETPLACE_SHARE'
    | 'HARVEST_UPDATE';
  caption: string;
  imageUrl?: string;
  visibilityDistrict?: string;
  signals: AdminReactionSignal;
  status: 'PUBLISHED' | 'NEEDS_REVIEW' | 'FLAGGED' | 'HIDDEN' | 'DELETED';
  riskNotes: string[];
};
