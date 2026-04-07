import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";

import { createSerwistRoute } from "@serwist/turbopack";

function revision(): string {
  const r = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" });
  const out = r.stdout?.trim();
  return out && out.length > 0 ? out : randomUUID();
}

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: [{ url: "/~offline", revision: revision() }],
    swSrc: "app/sw.ts",
    useNativeEsbuild: true,
  });
