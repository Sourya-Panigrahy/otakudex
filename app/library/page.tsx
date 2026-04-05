import { LibraryView } from "@/components/library-view";

export const dynamic = "force-dynamic";

export default function LibraryPage() {
  return (
    <>
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-3xl font-bold tracking-[0.18em] text-zinc-50 uppercase sm:text-4xl">
          My list
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-zinc-500 sm:mx-0">
          A list matching title, type, and progress like a classic library
          grid.
        </p>
      </div>
      <LibraryView />
    </>
  );
}
