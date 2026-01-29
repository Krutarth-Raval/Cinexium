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
