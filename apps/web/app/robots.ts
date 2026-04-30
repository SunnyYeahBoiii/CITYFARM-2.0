import type { MetadataRoute } from "next";
import { resolveRequiredUrl } from "@/lib/config/url";

const baseUrl = resolveRequiredUrl("NEXT_PUBLIC_APP_URL", "http://localhost:3000");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
