/**
 * MAL animelist.xml uses either numeric `my_status` (1–6) or text labels
 * (e.g. "Completed", "Watching") depending on export version.
 */

/** Normalize to MAL numeric codes: 1 watching, 2 completed, 3 on hold, 4 dropped, 6 plan */
export function normalizeMalListStatus(raw: string | null | undefined): number {
  if (raw == null) return 6;
  const t = String(raw).trim();
  if (!t) return 6;

  if (/^\d+$/.test(t)) {
    const n = Number.parseInt(t, 10);
    return Number.isFinite(n) ? n : 6;
  }

  const lower = t.toLowerCase().replace(/\s+/g, " ");

  if (lower === "watching" || lower === "rewatching") return 1;
  if (lower === "completed") return 2;
  if (lower === "on-hold" || lower === "on hold") return 3;
  if (lower === "dropped") return 4;
  if (lower === "plan to watch") return 6;

  return 6;
}
