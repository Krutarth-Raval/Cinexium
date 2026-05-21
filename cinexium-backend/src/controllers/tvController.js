import {
  getDiscoverTvService,
  getLatestTvService,
  getOnTheAirTvService,
  getPopularTvService,
  getTopRatedTvService,
  getTvDetailsService,
  getTvGenresService,
  getTvRecommendationService,
  getTvSeasonEpisodesService,
  getTvSeasonsService,
} from "../services/tvService.js";

export const getOnTheAirTvController = async (req, res) => {
  try {
    const data = await getOnTheAirTvService();
    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message,
    });
  }
};

export const getPopularTvController = async (req, res) => {
  try {
    const data = await getPopularTvService();
    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message,
    });
  }
};

export const getTopRatedTvController = async (req, res) => {
  try {
    const data = await getTopRatedTvService();
    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message,
    });
  }
};

export const getLatestTvController = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const data = await getLatestTvService(page);
    return res.status(200).json({ status: 200, data });
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message,
    });
  }
};

//get tv details
export const getTvDetailsController = async (req, res) => {
  try {
    const tmdbId = req.params.tmdbId;
    const tvDetails = await getTvDetailsService(tmdbId);
    return res.status(200).json({
      status: 200,
      data: tvDetails,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message,
    });
  }
};

//get TV seasons
export const getTvSeasonsController = async (req, res) => {
  try {
    const { tmdbId, seasonNumber } = req.params;

    const data = await getTvSeasonsService(tmdbId, seasonNumber);

    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

//get TV seasons episodes
export const getTvSeasonEpisodesController = async (req, res) => {
  try {
    const { tmdbId, seasonNumber, episodeNumber } = req.params;
    const data = await getTvSeasonEpisodesService(
      tmdbId,
      seasonNumber,
      episodeNumber,
    );
    return res.status(200).json({
      status: 200,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

// get Tv recommendations
export const getTvRecommendationController = async (req, res) => {
  const tmdbId = req.params.tmdbId;

  const recommendations = await getTvRecommendationService(tmdbId);
  try {
    return res.status(200).json({
      status: 200,
      data: recommendations,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      status: 500,
      message: error.message,
    });
  }
};

// get Tv Genres

export const getTvGenresController = async (req, res) => {
  try {
    const genres = await getTvGenresService();
    return res.status(200).json({
      status: 200,
      data: genres,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      status: 500,
      message: error.message,
    });
  }
};

// discover Tv by genre
export const getDiscoverTvController = async (req, res) => {
  try {
    const { genre,page } = req.query;
    const tv = await getDiscoverTvService(genre, page);

    return res.status(200).json({
      status: 200,
      data: tv,
    });
  } catch (error) {
    return res
      .status(error.status || 500)
      .json({ status: 500, message: error.message });
  }
};
