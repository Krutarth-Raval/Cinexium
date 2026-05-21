import express from 'express'
import { getMovieGenresController } from '../controllers/movieController.js'
import { getTvGenresController } from '../controllers/tvController.js'
const router = express.Router()

// For movie
router.get("/movie/list", getMovieGenresController)
//For series
router.get("/tv/list", getTvGenresController)
export default router
