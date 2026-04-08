"use client";

import Image from "next/image";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import type { AnimeListDto } from "@/lib/jikan";
import { cn } from "@/lib/utils";

function useDebouncedCallback(
  fn: (value: string) => void,
  delay: number
): (value: string) => void {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (value: string) => {
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => fn(value), delay);
  };
}

const SUGGEST_DEBOUNCE_MS = 220;
const MIN_QUERY_LEN = 2;
const MAX_SUGGESTIONS = 8;

export function HeaderSearch() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") ?? "";

  const [value, setValue] = useState(qParam);
  const [suggestions, setSuggestions] = useState<AnimeListDto[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = "header-search-suggestions";

  useEffect(() => {
    setValue(qParam);
  }, [qParam]);

  const pushQueryDebounced = useDebouncedCallback((next: string) => {
    const trimmed = next.trim();
    router.push(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : "/");
  }, 350);

  const onSearchChange = (next: string) => {
    setValue(next);
    setHighlight(-1);
    const trimmed = next.trim();
    if (pathname === "/") {
      router.replace(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : "/");
    } else {
      pushQueryDebounced(next);
    }
  };

  useEffect(() => {
    const q = value.trim();
    if (q.length < MIN_QUERY_LEN) {
      setSuggestions([]);
      setSuggestLoading(false);
      setOpen(false);
      return;
    }

    const ac = new AbortController();
    const t = setTimeout(() => {
      setSuggestLoading(true);
      setOpen(true);
      void (async () => {
        try {
          const res = await fetch(
            `/api/anime/search?q=${encodeURIComponent(q)}`,
            { signal: ac.signal }
          );
          if (!res.ok) throw new Error("search");
          const json = (await res.json()) as { data?: AnimeListDto[] };
          const list = (json.data ?? []).slice(0, MAX_SUGGESTIONS);
          setSuggestions(list);
          setOpen(true);
          setHighlight(-1);
        } catch {
          if (!ac.signal.aborted) {
            setSuggestions([]);
            setOpen(true);
          }
        } finally {
          if (!ac.signal.aborted) setSuggestLoading(false);
        }
      })();
    }, SUGGEST_DEBOUNCE_MS);

    return () => {
      clearTimeout(t);
      ac.abort();
    };
  }, [value]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const goAnime = useCallback(
    (malId: number) => {
      setOpen(false);
      setSuggestions([]);
      router.push(`/anime/${malId}`);
    },
    [router]
  );

  const seeAll = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setOpen(false);
    router.push(`/?q=${encodeURIComponent(trimmed)}`);
  }, [router, value]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) {
      if (e.key === "Enter" && value.trim()) {
        seeAll();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((i) => (i + 1) % suggestions.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((i) =>
        i <= 0 ? suggestions.length - 1 : i - 1
      );
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setHighlight(-1);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlight >= 0 && suggestions[highlight]) {
        goAnime(suggestions[highlight].mal_id);
      } else {
        seeAll();
      }
    }
  };

  return (
    <div ref={wrapRef} className="relative min-w-0">
      <label className="relative block w-full">
        <span className="sr-only">Search titles</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
          aria-hidden
        />
        <input
          type="search"
          value={value}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={open ? listId : undefined}
          aria-expanded={open}
          role="combobox"
          placeholder="Search titles…"
          className="w-full rounded-full border border-white/15 bg-black/35 py-2 pl-9 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none ring-cyan-500/40 backdrop-blur-md focus:border-cyan-500/40 focus:ring-2"
        />
      </label>

      {open && (suggestions.length > 0 || suggestLoading) ? (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-[60] max-h-[min(70vh,380px)] overflow-auto rounded-xl border border-white/15 bg-zinc-950/95 py-1 shadow-2xl shadow-black/50 backdrop-blur-xl"
        >
          {suggestLoading && suggestions.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-zinc-500">Searching…</p>
          ) : null}
          {!suggestLoading && suggestions.length === 0 ? (
            <p className="px-3 py-2.5 text-xs text-zinc-500">
              No matches. Try another spelling.
            </p>
          ) : null}
          {suggestions.map((a, i) => {
            const title = a.title_english || a.title;
            const active = i === highlight;
            return (
              <button
                key={a.mal_id}
                type="button"
                role="option"
                aria-selected={active}
                className={cn(
                  "flex w-full items-center gap-2 px-2 py-1.5 text-left transition",
                  active ? "bg-cyan-500/15" : "hover:bg-white/5"
                )}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => goAnime(a.mal_id)}
              >
                <div className="relative h-11 w-8 shrink-0 overflow-hidden rounded bg-zinc-800">
                  {a.image_url ? (
                    <Image
                      src={a.image_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[8px] text-zinc-600">
                      —
                    </div>
                  )}
                </div>
                <span className="min-w-0 flex-1 line-clamp-2 text-sm font-medium text-zinc-100">
                  {title}
                </span>
              </button>
            );
          })}
          {value.trim().length >= MIN_QUERY_LEN ? (
            <div className="border-t border-white/10 px-1 pt-1">
              <button
                type="button"
                className="w-full rounded-lg px-2 py-2 text-left text-xs font-medium text-cyan-400 transition hover:bg-white/5"
                onMouseDown={(e) => e.preventDefault()}
                onClick={seeAll}
              >
                See all results for &quot;{value.trim()}&quot;
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
