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
      videos
    }
  } catch (error) {
    return {
      status:error.status || 500,
      message:error.message || "Failed to fetch TV details"
    }
  }
};
