type SynopsisSectionProps = {
  synopsis: string;
  sourceNote: string | null;
};

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/** Pull trailing "(Source: …)" for footer attribution. */
export function extractSourceFromSynopsis(raw: string): {
  body: string;
  source: string | null;
} {
  const cleaned = stripTags(raw);
  const m = cleaned.match(/\((?:Source|source):\s*([^)]+)\)\s*$/);
  if (!m) return { body: cleaned, source: null };
  const source = m[1]?.trim() ?? null;
  const body = cleaned.slice(0, m.index).trim();
  return { body, source };
}

export function AnimeDetailSynopsis({ synopsis, sourceNote }: SynopsisSectionProps) {
  const paragraphs = synopsis
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const [lead, ...rest] =
    paragraphs.length >= 2 ? [paragraphs[0]!, paragraphs.slice(1)] : [null, paragraphs];

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
        Synopsis
      </h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-zinc-300">
        {lead ? (
          <blockquote className="border-l-4 border-violet-500/60 pl-4 text-zinc-200">
            {lead}
          </blockquote>
        ) : null}
        {lead ? (
          rest.map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))
        ) : (
          paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))
        )}
      </div>
      {sourceNote ? (
        <p className="mt-6 text-xs text-zinc-500">(Source: {sourceNote})</p>
      ) : null}
    </section>
  );
}
