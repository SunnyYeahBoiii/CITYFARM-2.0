export type ProductTypeQuery = "kit" | "seed" | "soil" | "pot";

export interface ShopSeed {
  id: string;
  name: string;
  icon?: string;
  image?: string;
  price: string;
}

export interface DirtOption {
  id: string;
  name: string;
  quantity: string;
  image?: string;
  price: string;
}

export interface PotOption {
  id: string;
  name: string;
  size: string;
  decoration?: string;
  image?: string;
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
