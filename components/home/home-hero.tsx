"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import type { AnimeListDto } from "@/lib/jikan";

type HomeHeroProps = {
  featuredItems: AnimeListDto[];
};

function FullBleed({ children }: { children: ReactNode }) {
  return (
    <div className="relative left-1/2 -mt-28 w-screen max-w-[100vw] -translate-x-1/2 sm:-mt-32">
      {children}
    </div>
  );
}

export function HomeHero({ featuredItems }: HomeHeroProps) {
  const slides = useMemo(
    () => featuredItems.filter((x) => Boolean(x.image_url)),
    [featuredItems]
  );
  const [index, setIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = (next: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setIndex(next);
      setIsTransitioning(false);
    }, 300);
  };

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => {
      goTo((index + 1) % slides.length);
    }, 6500);
    return () => clearInterval(t);
  }, [slides.length, index]);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [index, slides.length]);

  const featured = slides[index];

  if (!featured?.image_url) {
    return (
      <FullBleed>
        <section className="relative mb-8 overflow-hidden bg-zinc-950 px-0 pb-16 pt-28 sm:pb-24 sm:pt-36">
          {/* Ambient gradient orbs */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-40 -top-20 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 h-[400px] w-[600px] rounded-full bg-violet-600/8 blur-[100px]" />
          </div>
          {/* Dot grid */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "radial-gradient(circle, #fff 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative mx-auto w-full max-w-[1920px] px-6 sm:px-8 lg:px-12">
            <div className="max-w-lg">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/25 bg-cyan-400/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-cyan-400">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Discover Anime
              </span>
              <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl">
                Your anime hub.
                <br />
                <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-sky-400 bg-clip-text text-transparent">
                  Track everything.
                </span>
              </h1>
              <p className="mt-5 max-w-sm text-base leading-relaxed text-zinc-400">
                Search the Jikan database, save shows to your list, and keep
                episode progress in sync.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/#seasonal"
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-400 hover:shadow-orange-400/30 active:scale-[0.97]"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Add to list
                </Link>
                <Link
                  href="/#seasonal"
                  className="rounded-xl border border-white/10 bg-white/6 px-6 py-3 text-sm font-semibold text-zinc-100 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10 active:scale-[0.97]"
                >
                  Browse seasonal
                </Link>
              </div>
            </div>
          </div>
        </section>
      </FullBleed>
    );
  }

  const displayTitle = featured.title_english || featured.title;
  const ep = featured.episodes;
  const score = (featured as any).score;

  return (
    <FullBleed>
      <section className="relative mb-8 overflow-hidden sm:mb-10">
        <div className="relative min-h-[min(76vh,780px)] w-full bg-zinc-950 sm:min-h-[min(72vh,800px)] lg:min-h-[min(70vh,840px)]">

          {/* ── Layer 0: blurred color-wash behind everything ── */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            {slides.map((s, i) => (
              <Image
                key={`wash-${s.mal_id}`}
                src={s.image_url!}
                alt=""
                fill
                className={`scale-125 object-cover object-top blur-3xl saturate-200 transition-opacity duration-700 ${
                  i === index ? "opacity-40" : "opacity-0"
                }`}
                sizes="100vw"
                priority={i === 0}
              />
            ))}
            {/* darken the wash so it reads as ambient, not literal */}
            <div className="absolute inset-0 bg-zinc-950/60" />
          </div>

          {/* ── Layer 1: sharp hero image, pinned to the right half ── */}
          {/*
            We use a right-anchored absolute box that covers 55–100% width.
            object-top ensures the character's face is always visible.
            A soft left-edge mask fades it into the content panel.
          */}
          <div className="absolute inset-y-0 right-0 z-[1] w-full sm:w-[65%] lg:w-[60%]">
            {slides.map((s, i) => (
              <div
                key={`hero-${s.mal_id}`}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  i === index ? "opacity-100" : "opacity-0"
                }`}
              >
                <Image
                  src={s.image_url!}
                  alt={s.title_english || s.title}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 640px) 100vw, 65vw"
                  priority={i === 0}
                />
              </div>
            ))}

            {/* Left-edge feather: fades the image into the dark content panel */}
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-2/3"
              aria-hidden
              style={{
                background:
                  "linear-gradient(90deg, rgb(9,9,11) 0%, rgba(9,9,11,0.85) 25%, rgba(9,9,11,0.4) 60%, transparent 100%)",
              }}
            />
            {/* Bottom fade into page */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-2/5"
              aria-hidden
              style={{
                background:
                  "linear-gradient(180deg, transparent 0%, rgba(9,9,11,0.75) 60%, rgb(9,9,11) 100%)",
              }}
            />
            {/* Top fade (under nav) */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32"
              aria-hidden
              style={{
                background:
                  "linear-gradient(180deg, rgb(9,9,11) 0%, transparent 100%)",
              }}
            />
          </div>

          {/* Wide click target for the whole hero */}
          <Link
            href={`/anime/${featured.mal_id}`}
            aria-label={`View details for ${displayTitle}`}
            className="absolute inset-0 z-[3] block"
          />

          {/* ── Content panel — left-anchored ── */}
          <div className="absolute inset-0 z-10 flex flex-col justify-end">
            <div className="mx-auto w-full max-w-[1920px] px-6 pb-10 sm:px-10 sm:pb-14 lg:px-14 lg:pb-16">
              <div className="max-w-xl">

                {/* Badge row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-[5px] text-[11px] font-bold uppercase tracking-[0.1em] text-cyan-300 backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" aria-hidden />
                    Airing now
                  </span>
                  {ep != null && (
                    <span className="rounded-full border border-white/10 bg-black/40 px-3 py-[5px] text-[11px] font-medium text-zinc-400 backdrop-blur-sm">
                      {ep} eps
                    </span>
                  )}
                  {score != null && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-[5px] text-[11px] font-bold text-amber-300 backdrop-blur-sm">
                      ★ {score}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1
                  className={`mt-4 font-black uppercase leading-[1.05] tracking-tight text-white sm:mt-5
                    text-3xl sm:text-4xl md:text-5xl lg:text-[3rem]
                    [text-shadow:0_2px_24px_rgba(0,0,0,0.8)]
                    transition-opacity duration-300 ${isTransitioning ? "opacity-0" : "opacity-100"}`}
                >
                  {displayTitle}
                </h1>

                {/* CTA row */}
                <div className="relative z-20 mt-6 flex flex-wrap gap-3 sm:mt-7">
                  <Link
                    href={`/anime/${featured.mal_id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:bg-orange-400 hover:shadow-orange-400/35 active:scale-[0.97]"
                  >
                    <Plus className="h-4 w-4 shrink-0" aria-hidden />
                    Add to list
                  </Link>
                  <Link
                    href={`/anime/${featured.mal_id}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition-all hover:border-white/25 hover:bg-white/12 active:scale-[0.97]"
                  >
                    <Play className="h-3.5 w-3.5 shrink-0 fill-current" aria-hidden />
                    View details
                  </Link>
                </div>

                {/* Carousel controls */}
                {slides.length > 1 && (
                  <div className="relative z-20 mt-7 flex items-center gap-3 sm:mt-8">
                    <button
                      type="button"
                      aria-label="Previous"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/60 backdrop-blur transition hover:border-white/30 hover:bg-black/70 hover:text-white active:scale-95"
                      onClick={() => goTo((index - 1 + slides.length) % slides.length)}
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label="Next"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/60 backdrop-blur transition hover:border-white/30 hover:bg-black/70 hover:text-white active:scale-95"
                      onClick={() => goTo((index + 1) % slides.length)}
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </button>

                    {/* Dot indicators */}
                    <div className="flex items-center gap-1.5" role="tablist">
                      {slides.slice(0, 8).map((s, i) => (
                        <button
                          key={s.mal_id}
                          type="button"
                          role="tab"
                          aria-label={`Slide ${i + 1}`}
                          aria-selected={i === index}
                          className={`h-1 rounded-full transition-all duration-300 ${
                            i === index
                              ? "w-8 bg-cyan-400"
                              : "w-2 bg-white/20 hover:bg-white/40"
                          }`}
                          onClick={() => goTo(i)}
                        />
                      ))}
                    </div>

                    {/* Counter */}
                    <span className="ml-auto text-[11px] font-semibold tabular-nums text-white/30">
                      {String(index + 1).padStart(2, "0")}
                      <span className="mx-1 text-white/15">/</span>
                      {String(slides.length).padStart(2, "0")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Thumbnail strip — bottom-right corner, inside overflow ── */}
          {slides.length > 1 && (
            <div className="absolute bottom-10 right-6 z-20 hidden flex-row gap-2 sm:bottom-14 sm:right-10 md:flex lg:bottom-16 lg:right-14">
              {slides.slice(0, 6).map((s, i) => (
                <button
                  key={s.mal_id}
                  type="button"
                  aria-label={`Go to ${s.title_english || s.title}`}
                  onClick={() => goTo(i)}
                  className={`relative h-14 w-10 overflow-hidden rounded-md transition-all duration-200 lg:h-16 lg:w-12 ${
                    i === index
                      ? "ring-2 ring-cyan-400 ring-offset-1 ring-offset-zinc-950 opacity-100"
                      : "opacity-40 hover:opacity-70"
                  }`}
                >
                  <Image
                    src={s.image_url!}
                    alt={s.title_english || s.title}
                    fill
                    className="object-cover object-top"
                    sizes="48px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </FullBleed>
  );
}