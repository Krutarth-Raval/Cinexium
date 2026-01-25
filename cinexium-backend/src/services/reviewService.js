import Rating from "../models/ratingModel.js";
import Review from "../models/reviewModel.js";
import { toggleLike } from "../utils/helpers/likeToggleHelper.js";
import { getPagination } from "../utils/helpers/paginationHelper.js";
import { isValidMediaType } from "../utils/validators/mediaTypeValidator.js";

export const createReviewService = async (
  userId,
  { mediaType, mediaId, reviewText }
) => {
  if (!mediaId || !mediaType || !reviewText) {
    return {
      status: 400,
      message: "mediaId, mediaType and reviewText are required",
    };
  }

  if (!isValidMediaType(mediaType)) {
    return {
      status: 400,
      message: "mediaType must be movie or tv",
    };
  }

  const rating = await Rating.findOne({
    user: userId,
    mediaType,
    mediaId,
  });

  if (!rating) {
    return {
      status: 403,
      message: "You must rate this media before posting a review",
    };
  }

  //create a review
  try {
    const review = await Review.create({
      user: userId,
      mediaType,
      mediaId,
      reviewText,
    });

    return {
      status: 201,
      message: "Review posted successfully",
    };
  } catch (error) {
    if (error.code === 11000) {
      return {
        status: 409,
        message: "You have already reviewed this media",
      };
    }
    throw error;
  }
};

//update review
export const updateReviewService = async (
  userId,
  { mediaType, mediaId, reviewText }
) => {
  //basic validation
  if (!mediaType || !mediaId || !reviewText) {
    return {
      status: 401,
      message: "mediaType, mediaId and reviewText are required",
    };
  }

  //check media type
  if (!isValidMediaType(mediaType)) {
    return {
      status: 400,
      message: "mediaType must be movie or tv",
    };
  }

  const updatedReview = await Review.findOneAndUpdate(
    {
      user: userId,
      mediaId,
      mediaType,
    },
    { reviewText },
    { new: true }
  );

  //if review not found
  if (!updatedReview) {
    return {
      status: 404,
      message: "Review not found",
    };
  }
  //if success
  return {
    status: 200,
    message: "Review updated successfully",
    review: updatedReview,
  };
};

//delete review
export const deleteReviewService = async (userId, reviewId) => {
  if (!reviewId) {
    return {
      status: 400,
      message: "ReviewId is required",
    };
  }
  const review = await Review.findById(reviewId);

  if (!review) {
    return {
      status: 404,
      message: "Review not found",
    };
  }

  if (review.user.toString() !== userId.toString()) {
    return {
      status: 403,
      message: "You are not allowed to delete this review.",
    };
  }
  await Review.findOneAndDelete(reviewId);
  return {
    status: 200,
    message: "review deleted successfully",
  };
};

//get reviews
export const getReviewService = async (
  userId,
  { mediaType, mediaId, page = 1, limit = 10 }
) => {
  if (!mediaId || !mediaType) {
    return {
      status: 400,
      data: { message: "mediaType and mediaId are required" },
    };
  }

  if (!isValidMediaType(mediaType)) {
    return {
      status: 400,
      message: "mediaType must be movie or tv",
    };
  }

  const {
    skip,
    limit: perPage,
    page: currentPage,
  } = getPagination(page, limit);

  const reviews = await Review.aggregate([
    { $match: { mediaType, mediaId } },
    { $addFields: { likesCount: { $size: "$likes" } } },
    { $sort: { likesCount: -1, createdAt: -1 } },
    { $skip: skip },
    { $limit: perPage },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        "user.password": 0,
        "user.email": 0,
        __v: 0,
      },
    },
  ]);

  const userIdStr = userId?.toString();

  const finalReviews = reviews.map((review) => ({
    ...review,
    isLikedByMe: userIdStr
      ? review.likes.some((id) => id.toString() === userIdStr)
      : false,
  }));

  const totalReviews = await Review.countDocuments({ mediaType, mediaId });

  const hasMore = currentPage * perPage < totalReviews;

  return {
    status: 200,

    data: {
      reviews: finalReviews,
      totalReviews,
      page: currentPage,
      limit: perPage,
      hasMore,
    },
  };
};

//toggle likes on review
export const toggleReviewLikeService = async (userId, reviewId) => {
  if (!reviewId) {
    return {
      status: 400,
      message: "Review ID is required",
    };
  }
  const review = await Review.findById(reviewId);

  if (!review) {
    return {
      status: 404,
      message: "Review not found",
    };
  }
  const liked = toggleLike(review.likes, userId);

  await review.save();
  return {
    status: 200,
    message: liked ? "Review liked" : "Like Removed",
    likesCount: review.likes.length,
  };
};
