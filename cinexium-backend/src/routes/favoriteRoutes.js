import express  from "express"
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { addToFavoritesController, getFavoritesController, removeFromFavoritesController } from "../controllers/favoriteController.js";


const router = express.Router()

router.post("/", authMiddleware, addToFavoritesController);
router.get("/", authMiddleware, getFavoritesController);
router.delete(
  "/:mediaId/:mediaType",
  authMiddleware,
  removeFromFavoritesController
);

export default router