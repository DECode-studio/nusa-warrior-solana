import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "excitech-id.my.id",
      },
      {
        protocol: "https",
        hostname: "storage.excitech.id",
      },
      {
        protocol: "https",
        hostname: "api.menu-kita.com",
      },
    ],
  },
};

export default nextConfig;

