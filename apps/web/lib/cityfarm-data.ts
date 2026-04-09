export type PlantHealth = "healthy" | "warning" | "critical";

export interface PlantTimelineStage {
  day: number;
  stage: string;
  date: string;
  completed: boolean;
}

export interface CareHistoryEntry {
  id: string;
  date: string;
  action: string;
  time: string;
  aiDetection: string;
  status: "completed";
}

export interface JournalEntry {
  id: string;
  date: string;
  photo: string;
  aiAnalysis: {
    health: "Healthy" | "Warning" | "Critical";
    leafColor: string;
    issues: string;
    recommendation: string;
  };
}

export interface Plant {
  id: string;
  name: string;
  type: string;
  code: string;
  plantedDate: string;
  daysGrowing: number;
  harvestDays: number;
  health: PlantHealth;
  imageUrl: string;
  nextWatering: string;
  nextFertilizing: string;
  progress: number;
  zone: string;
  note: string;
  careHistory: CareHistoryEntry[];
  journal: JournalEntry[];
}

export interface Reminder {
  id: string;
  plant: string;
  action: string;
  time: string;
  icon: "water" | "sun" | "check";
}

// Post types
export enum PostType {
  SHOWCASE = "showcase",
  QUESTION = "question",
  PLANT_SHARE = "plant-share",
}

export interface UserMinimal {
  id: string;
  username: string;
  profileImage?: string;
  district?: string;
  verifiedGrower?: boolean;
}

export interface FeedPost {
  id: string;
  postType: PostType;
  caption: string;
  gardenPlantId?: string;
  listingId?: string;
  contentJson?: object;
  imageAssetId?: string;
  visibilityDistrict?: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  user: UserMinimal;
  likes: number;
  comments: number;
  isLiked?: boolean;
}

export interface FeedComment {
  id: string;
  postId: string;
  parentCommentId?: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  user: UserMinimal;
  replies?: FeedComment[];
}

export interface MarketListing {
  id: string;
  sellerId: string;
  gardenPlantId: string;
  product: string;
  quantity: string;
  priceAmount: number;
  description?: string;
  imageAssetId?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  seller: UserMinimal;
}

export interface ScanRecommendation {
  id: string;
  name: string;
  scientificName: string;
  difficulty: string;
  harvestDays: string;
  matchScore: number;
  reason: string;
  imageUrl: string;
  sunlight: string;
  water: string;
  climate: string;
}

export interface ScanAnalysis {
  lightLevel: string;
  lightScore: number;
  areaSize: string;
  climate: string;
  capacity: string;
}

export interface ShopSeed {
  id: string;
  name: string;
  icon: string;
  price: string;
}

export interface DirtOption {
  id: string;
  name: string;
  quantity: string;
  price: string;
}

export interface PotOption {
  id: string;
  name: string;
  size: string;
  decoration: string;
  price: string;
}

export interface Kit {
  id: string;
  name: string;
  price: string;
  image: string;
  components: string[];
  allowedSeeds: string[];
}

const plants: Plant[] = [
  {
    id: "tomato-01",
    name: "Cherry Tomato",
    type: "Vegetable",
    code: "CITYFARM-TOMATO-01",
    plantedDate: "2026-03-04",
    daysGrowing: 27,
    harvestDays: 60,
    health: "healthy",
    imageUrl: "/cityfarm/img/tomato.png",
    nextWatering: "Today, 5:00 PM",
    nextFertilizing: "In 3 days",
    progress: 48,
    zone: "East balcony rack",
    note: "Strong morning light and consistent stem support are keeping fruit clusters stable.",
    careHistory: [
      {
        id: "care-tomato-1",
        date: "2026-03-30",
        action: "Watered",
        time: "8:00 AM",
        aiDetection: "Soil moisture back to optimal range",
        status: "completed",
      },
      {
        id: "care-tomato-2",
        date: "2026-03-28",
        action: "Added support tie",
        time: "6:30 PM",
        aiDetection: "Stem angle corrected before flowering stage",
        status: "completed",
      },
    ],
    journal: [
      {
        id: "journal-tomato-1",
        date: "2026-03-31",
        photo: "/cityfarm/img/tomato.png",
        aiAnalysis: {
          health: "Healthy",
          leafColor: "Vibrant green",
          issues: "None detected",
          recommendation: "Keep the current watering rhythm and rotate the pot every 3 days.",
        },
      },
      {
        id: "journal-tomato-2",
        date: "2026-03-27",
        photo: "/cityfarm/img/tomato.png",
        aiAnalysis: {
          health: "Healthy",
          leafColor: "Balanced green",
          issues: "Mild canopy crowding",
          recommendation: "Prune two inner leaves to increase airflow.",
        },
      },
    ],
  },
  {
    id: "lettuce-02",
    name: "Green Lettuce",
    type: "Vegetable",
    code: "CITYFARM-LETTUCE-02",
    plantedDate: "2026-03-12",
    daysGrowing: 19,
    harvestDays: 35,
    health: "healthy",
    imageUrl: "/cityfarm/img/lettuce.png",
    nextWatering: "Tomorrow, 8:00 AM",
    nextFertilizing: "In 5 days",
    progress: 64,
    zone: "Kitchen window shelf",
    note: "Compact leafy growth makes it ideal for partial shade apartments in HCMC.",
    careHistory: [
      {
        id: "care-lettuce-1",
        date: "2026-03-30",
        action: "Misted leaves",
        time: "11:45 AM",
        aiDetection: "Leaf surface temperature reduced by 2°C",
        status: "completed",
      },
      {
        id: "care-lettuce-2",
        date: "2026-03-29",
        action: "Harvested outer leaves",
        time: "7:10 PM",
        aiDetection: "Canopy density balanced",
        status: "completed",
      },
    ],
    journal: [
      {
        id: "journal-lettuce-1",
        date: "2026-03-31",
        photo: "/cityfarm/img/lettuce.png",
        aiAnalysis: {
          health: "Healthy",
          leafColor: "Cool green",
          issues: "None detected",
          recommendation: "Harvest a small outer ring in 3-4 days for continued regrowth.",
        },
      },
    ],
  },
  {
    id: "mint-03",
    name: "Fresh Mint",
    type: "Herb",
    code: "CITYFARM-MINT-03",
    plantedDate: "2026-03-09",
    daysGrowing: 22,
    harvestDays: 45,
    health: "warning",
    imageUrl: "/cityfarm/img/mint.png",
    nextWatering: "Today, 3:00 PM",
    nextFertilizing: "Tomorrow",
    progress: 58,
    zone: "Hanging corner near skylight",
    note: "Tip yellowing suggests heat stress during early afternoon exposure.",
    careHistory: [
      {
        id: "care-mint-1",
        date: "2026-03-30",
        action: "Moved to softer shade",
        time: "1:15 PM",
        aiDetection: "Leaf stress score improving",
        status: "completed",
      },
      {
        id: "care-mint-2",
        date: "2026-03-28",
        action: "Bottom watering",
        time: "9:00 AM",
        aiDetection: "Moisture distribution normalized",
        status: "completed",
      },
    ],
    journal: [
      {
        id: "journal-mint-1",
        date: "2026-03-31",
        photo: "/cityfarm/img/mint.png",
        aiAnalysis: {
          health: "Warning",
          leafColor: "Slight yellowing",
          issues: "Heat stress on upper tips",
          recommendation: "Block direct sun from 13:00 to 15:00 and keep substrate evenly moist.",
        },
      },
    ],
  },
  {
    id: "onion-04",
    name: "Green Onion",
    type: "Herb",
    code: "CITYFARM-ONION-04",
    plantedDate: "2026-03-16",
    daysGrowing: 15,
    harvestDays: 28,
    health: "healthy",
    imageUrl: "/cityfarm/img/onion.png",
    nextWatering: "Tomorrow, 7:00 AM",
    nextFertilizing: "In 6 days",
    progress: 86,
    zone: "Window-edge mini trough",
    note: "Fast regrowth and high success rate make this a strong starter herb.",
    careHistory: [
      {
        id: "care-onion-1",
        date: "2026-03-30",
        action: "Trimmed first harvest",
        time: "6:20 PM",
        aiDetection: "Regrowth nodes remain healthy",
        status: "completed",
      },
    ],
    journal: [
      {
        id: "journal-onion-1",
        date: "2026-03-31",
        photo: "/cityfarm/img/onion.png",
        aiAnalysis: {
          health: "Healthy",
          leafColor: "Bright green",
          issues: "None detected",
          recommendation: "You can cut another small batch at the end of this week.",
        },
      },
    ],
  },
];

export const reminders: Reminder[] = [
  { id: "reminder-1", plant: "Cherry Tomato", action: "Water", time: "5:00 PM", icon: "water" },
  { id: "reminder-2", plant: "Fresh Mint", action: "Reduce harsh sun", time: "1:00 PM", icon: "sun" },
  { id: "reminder-3", plant: "Green Lettuce", action: "Check leaf density", time: "Tomorrow", icon: "check" },
];

export const feedPosts: FeedPost[] = [
  {
    id: "feed-1",
    postType: PostType.SHOWCASE,
    caption: "My cherry tomatoes are finally setting fruit. The CITYFARM schedule is actually working.",
    imageAssetId: "/cityfarm/img/tomato.png",
    user: {
      id: "user-1",
      username: "Sarah Chen",
      district: "Dĩ An",
      profileImage: undefined,
      verifiedGrower: false,
    },
    likes: 24,
    comments: 5,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isPublished: true,
    isLiked: false,
  },
  {
    id: "feed-2",
    postType: PostType.QUESTION,
    caption: "Mint leaves are yellowing at the tips. Too much sun or not enough water?",
    imageAssetId: "/cityfarm/img/mint.png",
    user: {
      id: "user-2",
      username: "Mike Ross",
      district: "District 1",
      profileImage: undefined,
      verifiedGrower: false,
    },
    likes: 12,
    comments: 8,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    isPublished: true,
    isLiked: true,
  },
  {
    id: "feed-3",
    postType: PostType.PLANT_SHARE,
    caption: "Check out my lettuce at 64% growth. Sharing my log for anyone curious about a shaded kitchen setup.",
    gardenPlantId: "lettuce-02",
    user: {
      id: "user-3",
      username: "David Nguyen",
      district: "District 3",
      profileImage: undefined,
      verifiedGrower: false,
    },
    likes: 18,
    comments: 4,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    isPublished: true,
    isLiked: false,
  },
  {
    id: "feed-4",
    postType: PostType.SHOWCASE,
    caption: "Just installed my new CITYFARM standing kit and the corner finally feels alive.",
    imageAssetId: "/cityfarm/img/kit/standing.jpg",
    user: {
      id: "user-4",
      username: "Anh Tran",
      district: "Hoan Kiem",
      profileImage: undefined,
      verifiedGrower: false,
    },
    likes: 28,
    comments: 9,
    createdAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
    isPublished: true,
    isLiked: false,
  },
];

export const marketListings: MarketListing[] = [
  {
    id: "listing-101",
    sellerId: "user-5",
    gardenPlantId: "bok-choy-01",
    product: "Organic Bok Choy",
    quantity: "500g",
    priceAmount: 30000,
    imageAssetId: "/cityfarm/img/lettuce.png",
    description: "Harvested this morning. No pesticides, grown in a compact balcony rack.",
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    seller: {
      id: "user-5",
      username: "Grandma Mai",
      district: "District 3",
      verifiedGrower: true,
    },
  },
  {
    id: "listing-102",
    sellerId: "user-6",
    gardenPlantId: "basil-01",
    product: "Thai Basil Bundle",
    quantity: "100g",
    priceAmount: 15000,
    imageAssetId: "/cityfarm/img/mint.png",
    description: "Spicy aroma, extra leaves from this week's prune.",
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    seller: {
      id: "user-6",
      username: "Tom's Balcony",
      district: "Thao Dien",
      verifiedGrower: false,
    },
  },
  {
    id: "listing-103",
    sellerId: "user-7",
    gardenPlantId: "tomato-02",
    product: "Fresh Cherry Tomatoes",
    quantity: "300g",
    priceAmount: 25000,
    imageAssetId: "/cityfarm/img/tomato.png",
    description: "Sweet and juicy, documented from seedling to harvest.",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    seller: {
      id: "user-7",
      username: "Green Thumbs Co",
      district: "District 1",
      verifiedGrower: true,
    },
  },
  {
    id: "listing-104",
    sellerId: "user-8",
    gardenPlantId: "onion-02",
    product: "Green Onion Bundle",
    quantity: "250g",
    priceAmount: 12000,
    imageAssetId: "/cityfarm/img/onion.png",
    description: "Crisp, fresh, and ideal for same-day pickup.",
    createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    seller: {
      id: "user-8",
      username: "Local Herbs",
      district: "District 7",
      verifiedGrower: false,
    },
  },
];

export const scanRecommendations: ScanRecommendation[] = [
  {
    id: "recommendation-1",
    name: "Green Lettuce",
    scientificName: "Lactuca sativa",
    difficulty: "Easy",
    harvestDays: "30-35 days",
    matchScore: 95,
    reason: "Perfect for partial shade and quick kitchen harvest cycles.",
    imageUrl: "/cityfarm/img/lettuce.png",
    sunlight: "Partial Shade",
    water: "Daily mist",
    climate: "HCMC Friendly",
  },
  {
    id: "recommendation-2",
    name: "Mint",
    scientificName: "Mentha",
    difficulty: "Easy",
    harvestDays: "40-50 days",
    matchScore: 92,
    reason: "Thrives in humid conditions and regrows quickly after trimming.",
    imageUrl: "/cityfarm/img/mint.png",
    sunlight: "Filtered Light",
    water: "Daily",
    climate: "HCMC Friendly",
  },
  {
    id: "recommendation-3",
    name: "Cherry Tomato",
    scientificName: "Solanum lycopersicum",
    difficulty: "Medium",
    harvestDays: "60-80 days",
    matchScore: 78,
    reason: "Works if you keep it near the bright edge of the balcony.",
    imageUrl: "/cityfarm/img/tomato.png",
    sunlight: "Full Sun",
    water: "Every 2 days",
    climate: "HCMC Friendly",
  },
];

export const scanAnalysis: ScanAnalysis = {
  lightLevel: "Partial Sun",
  lightScore: 82,
  areaSize: "2.5 m²",
  climate: "32°C, scattered clouds",
  capacity: "3 plants",
};

export const seeds: ShopSeed[] = [
  { id: "TOMATO", name: "Cherry Tomato", icon: "🍅", price: "15.000₫" },
  { id: "LETTUCE", name: "Green Lettuce", icon: "🥬", price: "12.000₫" },
  { id: "MINT", name: "Fresh Mint", icon: "🌿", price: "10.000₫" },
  { id: "ONION", name: "Green Onion", icon: "🧅", price: "8.000₫" },
];

export const dirtOptions: DirtOption[] = [
  { id: "DIRT_250G", name: "250g Soil", quantity: "250g", price: "25.000₫" },
  { id: "DIRT_1KG", name: "1kg Soil", quantity: "1kg", price: "80.000₫" },
  { id: "DIRT_2KG", name: "2kg Soil", quantity: "2kg", price: "150.000₫" },
  { id: "DIRT_5KG", name: "5kg Soil", quantity: "5kg", price: "350.000₫" },
];

export const potOptions: PotOption[] = [
  { id: "POT_SMALL", name: "Small Pot", size: "500ml", decoration: "🌸", price: "20.000₫" },
  { id: "POT_MEDIUM", name: "Medium Pot", size: "1L", decoration: "🎨", price: "35.000₫" },
  { id: "POT_LARGE", name: "Large Pot", size: "2L", decoration: "🌈", price: "50.000₫" },
  { id: "POT_HANGING", name: "Hanging Pot", size: "1.5L", decoration: "⭐", price: "45.000₫" },
];

export const kits: Kit[] = [
  {
    id: "STAND",
    name: "Standing Garden",
    price: "199.000₫",
    image: "/cityfarm/img/kit/standing.jpg",
    components: ["5x 5L Bottles", "Seeds", "12kg Soil", "Wooden Stand"],
    allowedSeeds: ["TOMATO", "ONION", "LETTUCE", "MINT"],
  },
  {
    id: "HANG",
    name: "Hanging Garden",
    price: "149.000₫",
    image: "/cityfarm/img/kit/hanging.jpg",
    components: ["5x Bottles", "Seeds", "2kg Soil", "Wall Mount"],
    allowedSeeds: ["LETTUCE", "MINT", "ONION"],
  },
  {
    id: "TINY",
    name: "Tiny Garden",
    price: "99.000₫",
    image: "/cityfarm/img/kit/tiny.jpg",
    components: ["5x 500ml Bottles", "Seeds", "1kg Soil"],
    allowedSeeds: ["MINT", "ONION"],
  },
  {
    id: "UPGR",
    name: "Upgraded Tiny",
    price: "119.000₫",
    image: "/cityfarm/img/kit/tiny_plus.jpg",
    components: ["5x 1L Bottles", "Seeds", "2kg Soil"],
    allowedSeeds: ["MINT", "ONION", "LETTUCE"],
  },
  {
    id: "START",
    name: "Green Starter",
    price: "49.000₫",
    image: "/cityfarm/img/kit/start.jpg",
    components: ["1x 1L Bottle", "Seeds", "250g Soil", "1 Month AI"],
    allowedSeeds: ["MINT", "ONION", "LETTUCE"],
  },
];

export const homeStats = [
  { label: "Active Plants", value: `${plants.length}`, tone: "green" },
  { label: "Care Rate", value: "85%", tone: "blue" },
  { label: "HCMC Today", value: "28°C", tone: "amber" },
];

export function getPlants() {
  return plants;
}

export function getPlantById(plantId: string) {
  return plants.find((plant) => plant.id === plantId);
}

export function getTimelineForPlant(plant: Plant): PlantTimelineStage[] {
  return [
    { day: 1, stage: "Planted", date: plant.plantedDate, completed: true },
    {
      day: 7,
      stage: "Sprouting",
      date: offsetDate(plant.plantedDate, 7),
      completed: plant.daysGrowing >= 7,
    },
    {
      day: 14,
      stage: "Vegetative Growth",
      date: offsetDate(plant.plantedDate, 14),
      completed: plant.daysGrowing >= 14,
    },
    {
      day: Math.floor(plant.harvestDays * 0.75),
      stage: "Flowering",
      date: offsetDate(plant.plantedDate, Math.floor(plant.harvestDays * 0.75)),
      completed: plant.daysGrowing >= Math.floor(plant.harvestDays * 0.75),
    },
    {
      day: plant.harvestDays,
      stage: "Harvest Ready",
      date: offsetDate(plant.plantedDate, plant.harvestDays),
      completed: plant.daysGrowing >= plant.harvestDays,
    },
  ];
}

function offsetDate(dateString: string, offsetDays: number) {
  const baseDate = new Date(dateString);
  const result = new Date(baseDate.getTime() + offsetDays * 24 * 60 * 60 * 1000);
  return result.toISOString().split("T")[0] ?? dateString;
}

export const cityFarmDataset = {
  plants,
  reminders,
  feedPosts,
  marketListings,
  scanRecommendations,
  scanAnalysis,
  seeds,
  dirtOptions,
  potOptions,
  kits,
  homeStats,
};
