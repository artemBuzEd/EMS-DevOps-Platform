import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Event pictures come from object storage with an unknown/variable host.
    unoptimized: true,
  },
};

export default nextConfig;
