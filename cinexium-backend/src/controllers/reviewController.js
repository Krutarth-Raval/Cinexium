import {
  createReviewService,
  deleteReviewService,
  getReviewService,
  toggleReviewLikeService,
  updateReviewService,
} from "../services/reviewService.js";

export const createReviewController = async (req, res) => {
  try {
    const userId = req.user._id;
    const { mediaType, mediaId, reviewText } = req.body;

    const result = await createReviewService(userId, {
      mediaType,
      mediaId,
      reviewText,
    });

    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const updateReviewController = async (req, res) => {
  try {
    const userId = req.user._id;
    const { mediaType, mediaId, reviewText } = req.body;

    const result = await updateReviewService(userId, {
      mediaType,
      mediaId,
      reviewText,
    });
    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//delete review controller
export const deleteReviewController = async (req, res) => {
  try {
    const userId = req.user._id;
    const { reviewId } = req.params;

    const result = await deleteReviewService(userId, reviewId);

    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//get review controller

export const getReviewsController = async (req, res) => {
  try {
    const { mediaType, mediaId, page, limit } = req.query;
    const userId = req.user?._id || null ;
    const result = await getReviewService(userId,{mediaType, mediaId, page, limit});
    return res.status(result.status).json(result.data);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//toggle likes controller
export const toggleReviewLikeController = async (req, res) => {
  try {
    const userId = req.user._id;
    const { reviewId } = req.params;

    const result = await toggleReviewLikeService(userId, reviewId);

    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
