import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
  ...(process.env.ALLOWED_DEV_ORIGINS && {
    allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS.split(",").map((o) => o.trim()),
  }),
};

export default nextConfig;
