import { tmdbGet } from "../utils/tmdbClient.js";

export const getOnTheAirTvService = async () => {
  return await tmdbGet("/tv/on_the_air");
};

export const getPopularTvService = async () => {
  return await tmdbGet("/tv/popular");
};

export const getTopRatedTvService = async () => {
  return await tmdbGet("/tv/top_rated");
};

export const getLatestTvService = async (page = 1) => {
  return await tmdbGet("/discover/tv", {
    sort_by: "first_air_date.desc",
    page,
  });
};

export const getTvDetailsService = async (tmdbId) => {
  if (!tmdbId) {
    return {
      status: 400,
      message: "TMDb ID is required",
    };
  }

  try {
    const [details, credits, videos] = await Promise.all([
      tmdbGet(`/tv/${tmdbId}`),
      tmdbGet(`/tv/${tmdbId}/credits`),
      tmdbGet(`/tv/${tmdbId}/videos`),
    ]);
    return {
      details,
      credits,
      videos,
    };
  } catch (error) {
    return {
      status: error.status || 500,
      message: error.message || "Failed to fetch TV details",
    };
  }
};

//get TV season service
export const getTvSeasonsService = async (tmdbId, seasonNumber) => {
  if (!tmdbId || !seasonNumber) {
    return {
      status: 400,
      message: "TMDb ID and season number required",
    };
  }

  try {
    const [seasonDetails, credits, videos] = await Promise.all([
      tmdbGet(`/tv/${tmdbId}/season/${seasonNumber}`),
      tmdbGet(`/tv/${tmdbId}/season/${seasonNumber}/credits`),
      tmdbGet(`/tv/${tmdbId}/season/${seasonNumber}/videos`),
    ]);

    return {
      seasonDetails,
      credits,
      videos,
    };
  } catch (error) {
    return {
      status: error.status || 500,
      message: error.message || "failed to fetch TV season details",
    };
  }
};

//get TV season's episode service
export const getTvSeasonEpisodesService = async (
  tmdbId,
  seasonNumber,
  episodeNumber,
) => {
  if (!tmdbId || !seasonNumber || !episodeNumber) {
    return {
      status: 400,
      message: "TMDb ID, season number and episode number are required",
    };
  }

  try {
    const [episodeDetails, credits, videos] = await Promise.all([
      tmdbGet(`/tv/${tmdbId}/season/${seasonNumber}/episode/${episodeNumber}`),
      tmdbGet(
        `/tv/${tmdbId}/season/${seasonNumber}/episode/${episodeNumber}/credits`,
      ),
      tmdbGet(
        `/tv/${tmdbId}/season/${seasonNumber}/episode/${episodeNumber}/videos`,
      ),
    ]);

    return {
      episodeDetails,
      credits,
      videos,
    };
  } catch (error) {
    return {
      status: error.status || 500,
      message: error.message || "failed to fetch episode details",
    };
  }
};

// tv recommendation service
export const getTvRecommendationService = async (tmdbId) => {
  if (!tmdbId) {
    throw {
      status: 400,
      message: "TV show ID is Required",
    };
  }

  try {
    const recommendations = await tmdbGet(`/tv/${tmdbId}/recommendations`);
    return recommendations;
  } catch (error) {
    throw {
      status: error.status || 500,
      message: error.message || "Failed to fetch TV recommendations",
    };
  }
};

// tv genres service
export const getTvGenresService = async () => {
  try {
    const res = await tmdbGet("/genre/tv/list");
    return res.genres;
  } catch (error) {
    throw {
      status: error.status || 500,
      message: error.message || "Failed to fetch tv genres list",
    };
  }
};

// discover tv by genre service
export const getDiscoverTvService = async (genre, page = 1) => {
  try {
    const res = await tmdbGet(`/discover/tv?with_genres=${genre}&page=${page}`);

    return {
      results: res.results,
      page: res.page,
      totalPages: res.total_pages,
      totalResults: res.total_results,
    };
  } catch (error) {
    throw {
      status: error.status || 500,
      message: error.message || "failed to discover Tv Shows by genre",
    };
  }
};
