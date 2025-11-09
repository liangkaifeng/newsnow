import process from "node:process"
import type { VitePWAOptions } from "vite-plugin-pwa"
import { VitePWA } from "vite-plugin-pwa"

const pwaOption: Partial<VitePWAOptions> = {
  includeAssets: ["icon.svg", "apple-touch-icon.png"],
  filename: "swx.js",
  manifest: {
    name: "财经快讯 - NewsNow",
    short_name: "财经快讯",
    description: "专注A股、加密货币、香港科技的实时财经资讯聚合",
    theme_color: "#F14D42",
    icons: [
      {
        src: "pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  },
  workbox: {
    navigateFallbackDenylist: [/^\/api/],
  },
  devOptions: {
    enabled: process.env.SW_DEV === "true",
    type: "module",
    navigateFallback: "index.html",
  },
}

export default function pwa() {
  return VitePWA(pwaOption)
}
