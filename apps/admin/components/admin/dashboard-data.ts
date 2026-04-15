export type DashboardTone = "success" | "warning" | "danger" | "neutral" | "info";

export const dashboardKpis = [
  {
    label: "Posts today",
    value: "148",
    delta: "+12%",
    footnote: "So với cùng giờ hôm qua",
    tone: "success" as const,
    stroke: "#355b31",
    fill: "rgba(53,91,49,0.14)",
    points: [14, 18, 17, 24, 26, 29, 34],
  },
  {
    label: "Listings active",
    value: "74",
    delta: "+5",
    footnote: "9 listing sắp hết hạn",
    tone: "info" as const,
    stroke: "#40657c",
    fill: "rgba(64,101,124,0.14)",
    points: [52, 54, 58, 60, 63, 68, 74],
  },
  {
    label: "Pending orders",
    value: "18",
    delta: "-3",
    footnote: "Đã xử lý 6 đơn quá SLA",
    tone: "warning" as const,
    stroke: "#cd924a",
    fill: "rgba(205,146,74,0.18)",
    points: [28, 24, 22, 19, 23, 21, 18],
  },
  {
    label: "Daily GMV",
    value: "₫18.4M",
    delta: "+8.2%",
    footnote: "Marketplace + shop combined",
    tone: "success" as const,
    stroke: "#2f6a44",
    fill: "rgba(47,106,68,0.14)",
    points: [7, 8, 9, 10, 13, 16, 18],
  },
] as const;

export const orderHealthCards = [
  {
    eyebrow: "Watchtower",
    title: "Moderation focus",
    status: "Attention",
    description:
      "Các post có caption dài, tín hiệu report cao và ảnh marketplace share trùng lặp đang dồn về buổi chiều.",
    metric: "12 items",
    tone: "warning" as const,
    stroke: "#cd924a",
    fill: "rgba(205,146,74,0.18)",
    series: [8, 9, 11, 10, 13, 12, 15],
  },
  {
    eyebrow: "Fulfillment",
    title: "Order pulse",
    status: "Healthy",
    description:
      "Pipeline xác nhận đơn đang ổn, nhưng vẫn còn cụm pickup cần follow-up thêm ở Quận 7 và Thủ Đức.",
    metric: "94% SLA",
    tone: "success" as const,
    stroke: "#355b31",
    fill: "rgba(53,91,49,0.14)",
    series: [72, 74, 71, 76, 78, 81, 94],
  },
] as const;

export const alertQueue = [
  {
    title: "6 đơn PENDING_CONFIRMATION quá 45 phút",
    description: "Cần xác nhận hoặc gán lại người xử lý để tránh nghẽn ở ca tối.",
    label: "Orders",
    tone: "warning" as const,
  },
  {
    title: "3 listing có ảnh chất lượng thấp",
    description: "Khả năng ảnh trùng hoặc không đủ sáng, nên đưa vào visual review.",
    label: "Marketplace",
    tone: "info" as const,
  },
  {
    title: "2 bài đăng bị report liên tiếp từ cùng district",
    description: "Kiểm tra caption và comment thread trước khi quyết định unpublish.",
    label: "Content",
    tone: "danger" as const,
  },
] as const;

export const moderationQueue = [
  {
    author: "Nguyen Thanh",
    type: "PLANT_SHARE",
    caption: "Thu hoạch đợt rau mầm sáng nay, muốn chia sẻ log chăm cây và bán một phần harvest.",
    district: "Thu Duc",
    signals: "14 likes • 3 reports",
    status: "Needs review",
    tone: "warning" as const,
    time: "12 mins ago",
  },
  {
    author: "Mai Linh",
    type: "SHOWCASE",
    caption: "Ban công mùa này lên form rất đẹp, ảnh chụp mới có kèm soil recipe và lịch watering.",
    district: "District 7",
    signals: "27 likes • 0 reports",
    status: "Clean",
    tone: "success" as const,
    time: "24 mins ago",
  },
  {
    author: "Vu Hoang",
    type: "MARKETPLACE_SHARE",
    caption: "Còn 4 khay xà lách thủy canh, muốn share lên market với giá pickup tối nay.",
    district: "Binh Thanh",
    signals: "11 likes • 1 report",
    status: "Check asset",
    tone: "info" as const,
    time: "39 mins ago",
  },
] as const;

export const districtPerformance = [
  { name: "Thu Duc", value: "18 listing active", width: "84%" },
  { name: "District 7", value: "14 order today", width: "72%" },
  { name: "Binh Thanh", value: "11 moderation items", width: "61%" },
  { name: "Go Vap", value: "9 pickup requests", width: "48%" },
] as const;

export const recentOrders = [
  {
    code: "KIT-TINY-581204",
    buyer: "Le Minh Anh",
    items: "Starter kit + mint seeds",
    amount: "₫1.250.000",
    status: "Pending confirmation",
    tone: "warning" as const,
    createdAt: "10:42",
  },
  {
    code: "SEED-LETTUCE-581188",
    buyer: "Tran Gia Huy",
    items: "2 packs lettuce",
    amount: "₫220.000",
    status: "Confirmed",
    tone: "success" as const,
    createdAt: "10:15",
  },
  {
    code: "POT-RECYCLE-581143",
    buyer: "Pham Nhu Quynh",
    items: "Recycled pots x4",
    amount: "₫340.000",
    status: "Ready for pickup",
    tone: "info" as const,
    createdAt: "09:58",
  },
] as const;

export const activityFeed = [
  {
    title: "Listing from District 7 moved to visual review",
    description: "Ảnh cover bị đánh giá thiếu sáng và crop quá chặt, cần seller upload lại asset.",
    tag: "marketplace",
    time: "11:14",
    tone: "info" as const,
  },
  {
    title: "Order KIT-TINY-581204 escalated",
    description: "Đơn được chuyển sang queue ưu tiên vì pickup note không đầy đủ.",
    tag: "orders",
    time: "10:48",
    tone: "warning" as const,
  },
  {
    title: "Feed post by Nguyen Thanh unhidden",
    description: "Moderator xác nhận đây là plant-share hợp lệ sau khi kiểm tra image và caption.",
    tag: "content",
    time: "10:21",
    tone: "success" as const,
  },
] as const;

export const volumeSeries = [24, 28, 31, 35, 33, 38, 42, 48, 45, 52, 56, 61];
export const revenueSeries = [8, 10, 11, 13, 12, 15, 16, 17, 18, 20, 19, 22];
