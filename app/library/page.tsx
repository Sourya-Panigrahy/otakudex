import { LibraryView } from "@/components/library-view";

export default function LibraryPage() {
  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl dark:text-zinc-50">
          My list
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-600 sm:mt-2 dark:text-zinc-400">
          Plan to watch, watching, and completed. Adjust episode counts as you
          go.
        </p>
      </div>
      <LibraryView />
    </>
  );
}
