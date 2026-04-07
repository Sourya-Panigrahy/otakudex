import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Otaku Dex",
    short_name: "OtakuDex",
    description:
      "Search Jikan, track plan to watch / watching / watched, and episode progress.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    orientation: "portrait-primary",
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
  };
}
