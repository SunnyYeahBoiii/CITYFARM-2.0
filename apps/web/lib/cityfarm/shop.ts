import type { DirtOption, Kit, PotOption, ShopSeed } from "./types";

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
