"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  watchedEpisodes: number;
  totalEpisodes: number | null;
  disabled?: boolean;
  onCommit: (next: number) => void | Promise<void>;
  /** lg = library default; sm = dense grid */
  size?: "sm" | "md" | "lg";
};

export function EpisodeWatchedInline({
  watchedEpisodes,
  totalEpisodes,
  disabled = false,
  onCommit,
  size = "md",
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      const el = inputRef.current;
      el?.focus();
      el?.select();
    }
  }, [editing]);

  const start = () => {
    if (disabled) return;
    setDraft(String(watchedEpisodes));
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setDraft("");
  };

  const commit = () => {
    const trimmed = draft.replace(/\D/g, "");
    if (trimmed === "") {
      cancel();
      return;
    }
    const n = Number.parseInt(trimmed, 10);
    if (!Number.isFinite(n) || n < 0) {
      cancel();
      return;
    }
    let next = Math.floor(n);
    if (totalEpisodes != null && totalEpisodes > 0) {
      next = Math.min(next, totalEpisodes);
    }
    setEditing(false);
    setDraft("");
    if (next !== watchedEpisodes) {
      void onCommit(next);
    }
  };

  const onDraftChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits === "") {
      setDraft("");
      return;
    }
    const n = Number.parseInt(digits, 10);
    if (!Number.isFinite(n) || n < 0) {
      setDraft("");
      return;
    }
    setDraft(String(n));
  };

  const textSize =
    size === "lg"
      ? "text-base font-semibold"
      : size === "sm"
        ? "text-sm font-semibold"
        : "text-base font-medium";
  const spinHide =
    "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";
  const inputClass =
    size === "lg"
      ? `h-8 min-w-[3.25rem] max-w-[5rem] rounded-md border border-input bg-background px-1.5 text-center text-base font-semibold tabular-nums text-foreground outline-none focus:ring-2 focus:ring-ring ${spinHide}`
      : size === "sm"
        ? `h-7 min-w-[2.5rem] max-w-[4rem] rounded border border-input bg-background px-1 text-center text-sm font-semibold tabular-nums text-foreground outline-none focus:ring-2 focus:ring-ring ${spinHide}`
        : `h-8 min-w-14 max-w-[5rem] rounded-md border border-input bg-background px-1.5 text-center text-sm font-semibold tabular-nums text-foreground outline-none focus:ring-2 focus:ring-ring ${spinHide}`;

  if (editing) {
    return (
      <span
        className={`inline-flex flex-wrap items-center gap-1 tabular-nums ${textSize}`}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          className={inputClass}
          aria-label="Watched episodes"
          value={draft}
          onChange={(ev) => onDraftChange(ev.target.value)}
          onBlur={() => commit()}
          onKeyDown={(ev) => {
            if (ev.key === "Enter") {
              ev.preventDefault();
              commit();
            }
            if (ev.key === "Escape") {
              ev.preventDefault();
              cancel();
            }
          }}
        />
        <span className="text-muted-foreground">/</span>
        <span>{totalEpisodes ?? "—"}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      title="Click to type episode count"
      className={`inline-flex flex-wrap items-center gap-1 tabular-nums ${textSize} text-foreground transition hover:text-primary disabled:opacity-40`}
      onClick={start}
    >
      <span className="cursor-text border-b border-dotted border-muted-foreground/60 hover:border-primary/80">
        {watchedEpisodes}
      </span>
      <span className="text-muted-foreground">/</span>
      <span>{totalEpisodes ?? "—"}</span>
    </button>
  );
}
