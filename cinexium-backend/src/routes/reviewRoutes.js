import express from "express"
import { authMiddleware } from "../middlewares/authMiddleware.js"
import { createReviewController, deleteReviewController, getReviewsController, toggleReviewLikeController, updateReviewController } from "../controllers/reviewController.js"
import { optionalAuthMiddleware } from "../middlewares/optionalAuthMiddleware.js"

const router = express.Router()

router.post("/", authMiddleware, createReviewController)
router.put("/", authMiddleware, updateReviewController)
router.delete("/:reviewId", authMiddleware, deleteReviewController)
router.get("/", optionalAuthMiddleware, getReviewsController)
router.post("/:reviewId/like", authMiddleware, toggleReviewLikeController);

export default router