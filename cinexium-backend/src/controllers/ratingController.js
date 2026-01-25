import {
  addOrUpdateRatingService,
  getRatingStatsService,
  removeRatingService,
} from "../services/ratingService.js";

//add or update rating
export const addOrUpdateRatingController = async (req, res) => {
  try {
    const userId = req.user._id;

    const { mediaId, mediaType, rating } = req.body;

    const result = await addOrUpdateRatingService(userId, {
      mediaId,
      mediaType,
      rating,
    });
    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// get rating
export const getRatingStatsController = async (req, res) => {
  try {
    const { mediaType, mediaId } = req.params;

    const result = await getRatingStatsService(mediaType, mediaId);
    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(500).json({ message: error });
  }
};

//remove rating
export const removeRatingController = async (req, res) => {
  try {
    const userId = req.user._id;
    const { mediaType, mediaId } = req.params;
    const result = await removeRatingService(userId, { mediaType, mediaId });
    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(500).json({message:error.message});
  }
};
