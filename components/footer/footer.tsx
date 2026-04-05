import Link from "next/link";

export function Footer() {
  return (
    <footer
      id="community"
      className="mt-auto border-t border-white/5 bg-zinc-950 py-10 text-sm text-zinc-500"
    >
      <div className="mx-auto flex max-w-[1920px] flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10 xl:px-12">
        <div>
          <Link href="/" className="text-base font-bold tracking-tight">
            <span className="text-cyan-400">OTAKU</span>{" "}
            <span className="text-zinc-100">DEX</span>
          </Link>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-zinc-500">
            Track what you watch, plan your backlog, and browse seasonal anime
            powered by Jikan.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
          <Link
            href="/"
            className="text-zinc-400 transition hover:text-cyan-400"
          >
            Browse
          </Link>
          <Link
            href="/library"
            className="text-zinc-400 transition hover:text-cyan-400"
          >
            My list
          </Link>
          <a
            href="https://docs.api.jikan.moe/"
            className="text-zinc-400 transition hover:text-cyan-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            Jikan API
          </a>
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-[1920px] border-t border-white/5 px-4 pt-6 sm:px-6 lg:px-10 xl:px-12">
        <p className="text-xs text-zinc-600">
          © {new Date().getFullYear()} Otaku Dex. Data from MyAnimeList via
          Jikan API.
        </p>
      </div>
    </footer>
  );
}
