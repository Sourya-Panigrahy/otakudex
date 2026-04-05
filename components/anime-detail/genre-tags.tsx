import {
  Drama,
  Flame,
  Ghost,
  Heart,
  HelpCircle,
  Leaf,
  type LucideIcon,
  Rocket,
  Sparkles,
  Swords,
  Zap,
} from "lucide-react";

function genreIcon(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes("drama")) return Drama;
  if (n.includes("fantasy")) return Leaf;
  if (n.includes("suspense") || n.includes("thriller") || n.includes("mystery"))
    return HelpCircle;
  if (n.includes("action")) return Swords;
  if (n.includes("romance")) return Heart;
  if (n.includes("comedy")) return Sparkles;
  if (n.includes("sci-fi") || n.includes("sci fi")) return Rocket;
  if (n.includes("horror")) return Ghost;
  if (n.includes("adventure")) return Flame;
  if (n.includes("supernatural")) return Zap;
  return Sparkles;
}

function genreStyles(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("drama"))
    return "bg-violet-500/20 text-violet-200 ring-violet-500/30";
  if (n.includes("fantasy"))
    return "bg-emerald-500/20 text-emerald-200 ring-emerald-500/30";
  if (n.includes("suspense") || n.includes("thriller") || n.includes("mystery"))
    return "bg-red-500/20 text-red-200 ring-red-500/30";
  if (n.includes("action"))
    return "bg-orange-500/20 text-orange-200 ring-orange-500/30";
  if (n.includes("romance"))
    return "bg-pink-500/20 text-pink-200 ring-pink-500/30";
  if (n.includes("comedy"))
    return "bg-amber-500/20 text-amber-200 ring-amber-500/30";
  if (n.includes("sci-fi") || n.includes("sci fi"))
    return "bg-cyan-500/20 text-cyan-200 ring-cyan-500/30";
  return "bg-zinc-500/20 text-zinc-200 ring-white/10";
}

type GenreTagsProps = {
  genres: string[];
};

export function AnimeDetailGenreTags({ genres }: GenreTagsProps) {
  if (genres.length === 0) return null;

  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
        Genres
      </h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {genres.map((g) => {
          const Icon = genreIcon(g);
          return (
            <span
              key={g}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset ${genreStyles(g)}`}
            >
              <Icon className="h-3.5 w-3.5 opacity-90" aria-hidden />
              {g}
            </span>
          );
        })}
      </div>
    </section>
  );
}
