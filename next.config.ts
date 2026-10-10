import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/workflow",
        destination: "/webflow",
      },
      {
        source: "/workflow/:id*",
        destination: "/webflow/:id*",
      },
    ];
  },
};

export default nextConfig;
