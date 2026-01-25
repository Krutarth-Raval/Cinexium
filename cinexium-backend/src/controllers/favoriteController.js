import { addToFavoritesService, getFavoritesService, removeFromFavoritesService } from "../services/favoriteService.js";

//add to favorites controller
export const addToFavoritesController = async (req, res) => {
  try {
    // who is adding
    const userId = req.user._id;

    //gets data
    const { mediaId, mediaType } = req.body;

    const result = await addToFavoritesService(userId, { mediaType, mediaId });
    //return response
    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//get favorites controller
export const getFavoritesController = async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await getFavoritesService(userId);

    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

//remove from favorites
export const removeFromFavoritesController = async (req, res) => {
  try {
    //call user
    const userId = req.user._id;

    //get id and type
    const { mediaId, mediaType } = req.params;

    //send response to service
    const result = await removeFromFavoritesService(userId, {
      mediaId,
      mediaType,
    });

    return res.status(result.status).json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
