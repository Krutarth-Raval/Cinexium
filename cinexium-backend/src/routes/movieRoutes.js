import express from "express";
import {
  getLatestMoviesController,
  getMovieDetailsController,
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


export default router;
