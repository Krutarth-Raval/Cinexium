import express from "express"
import { authMiddleware } from "../middlewares/authMiddleware.js"
import { addOrUpdateRatingController, getRatingStatsController, removeRatingController } from "../controllers/ratingController.js"
const router = express.Router()

router.post("/", authMiddleware, addOrUpdateRatingController)
router.get("/:mediaType/:mediaId", authMiddleware, getRatingStatsController)
router.delete("/:mediaType/:mediaId", authMiddleware, removeRatingController)
export default router