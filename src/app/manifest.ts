import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "재선거 — 집회·시위 운영 플랫폼",
    short_name: "재선거",
    description: "집회·시위를 기록하고 운영하는 공간",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1120",
    theme_color: "#0d9488",
    lang: "ko",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
