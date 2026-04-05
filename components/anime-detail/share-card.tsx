"use client";

import { Link2, X } from "lucide-react";
import { useCallback, useState } from "react";

/** Lucide dropped brand icons; minimal “f” glyph for the Facebook share button. */
function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

type ShareCardProps = {
  url: string;
  title: string;
};

export function AnimeDetailShareCard({ url, title }: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const encoded = encodeURIComponent(url);
  const text = encodeURIComponent(title);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [url]);

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
        Share
      </h2>
      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-zinc-800 text-zinc-300 transition hover:border-sky-500/40 hover:bg-zinc-700 hover:text-sky-400"
          aria-label="Share on Facebook"
        >
          <FacebookIcon className="h-5 w-5" />
        </a>
        <a
          href={`https://twitter.com/intent/tweet?url=${encoded}&text=${text}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-zinc-800 text-zinc-300 transition hover:border-sky-400/40 hover:bg-zinc-700 hover:text-sky-400"
          aria-label="Share on X"
        >
          <X className="h-5 w-5" strokeWidth={2.25} />
        </a>
        <button
          type="button"
          onClick={() => void copy()}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-zinc-800 text-zinc-300 transition hover:border-cyan-500/40 hover:bg-zinc-700 hover:text-cyan-400"
          aria-label="Copy link"
        >
          <Link2 className="h-5 w-5" />
        </button>
      </div>
      {copied ? (
        <p className="mt-3 text-xs text-cyan-400">Link copied</p>
      ) : null}
    </section>
  );
}
