import { Metadata } from "next";
import { MoviesView } from "@/components/movies";
import {
  getPopularMovies,
  getTopRatedMovies,
  getTrendingMovies,
} from "@/lib/tmdb";

export const metadata: Metadata = {
  title: "Movies",
  description: "Browse, discover, and track movies across genres.",
};

export const dynamic = "force-dynamic";

export default async function MoviesPage() {
  const [trending, popular, topRated] = await Promise.all([
    getTrendingMovies("week"),
    getPopularMovies(1),
    getTopRatedMovies(1),
  ]);

  return (
    <div className="space-y-8 pb-12">
      <MoviesView
        initialTrending={trending}
        initialPopular={popular}
        initialTopRated={topRated}
      />
    </div>
  );
}
