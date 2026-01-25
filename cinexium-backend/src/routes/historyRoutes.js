import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  addHistoryController,
  clearHistoryController,
  deleteHistoryController,
  getHistoryController,
  getMostViewedController,
  getRecentHistoryController,
} from "../controllers/historyController.js";
const router = express.Router();

router.get("/", authMiddleware, getHistoryController);
router.get("/recent", authMiddleware, getRecentHistoryController);
router.post("/", authMiddleware, addHistoryController);
router.get("/most-viewed", authMiddleware, getMostViewedController);
router.delete("/:historyId", authMiddleware, deleteHistoryController);
router.delete("/", authMiddleware, clearHistoryController);

export default router;
