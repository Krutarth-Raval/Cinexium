import express from "express";
import {
  getLatestMoviesController,
  getMovieDetailsController,
  getMovieRecommendationController,
  getNowPlayingMoviesController,
  getPopularMoviesController,
  getTopRatedMoviesController,
} from "../controllers/movieController.js";

const router = express.Router();

router.get("/now-playing", getNowPlayingMoviesController);
router.get("/popular", getPopularMoviesController);
router.get("/top-rated", getTopRatedMoviesController);
router.get("/latest", getLatestMoviesController);

//movie details route
router.get("/:tmdbId/details", getMovieDetailsController)

//movie recommendation route

router.get("/:tmdbId/recommendations", getMovieRecommendationController)


export default router;
