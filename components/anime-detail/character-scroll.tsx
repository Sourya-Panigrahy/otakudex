import Image from "next/image";

import type { CharacterCardDto } from "@/lib/jikan";

type CharacterScrollProps = {
  characters: CharacterCardDto[];
};

export function AnimeDetailCharacterScroll({ characters }: CharacterScrollProps) {
  if (characters.length === 0) return null;

  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
        Voice cast &amp; characters
      </h2>
      <ul className="mt-4 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {characters.map((c) => (
          <li key={c.mal_id} className="w-20 shrink-0 text-center sm:w-24">
            <div className="relative mx-auto aspect-square w-16 overflow-hidden rounded-full border border-white/10 bg-zinc-800 sm:w-[4.5rem]">
              {c.image_url ? (
                <Image
                  src={c.image_url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="72px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-zinc-600">
                  ?
                </div>
              )}
            </div>
            <p className="mt-2 line-clamp-2 text-[11px] font-medium leading-tight text-zinc-200">
              {c.name}
            </p>
            {c.role ? (
              <p className="mt-0.5 text-[10px] text-zinc-500">{c.role}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
