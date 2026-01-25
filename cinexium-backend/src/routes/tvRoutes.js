import express from "express"
import { getLatestTvController, getOnTheAirTvController, getPopularTvController, getTopRatedTvController, getTvDetailsController } from "../controllers/tvController.js"

const router = express.Router()


router.get("/on-the-air", getOnTheAirTvController)
router.get("/popular", getPopularTvController)
router.get("/top-rated", getTopRatedTvController)
router.get("/latest", getLatestTvController)
router.get("/:tmdbId/details", getTvDetailsController)

export default router