import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
  webpack: (config) => {
    if (Array.isArray(config.externals)) {
      config.externals.push("pino-pretty");
    } else if (config.externals) {
      config.externals = [config.externals, "pino-pretty"];
    } else {
      config.externals = ["pino-pretty"];
    }
    return config;
  },
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

