import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";

import type { AnimeListDto } from "@/lib/jikan";

type HomeHeroProps = {
  featured: AnimeListDto | undefined;
};

/** Break a long title into balanced lines; first half lines white, rest cyan (mock-style). */
function splitTitleForHero(title: string): { lines: string[]; whiteLineCount: number } {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return { lines: [], whiteLineCount: 0 };
  }
  if (words.length <= 2) {
    return { lines: [words.join(" ")], whiteLineCount: 1 };
  }

  const charLen = title.length;
  const lineCount =
    charLen > 56 ? 4 : charLen > 36 ? 3 : 2;

  const lines: string[] = [];
  const n = words.length;
  let w = 0;
  for (let L = 0; L < lineCount; L++) {
    const remainingLines = lineCount - L;
    const remainingWords = n - w;
    const take = Math.ceil(remainingWords / remainingLines);
    const chunk = words.slice(w, w + take);
    w += take;
    if (chunk.length) lines.push(chunk.join(" "));
  }

  const whiteLineCount = Math.ceil(lines.length / 2);
  return { lines, whiteLineCount };
}

function HeroTitleBlock({ title }: { title: string }) {
  const { lines, whiteLineCount } = splitTitleForHero(title);
  if (lines.length === 0) return null;

  return (
    <h1 className="mt-3 text-xl font-bold uppercase leading-[1.15] tracking-tight sm:mt-4 sm:text-2xl sm:leading-[1.12] md:text-3xl lg:text-4xl lg:leading-[1.1] xl:text-[2.25rem] xl:leading-[1.08]">
      {lines.map((line, i) => {
        const isWhite = i < whiteLineCount;
        return (
          <span
            key={i}
            className={
              isWhite
                ? "block text-white"
                : "block bg-gradient-to-r from-cyan-200 to-cyan-400 bg-clip-text text-transparent"
            }
          >
            {line}
          </span>
        );
      })}
    </h1>
  );
}

/**
 * Full-bleed width, pulled up under the transparent header (cancels main top padding + header overlap).
 */
function FullBleed({ children }: { children: ReactNode }) {
  return (
    <div className="relative left-1/2 -mt-28 w-screen max-w-[100vw] -translate-x-1/2 sm:-mt-32">
      {children}
    </div>
  );
}

export function HomeHero({ featured }: HomeHeroProps) {
  if (!featured?.image_url) {
    return (
      <FullBleed>
        <section className="relative mb-6 overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-950 to-cyan-950/40 px-0 pb-14 pt-24 sm:pb-20 sm:pt-28">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.15),transparent_40%),radial-gradient(circle_at_80%_60%,rgba(249,115,22,0.12),transparent_35%)]" />
          <div className="relative mx-auto w-full px-4 sm:px-6 lg:px-10 xl:px-12">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                Discover
              </p>
              <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-zinc-50 sm:text-4xl">
                <span className="block">Your anime hub</span>
                <span className="block bg-gradient-to-r from-cyan-400 to-cyan-200 bg-clip-text text-transparent">
                  Track everything
                </span>
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                Search the Jikan database, save shows to your list, and keep
                episode progress in sync.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/#seasonal"
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/25 transition hover:bg-orange-400"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Add to list
                </Link>
                <Link
                  href="/#seasonal"
                  className="rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium text-zinc-100 backdrop-blur transition hover:bg-white/15"
                >
                  View details
                </Link>
              </div>
            </div>
          </div>
        </section>
      </FullBleed>
    );
  }

  const displayTitle = featured.title_english || featured.title;
  const nativeTitle =
    featured.title_english && featured.title !== featured.title_english
      ? featured.title
      : null;
  const ep = featured.episodes;

  return (
    <FullBleed>
      <section className="relative mb-6 overflow-hidden sm:mb-8">
        <div className="relative min-h-[min(88vh,920px)] w-full overflow-hidden sm:min-h-[min(86vh,960px)] lg:min-h-[min(84vh,1000px)]">
          <div className="absolute inset-x-0 bottom-0 -top-28 z-0 sm:-top-32">
            <Image
              src={featured.image_url}
              alt=""
              fill
              className="object-cover object-top"
              sizes="100vw"
              priority
            />
          </div>
          <div
            className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-black/80 via-black/30 to-transparent sm:from-black/75 sm:via-black/20"
            aria-hidden
          />
          {/* Lighter top = more art visible under the nav; stronger fade at bottom into page */}
          <div
            className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-zinc-950 from-[18%] via-black/45 via-45% to-black/25 to-[100%]"
            aria-hidden
          />

          <div className="absolute inset-0 z-10 flex min-h-full flex-col justify-end">
            <div className="mx-auto w-full max-w-[1920px] px-4 pb-10 sm:px-6 sm:pb-12 lg:px-10 lg:pb-14 xl:px-12">
              <div className="max-w-5xl">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-zinc-400">
                  <span className="rounded-md bg-black/50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-300 backdrop-blur-sm">
                    Currently airing
                  </span>
                  {ep != null ? (
                    <span className="text-zinc-400">
                      <span className="text-zinc-600">·</span> {ep} episodes
                    </span>
                  ) : null}
                </p>
                <HeroTitleBlock title={displayTitle} />
                {nativeTitle ? (
                  <p className="mt-3 max-w-2xl text-sm font-normal normal-case leading-snug text-zinc-300 sm:mt-4 sm:text-base">
                    {nativeTitle}
                  </p>
                ) : null}
                <div className="mt-8 flex flex-wrap gap-3 sm:mt-10">
                  <Link
                    href={`/anime/${featured.mal_id}`}
                    className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-400"
                  >
                    <Plus className="h-4 w-4 shrink-0" aria-hidden />
                    Add to list
                  </Link>
                  <Link
                    href={`/anime/${featured.mal_id}`}
                    className="rounded-lg bg-white/10 px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/15"
                  >
                    View details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </FullBleed>
  );
}
