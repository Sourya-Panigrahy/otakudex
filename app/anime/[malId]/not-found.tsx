import Link from "next/link";

export default function AnimeNotFound() {
  return (
    <div className="mx-auto max-w-lg py-12 text-center sm:py-20">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Anime not found
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        That title may not exist in Jikan, or the API is temporarily unavailable.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block text-sm font-medium text-zinc-900 underline dark:text-zinc-100"
      >
        Back to search
      </Link>
    </div>
  );
}
