import type { Metadata } from "next";

import { AnimeBrowseGrid } from "@/components/anime";
import { DiscoverPagination } from "@/components/discover";
import { BackLink } from "@/components/shared";
import { getSeasonsBrowseDiscover } from "@/lib/discover-pad";

export const metadata: Metadata = {
  title: "Seasonal hits",
  description: "Anime airing this season.",
};

const BASE = "/discover/seasonal";

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function SeasonalDiscoverPage(props: PageProps) {
  const sp = await props.searchParams;
  const raw = sp.page ?? "1";
  const page = Math.max(1, Number.parseInt(raw, 10) || 1);

  let browse;
  try {
    browse = await getSeasonsBrowseDiscover("now", page);
  } catch {
    return (
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm text-red-400">
          Could not load seasonal anime. Try again later.
        </p>
        <div className="mt-4">
          <BackLink href="/">Back home</BackLink>
        </div>
      </div>
    );
  }

  const { data, currentPage, hasNextPage, lastPage } = browse;

  return (
    <>
      <div className="mb-8">
        <BackLink href="/#seasonal">Home</BackLink>
        <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
          Seasonal hits
        </h1>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-zinc-500">No results on this page.</p>
      ) : (
        <AnimeBrowseGrid items={data} listKey="seasonal-p" priorityCount={8} />
      )}

      {data.length > 0 ? (
        <DiscoverPagination
          basePath={BASE}
          currentPage={currentPage}
          hasNextPage={hasNextPage}
          lastPage={lastPage}
        />
      ) : null}
    </>
  );
}
