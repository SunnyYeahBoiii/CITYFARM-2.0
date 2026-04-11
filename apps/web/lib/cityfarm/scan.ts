import type { ScanAnalysis, ScanRecommendation } from "./types";

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
