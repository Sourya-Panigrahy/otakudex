import {
  getSeasonsBrowse,
  padSeasonFirstPageIfEleven,
  type SeasonsBrowseKind,
  type SeasonsBrowseResult,
} from "@/lib/jikan";

/**
 * Discover listing: page 1 uses the same 11→12 pad as the home teaser so wide
 * grids don’t show a hole. Page 2+ unchanged. The 12th title may repeat as the
 * first card on page 2 if the user paginates.
 */
export async function getSeasonsBrowseDiscover(
  kind: SeasonsBrowseKind,
  page: number
): Promise<SeasonsBrowseResult> {
  const r = await getSeasonsBrowse(kind, page, 25);
  if (page !== 1) return r;
  const data = await padSeasonFirstPageIfEleven(kind, r.data, r.hasNextPage);
  return { ...r, data };
}
