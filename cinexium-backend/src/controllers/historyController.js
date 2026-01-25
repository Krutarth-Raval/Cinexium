import {
  addHistoryService,
  clearHistoryService,
  deleteHistoryService,
  getHistoryService,
  getMostViewedService,
  getRecentHistoryService,
} from "../services/historyService.js";

// get user recent history
export const getHistoryController = async (req, res) => {
  try {
    //identify user
    const userId = req.user._id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await getHistoryService(userId, { page, limit });
    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//get recent history controller
export const getRecentHistoryController = async (req, res) => {
  try {
    const userId = req.user._id;

    //set limit
    const limit = parseInt(req.query.limit) || 10;

    const result = await getRecentHistoryService(userId, limit);

    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//add history
export const addHistoryController = async (req, res) => {
  try {
    const userId = req.user._id;

    const { mediaId, mediaType } = req.body;

    const result = await addHistoryService(userId, { mediaId, mediaType });

    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//get most viewed
export const getMostViewedController = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;

    const result = await getMostViewedService(userId, limit);

    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//delete history
export const deleteHistoryController = async (req, res) => {
  try {
    const userId = req.user._id;

    const { historyId } = req.params;
    const result = await deleteHistoryService(userId, historyId);
    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//clear all history
export const clearHistoryController = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await clearHistoryService(userId);

    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
