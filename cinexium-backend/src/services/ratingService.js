import Rating from "../models/ratingModel.js";

//add or update rating service
export const addOrUpdateRatingService = async (
  userId,
  { mediaId, mediaType, rating }
) => {
  //required field check
  if (!mediaId || !mediaType || rating === undefined) {
    return {
      status: 404,
      message: "MediaId, mediaType and rating are required",
    };
  }

  //mediaTypeValidation
  if (!isValidMediaType(mediaType)) {
    return {
      status: 400,
      message: "mediaType must be movie or tv",
    };
  }

  //rating range validation
  if (rating < 1 && rating > 10) {
    return {
      status: 400,
      message: "Rating must be between 1 to 10",
    };
  }

  //check if user already rated this media
  const existingRating = await Rating.findOne({
    user: userId,
    mediaId,
    mediaType,
  });

  //update rating if exists
  if (existingRating) {
    existingRating.rating = rating;

    await existingRating.save();

    return {
      status: 200,
      message: "Rating updated",
      rating: existingRating,
    };
  }

  //create a new rating if not exist
  const newRating = await Rating.create({
    user: userId,
    mediaId,
    mediaType,
    rating,
  });

  return {
    status: 200,
    message: "Rating added",
    rating: newRating,
  };
};

//get rating states
export const getRatingStatsService = async (mediaType, mediaId) => {
  //basic validation
  if (!mediaId || !mediaType) {
    return {
      status: 400,
      message: "mediaId and mediaType are required",
    };
  }

  //mediaType validation
  if (!isValidMediaType(mediaType)) {
    return {
      status: 400,
      message: "mediaType must be movie or tv",
    };
  }

  //aggregation pipeline
  const stats = await Rating.aggregate([
    {
      $match: { mediaId, mediaType },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalRatings: { $sum: 1 },
      },
    },
  ]);

  //zero rating
  if (stats.length === 0) {
    return {
      status: 200,
      averageRating: 0,
      totalRatings: 0,
    };
  }

  //normal case
  return {
    status: 200,
    averageRating: Number(stats[0].averageRating.toFixed(1)),
    totalRatings: stats[0].totalRatings,
  };
};

//remove rating
export const removeRatingService = async (userId, { mediaType, mediaId }) => {
  //basic validation
  if (!mediaId || !mediaType) {
    return {
      status: 404,
      message: "mediaId and mediaType are required",
    };
  }

  //mediaType validation
  if (!isValidMediaType(mediaType)) {
    return {
      status: 400,
      message: "mediaType must be movie or tv",
    };
  }

  //find and delete rating
  const deletedRating = await Rating.findOneAndDelete({
    user: userId,
    mediaType,
    mediaId,
  });
  //rating not found
  if (!deletedRating) {
    return {
      status: 404,
      message: "Rating not found",
    };
  }

  //success
  return { status: 200, message: "Rating Removed successfully" };
};
