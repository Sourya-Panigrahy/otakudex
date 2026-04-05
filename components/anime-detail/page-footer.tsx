import Link from "next/link";
import { Sparkles } from "lucide-react";

export function AnimeDetailPageFooter() {
  return (
    <footer className="mt-12 border-t border-white/10 pt-8">
      <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-500">
        <Link href="/" className="transition hover:text-cyan-400">
          Home
        </Link>
        <Link href="/library" className="transition hover:text-cyan-400">
          My list
        </Link>
        <span className="cursor-default text-zinc-600">About</span>
        <span className="cursor-default text-zinc-600">Privacy policy</span>
        <span className="cursor-default text-zinc-600">Terms of use</span>
      </nav>
      <div className="mt-6 flex items-center justify-between">
        <p className="text-[11px] text-zinc-600">
          Anime data © MyAnimeList · via{" "}
          <a
            href="https://docs.api.jikan.moe/"
            className="text-zinc-500 underline hover:text-cyan-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            Jikan
          </a>
        </p>
        <Sparkles
          className="h-4 w-4 text-cyan-500/40"
          aria-hidden
        />
      </div>
    </footer>
  );
}
