import type { MetadataRoute } from "next";
import { getPlants } from "@/lib/cityfarm";
import { resolveRequiredUrl } from "@/lib/config/url";

const baseUrl = resolveRequiredUrl("NEXT_PUBLIC_APP_URL", "http://localhost:3000");

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/login",
    "/register",
    "/setup-password",
    "/home",
    "/garden",
    "/community",
    "/order",
    "/scan",
    "/account",
    "/chatbot",
  ];
  const plantRoutes = getPlants().map((plant) => `/garden/${plant.id}`);

  return [...staticRoutes, ...plantRoutes].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));
}
