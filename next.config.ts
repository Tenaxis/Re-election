import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // 워크스페이스 루트를 프로젝트로 고정(상위 lockfile 오인 방지)
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
