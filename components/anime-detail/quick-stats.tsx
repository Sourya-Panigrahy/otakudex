import { Activity, AlertTriangle } from "lucide-react";

type QuickStatsProps = {
  status: string | null;
  episodes: number | null;
  aired: string | null;
  rating: string | null;
};

function formatAiredShort(aired: string | null): string | null {
  if (!aired?.trim()) return null;
  const first = aired.split(/\s+to\s+/i)[0]?.trim() ?? aired.trim();
  return first.toUpperCase();
}

function statusTone(status: string | null): "blue" | "default" {
  if (!status) return "default";
  const s = status.toLowerCase();
  if (s.includes("not yet aired") || s.includes("upcoming")) return "blue";
  return "default";
}

export function AnimeDetailQuickStats({
  status,
  episodes,
  aired,
  rating,
}: QuickStatsProps) {
  const airedFmt = formatAiredShort(aired);
  const tone = statusTone(status);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Status
        </p>
        <div className="mt-2 flex items-center gap-2">
          <Activity
            className={`h-4 w-4 shrink-0 ${
              tone === "blue" ? "text-sky-400" : "text-zinc-400"
            }`}
            aria-hidden
          />
          <p
            className={`text-sm font-semibold leading-tight ${
              tone === "blue" ? "text-sky-400" : "text-zinc-100"
            }`}
          >
            {status ? status.toUpperCase() : "—"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Episodes
        </p>
        <p className="mt-2 text-lg font-semibold tabular-nums text-zinc-100">
          {episodes != null ? episodes : "—"}
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Aired
        </p>
        <p className="mt-2 text-sm font-medium leading-snug text-zinc-100">
          {airedFmt ?? "—"}
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Rating
        </p>
        <div className="mt-2 flex items-center gap-2">
          <p className="text-sm font-semibold text-zinc-100">
            {rating ?? "—"}
          </p>
          {rating ? (
            <AlertTriangle
              className="h-4 w-4 shrink-0 text-amber-500"
              aria-hidden
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
