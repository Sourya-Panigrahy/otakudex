export const ENTRY_STATUSES = [
  "plan_to_watch",
  "watching",
  "completed",
] as const;

export type EntryStatus = (typeof ENTRY_STATUSES)[number];

export function isEntryStatus(s: string): s is EntryStatus {
  return (ENTRY_STATUSES as readonly string[]).includes(s);
}

export const ENTRY_STATUS_LABEL: Record<EntryStatus, string> = {
  plan_to_watch: "Plan to watch",
  watching: "Watching",
  completed: "Watched",
};
