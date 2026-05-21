import { tmdbGet } from "../utils/tmdbClient.js";

export const getNowPlayingMoviesService = async () => {
  return await tmdbGet("/movie/now_playing");
};

export const getPopularMoviesService = async () => {
  return await tmdbGet("/movie/popular");
};

export const getTopRatedMoviesService = async () => {
  return await tmdbGet("/movie/top_rated");
};

export const getLatestMoviesService = async (page = 1) => {
  return await tmdbGet("/discover/movie", {
    sort_by: "release_date.desc",
    page,
  });
};

//movie details service
export const getMovieDetailsService = async (tmdbId) => {
  if (!tmdbId) {
    throw { status: 400, message: "Movie id is required" };
  }
  try {
    const [details, credits, videos] = await Promise.all([
      tmdbGet(`/movie/${tmdbId}`),
      tmdbGet(`/movie/${tmdbId}/credits`),
      tmdbGet(`/movie/${tmdbId}/videos`),
    ]);

    return {
      details,
      credits,
      videos,
    };
  } catch (error) {
    throw {
      status: error.status || 500,
      message: error.message || "Failed to fetch movie details",
      original: error.original || error,
    };
  }
};

//movie recommendation service
export const getMovieRecommendationService = async (tmdbId) => {
  // check if tmdb id Exists or not
  if (!tmdbId) {
    throw {
      status: 400,
      message: "Movie ID is required",
    };
  }

  try {
    const recommendations = await tmdbGet(`/movie/${tmdbId}/recommendations`);
    return recommendations;
  } catch (error) {
    throw {
      status: error.status || 500,
      message: error.message || "Failed to fetch movie recommendations",
      original: error.original || error,
    };
  }
};

// movie genres list
export const getMovieGenresService = async () => {
  try {
    const res = await tmdbGet("/genre/movie/list");

    return res.genres;
  } catch (error) {
    throw {
      status: error.status || 500,
      message: error.message || "Failed to fetch Movie Genres.",
    };
  }
};

// discover movie service
export const getDiscoverMovieService = async (genre, page = 1) => {
  try {
    const res = await tmdbGet(
      `/discover/movie?with_genres=${genre}&page=${page}`,
    );

    return {
      results: res.results,
      page: res.page,
      totalPages: res.total_pages,
      totalResults: res.total_results,
    };
  } catch (error) {
    throw {
      status: error.status || 500,
      message: error.message || "failed to discover movies by genre",
    };
  }
};
