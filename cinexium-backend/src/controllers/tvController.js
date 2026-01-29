import {
  getLatestTvService,
  getOnTheAirTvService,
  getPopularTvService,
  getTopRatedTvService,
  getTvDetailsService,
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
