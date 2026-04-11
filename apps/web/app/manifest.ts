import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CITYFARM 2.0",
    short_name: "CITYFARM",
    description: "Urban gardening app with community, AI scan, and care tracking.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4efe4",
    theme_color: "#355b31",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}
