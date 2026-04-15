"use client";

import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { parseMalAnimeListXml } from "@/lib/mal-export-xml";

const CHUNK = 15;

type MalImportCardProps = {
  onImported: () => void;
};

export function MalImportCard({ onImported }: MalImportCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runImport = useCallback(
    async (file: File) => {
      setError(null);
      setMessage(null);
      setBusy(true);
      try {
        const text = await file.text();
        const rows = parseMalAnimeListXml(text);
        const seen = new Set<number>();
        const unique = rows.filter((r) => {
          if (seen.has(r.malId)) return false;
          seen.add(r.malId);
          return true;
        });

        let totalImported = 0;
        let totalSkipped = 0;
        let totalDropped = 0;
        const allErrors: string[] = [];

        for (let i = 0; i < unique.length; i += CHUNK) {
          const chunk = unique.slice(i, i + CHUNK);
          setMessage(
            `Importing… ${Math.min(i + CHUNK, unique.length)} / ${unique.length}`
          );
          const res = await fetch("/api/entries/import-mal", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: chunk.map((r) => ({
                mal_id: r.malId,
                mal_list_status: r.malListStatus,
                watched_episodes: r.watchedEpisodes,
              })),
            }),
          });
          const json = (await res.json()) as {
            imported?: number;
            skipped?: number;
            dropped?: number;
            errors?: string[];
            error?: string;
          };
          if (!res.ok) {
            throw new Error(json.error ?? "Import failed");
          }
          totalImported += json.imported ?? 0;
          totalSkipped += json.skipped ?? 0;
          totalDropped += json.dropped ?? 0;
          if (json.errors?.length) allErrors.push(...json.errors);
        }

        onImported();
        setMessage(
          `Done: added ${totalImported}${totalSkipped ? `, skipped ${totalSkipped} (already on list)` : ""}${totalDropped ? `, ignored ${totalDropped} dropped` : ""}.`
        );
        if (allErrors.length > 0) {
          setError(`${allErrors.slice(0, 5).join(" ")}${allErrors.length > 5 ? "…" : ""}`);
        }
      } catch (e) {
        setMessage(null);
        setError(e instanceof Error ? e.message : "Import failed.");
      } finally {
        setBusy(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [onImported]
  );

  return (
    <Card className="rounded-lg border-border/80 bg-card shadow-sm">
      <CardHeader className="border-b border-border pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          Import MyAnimeList
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          On MyAnimeList, open{" "}
          <span className="font-medium text-foreground">Settings → Export</span>{" "}
          (or your list’s export) and download{" "}
          <span className="font-mono text-xs">animelist.xml</span>. Upload it
          here — titles are matched by MAL id and filled from our database.
          Large lists import in batches.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <input
          ref={inputRef}
          type="file"
          accept=".xml,text/xml,application/xml"
          className="sr-only"
          aria-hidden
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void runImport(f);
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy}
          className="gap-2"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4" aria-hidden />
          {busy ? "Importing…" : "Choose animelist.xml"}
        </Button>
        {message ? (
          <p className="mt-3 text-sm text-muted-foreground">{message}</p>
        ) : null}
        {error ? (
          <p className="mt-2 text-sm text-amber-600 dark:text-amber-400" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
