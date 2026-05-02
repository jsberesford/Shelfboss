import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PremiumSupply",
    short_name: "PremiumSupply",
    description: "Inventory and order management for Premium Food Service",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1e293b",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["business", "productivity"],
    shortcuts: [
      {
        name: "Quick Count",
        url: "/m/count",
        description: "Submit a stock count",
      },
      {
        name: "Log Usage",
        url: "/m/usage",
        description: "Log item consumption",
      },
    ],
  };
}
