import User from "../models/userModel.js";

//add to favorites
export const addToFavoritesService = async (userId, { mediaId, mediaType }) => {
  //check is something is missing
  if (!mediaId || !mediaType) {
    return {
      status: 400,
      message: "Media ID and media type are required",
    };
  }

  //check media type is movie and tv
  if (!isValidMediaType(mediaType)) {
    return {
      status: 400,
      message: "mediaType must be movie or tv",
    };
  }

  //fetch user
  const user = await User.findById(userId);

  //if user is not found
  if (!user) {
    return {
      status: 404,
      message: "User not found",
    };
  }

  //already exist
  const alreadyExist = user.favorites.some(
    (item) => item.mediaId == mediaId && item.mediaType == mediaType
  );

  if (alreadyExist) {
    return {
      status: 409,
      message: "Already Added",
    };
  }

  user.favorites.push({ mediaId, mediaType });
  await user.save();

  return {
    status: 201,
    message: "Added to favorites",
    favorites: user.favorites,
  };
};

//get favorites
export const getFavoritesService = async (userId) => {
  //call favorites from user database
  const user = await User.findById(userId).select("favorites");

  //user not found
  if (!user) {
    return {
      status: 404,
      message: "user not found",
    };
  }

  //if found
  return {
    status: 200,
    favorites: user.favorites,
  };
};

// remove from favorites
export const removeFromFavoritesService = async (
  userId,
  { mediaId, mediaType }
) => {
  if (!mediaId || !mediaType) {
    return {
      status: 400,
      message: "MediaId and mediaType are required.",
    };
  }
  if (!isValidMediaType(mediaType)) {
    return {
      status: 400,
      message: "mediaType must be movie or tv",
    };
  }
  //find user
  const user = await User.findById(userId);

  //not found
  if (!user) {
    return {
      status: 404,
      message: "User not found",
    };
  }

  const initialLength = user.favorites.length;

  user.favorites = user.favorites.filter(
    (item) => !(item.mediaId == mediaId && item.mediaType == mediaType)
  );

  if (user.favorites.length == initialLength) {
    return {
      status: 404,
      message: "favorite not found",
    };
  }

  await user.save();

  return {
    status: 200,
    message: "Favorite removed",
    favorites: user.favorites,
  };
};
