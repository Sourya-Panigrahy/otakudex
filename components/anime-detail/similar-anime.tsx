import Image from "next/image";
import Link from "next/link";

import type { AnimeListDto } from "@/lib/jikan";

type SimilarAnimeProps = {
  items: AnimeListDto[];
};

export function AnimeDetailSimilarAnime({ items }: SimilarAnimeProps) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-5 sm:p-6">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
        Similar anime
      </h2>
      <ul className="mt-4 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((a) => (
          <li key={a.mal_id} className="w-24 shrink-0 sm:w-28">
            <Link
              href={`/anime/${a.mal_id}`}
              className="block overflow-hidden rounded-xl border border-white/10 bg-zinc-800/80 outline-none ring-cyan-500/40 transition hover:border-cyan-500/30 focus-visible:ring-2"
            >
              <div className="relative aspect-2/3 w-full bg-zinc-800">
                {a.image_url ? (
                  <Image
                    src={a.image_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-zinc-600">
                    —
                  </div>
                )}
              </div>
              <p className="line-clamp-2 p-2 text-[11px] font-medium leading-snug text-zinc-200">
                {a.title_english || a.title}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
