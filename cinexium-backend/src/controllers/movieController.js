import {
  getDiscoverMovieService,
  getLatestMoviesService,
  getMovieDetailsService,
  getMovieGenresService,
  getMovieRecommendationService,
  getNowPlayingMoviesService,
  getPopularMoviesService,
  getTopRatedMoviesService,
} from "../services/movieService.js";

export const getNowPlayingMoviesController = async (req, res) => {
  try {
    const data = await getNowPlayingMoviesService();

    return res.status(200).json({ status: 200, data });
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message,
    });
  }
};

export const getPopularMoviesController = async (req, res) => {
  try {
    const data = await getPopularMoviesService();
    return res.status(200).json({ status: 200, data });
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message,
    });
  }
};

export const getTopRatedMoviesController = async (req, res) => {
  try {
    const data = await getTopRatedMoviesService();
    return res.status(200).json({ status: 200, data });
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message,
    });
  }
};

export const getLatestMoviesController = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const data = await getLatestMoviesService(page);

    return res.status(200).json({ status: 200, data });
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message,
    });
  }
};

//movie detail controller
export const getMovieDetailsController = async (req, res) => {
  try {
    const tmdbId = req.params.tmdbId;
    const movieDetails = await getMovieDetailsService(tmdbId);

    return res.status(200).json({
      status: 200,
      data: movieDetails,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};

//movie recommendation controller
export const getMovieRecommendationController = async (req, res) => {
  try {
    const tmdbId = req.params.tmdbId;
    const recommendations = await getMovieRecommendationService(tmdbId);
    return res.status(200).json({
      status: 200,
      data: recommendations,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};

// Movie genres Controller
export const getMovieGenresController = async (req, res) => {
  try {
    const genres = await getMovieGenresService();
    return res.status(200).json({
      status: 200,
      data: genres,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
};

// discover movie by genre

export const getDiscoverMovieController = async (req, res) => {
  try {
    const { genre, page } = req.query;

    const movies = await getDiscoverMovieService(genre, page);
    
    return res.status(200).json({
      status: 200,
      data: movies,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message,
    });
  }
};
