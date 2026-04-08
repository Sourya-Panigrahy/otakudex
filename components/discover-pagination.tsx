import Link from "next/link";

type DiscoverPaginationProps = {
  basePath: string;
  currentPage: number;
  hasNextPage: boolean;
  lastPage: number;
};

export function DiscoverPagination({
  basePath,
  currentPage,
  hasNextPage,
  lastPage,
}: DiscoverPaginationProps) {
  const prev = currentPage > 1 ? currentPage - 1 : null;
  const next = hasNextPage ? currentPage + 1 : null;

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-3 pt-8 sm:gap-6"
      aria-label="Pagination"
    >
      {prev != null ? (
        <Link
          href={prev === 1 ? basePath : `${basePath}?page=${prev}`}
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/10"
        >
          Previous
        </Link>
      ) : (
        <span className="rounded-lg border border-transparent px-4 py-2 text-sm text-zinc-600">
          Previous
        </span>
      )}
      <span className="text-sm tabular-nums text-zinc-500">
        Page {currentPage} of {lastPage}
      </span>
      {next != null ? (
        <Link
          href={`${basePath}?page=${next}`}
          className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-white/10"
        >
          Next
        </Link>
      ) : (
        <span className="rounded-lg border border-transparent px-4 py-2 text-sm text-zinc-600">
          Next
        </span>
      )}
    </nav>
  );
}
