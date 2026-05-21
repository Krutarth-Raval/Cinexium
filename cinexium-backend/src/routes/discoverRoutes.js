import express from 'express'
import { getDiscoverMovieController } from '../controllers/movieController.js';
import { getDiscoverTvController } from '../controllers/tvController.js';

const router = express.Router()

// Discover movie from genre 
router.get("/movie", getDiscoverMovieController)
//discover tv from genre
router.get("/tv", getDiscoverTvController)

export default router;
