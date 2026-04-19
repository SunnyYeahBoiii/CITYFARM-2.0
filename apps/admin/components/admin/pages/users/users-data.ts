export type UserRole = "USER" | "ADMIN" | "SUPPLIER" | "EXPERT";
export type VerificationStatus = "NONE" | "PENDING" | "VERIFIED" | "REVOKED";

export type UserRow = {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  district: string;
  city: string;
  createdAt: string;
  lastActiveAt: string;
  growerVerificationStatus: VerificationStatus;
  trustScore: number; // 0..100
  riskSignals: string[];
  totals: {
    posts: number;
    listings: number;
    orders: number;
    gmv: string;
  };
};

export type VerificationQueueItem = {
  userId: string;
  displayName: string;
  district: string;
  requestedAt: string;
  status: VerificationStatus;
  note: string;
};

export type ActivityEvent = {
  time: string;
  tag: "posts" | "orders" | "marketplace" | "system";
  title: string;
  detail: string;
  tone: "success" | "warning" | "danger" | "neutral" | "info";
};

export const mockUsers: UserRow[] = [
  {
    id: "u_1001",
    displayName: "Tran Gia Huy",
    email: "huy.tran@example.com",
    role: "USER",
    district: "District 7",
    city: "Ho Chi Minh City",
    createdAt: "2026-02-08",
    lastActiveAt: "12 mins ago",
    growerVerificationStatus: "NONE",
    trustScore: 78,
    riskSignals: [],
    totals: { posts: 3, listings: 0, orders: 7, gmv: "₫3.1M" },
  },
  {
    id: "u_1022",
    displayName: "Nguyen Thanh",
    email: "thanh.nguyen@example.com",
    role: "USER",
    district: "Thu Duc",
    city: "Ho Chi Minh City",
    createdAt: "2026-01-11",
    lastActiveAt: "39 mins ago",
    growerVerificationStatus: "PENDING",
    trustScore: 64,
    riskSignals: ["Verification pending", "Report spike (posts)"],
    totals: { posts: 14, listings: 2, orders: 4, gmv: "₫1.6M" },
  },
  {
    id: "u_1059",
    displayName: "Mai Linh",
    email: "linh.mai@example.com",
    role: "EXPERT",
    district: "Binh Thanh",
    city: "Ho Chi Minh City",
    createdAt: "2025-12-18",
    lastActiveAt: "2 hrs ago",
    growerVerificationStatus: "VERIFIED",
    trustScore: 91,
    riskSignals: [],
    totals: { posts: 28, listings: 1, orders: 1, gmv: "₫220k" },
  },
  {
    id: "u_1084",
    displayName: "Pham Nhu Quynh",
    email: "quynh.pham@example.com",
    role: "SUPPLIER",
    district: "Go Vap",
    city: "Ho Chi Minh City",
    createdAt: "2026-03-02",
    lastActiveAt: "Yesterday",
    growerVerificationStatus: "VERIFIED",
    trustScore: 86,
    riskSignals: ["High volume (listings)"],
    totals: { posts: 4, listings: 18, orders: 0, gmv: "₫0" },
  },
  {
    id: "u_1107",
    displayName: "Lan Anh",
    email: "lan.anh@cityfarm.vn",
    role: "ADMIN",
    district: "District 1",
    city: "Ho Chi Minh City",
    createdAt: "2025-11-03",
    lastActiveAt: "Now",
    growerVerificationStatus: "NONE",
    trustScore: 99,
    riskSignals: [],
    totals: { posts: 0, listings: 0, orders: 0, gmv: "₫0" },
  },
  {
    id: "u_1121",
    displayName: "Vu Hoang",
    email: "hoang.vu@example.com",
    role: "USER",
    district: "Binh Thanh",
    city: "Ho Chi Minh City",
    createdAt: "2026-03-20",
    lastActiveAt: "4 hrs ago",
    growerVerificationStatus: "REVOKED",
    trustScore: 42,
    riskSignals: ["Revoked verification", "Repeated low-quality assets"],
    totals: { posts: 9, listings: 6, orders: 2, gmv: "₫840k" },
  },
];

export const verificationQueue: VerificationQueueItem[] = [
  {
    userId: "u_1022",
    displayName: "Nguyen Thanh",
    district: "Thu Duc",
    requestedAt: "Today 10:12",
    status: "PENDING",
    note: "Xin verify grower. Co log trong garden + 2 listing rau mam.",
  },
  {
    userId: "u_1121",
    displayName: "Vu Hoang",
    district: "Binh Thanh",
    requestedAt: "Yesterday 18:42",
    status: "REVOKED",
    note: "Verification bi thu hoi do asset khong dat, can review lai truoc khi re-apply.",
  },
];

export const mockActivity: Record<string, ActivityEvent[]> = {
  u_1022: [
    {
      time: "11:18",
      tag: "posts",
      title: "Feed post flagged for review",
      detail: "Caption dai + 3 reports tu cung district.",
      tone: "warning",
    },
    {
      time: "10:12",
      tag: "system",
      title: "Grower verification requested",
      detail: "Can check log garden va marketplace assets.",
      tone: "info",
    },
    {
      time: "09:40",
      tag: "marketplace",
      title: "Listing created",
      detail: "Rau mam mix (2.0kg), pickup Thu Duc.",
      tone: "neutral",
    },
  ],
  u_1121: [
    {
      time: "Yesterday 18:42",
      tag: "system",
      title: "Verification revoked",
      detail: "Repeated low-quality assets; seller asked to re-upload.",
      tone: "danger",
    },
    {
      time: "Yesterday 17:10",
      tag: "marketplace",
      title: "Listing moved to visual review",
      detail: "Cover image too dark, possible duplicates.",
      tone: "warning",
    },
  ],
};

export function getUserInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

