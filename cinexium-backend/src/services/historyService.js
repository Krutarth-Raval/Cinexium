import User from "../models/userModel.js"
import { dedupeMedia } from "../utils/helpers/dedupeHelper.js";
import { getPagination } from "../utils/helpers/paginationHelper.js";

//get user history
export const getHistoryService = async (userId, { page, limit }) => {
  //get data
  const user = await User.findById(userId).select("history");

  if (!user) {
    return {
      status: 404,
      message: "User not found",
    };
  }

  //transform data
  const sortedHistory = user.history.sort(
    (a, b) => new Date(b.viewedAt) - new Date(a.viewedAt)
  );

  const { skip, limit: perPage, page: currentPage } =
  getPagination(page, limit);

const paginationHistory = sortedHistory.slice(
  skip,
  skip + perPage
);

const hasMore = skip + perPage < sortedHistory.length;

  return {
    status: 200,
    page: currentPage,
    limit:perPage,
    hasMore,
    history: paginationHistory,
  };
};

//get recent history for home page
export const getRecentHistoryService = async (userId, limit) => {
  //find user
  const user = await User.findById(userId).select("history");

  //if user not found
  if (!user) {
    return {
      status: 404,
      message: "User not found",
    };
  }

  //sort by latest first
  const sortedHistory = user.history.sort(
    (a, b) => new Date(b.viewedAt) - new Date(a.viewedAt)
  );

const recentUniqueHistory = dedupeMedia(sortedHistory).slice(0, limit);


  return {
    status: 200,
    history: recentUniqueHistory,
  };
};

//add history service
export const addHistoryService = async (userId, { mediaId, mediaType }) => {
  if (!mediaType || !mediaId) {
    return {
      status: 400,
      message: "MediaId and mediaType are required",
    };
  }
    if (!isValidMediaType(mediaType)) {
      return {
        status: 400,
        message: "mediaType must be movie or tv",
      };
    }

  const user = await User.findById(userId);
  if (!user) {
    return {
      status: 404,
      message: "User not found",
    };
  }

  //push history to database
  user.history.push({ mediaId, mediaType });
  await user.save();
  return {
    status: 200,
    message: "History added ",
  };
};

//get most viewed service
export const getMostViewedService = async (userId, limit) => {
  const user = await User.findById(userId).select("history");

  if (!user) {
    return {
      status: 404,
      message: "User not found",
    };
  }

  const countMap = new Map();

  for (const item of user.history) {
    const key = `${item.mediaType}-${item.mediaId}`;

    if (countMap.has(key)) {
      countMap.set(key, countMap.get(key) + 1);
    } else {
      countMap.set(key, 1);
    }
  }

  const mostViewed = Array.from(countMap.entries())
    .map(([key, count]) => {
      const [mediaId, mediaType] = key.split("-");
      return { mediaId, mediaType, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return {
    status: 200,
    history: mostViewed,
  };
};

//delete history by id
export const deleteHistoryService = async(userId, historyId) => {
  const user =await User.findById(userId)
  if(!user){
    return {
      status:404,
      message:"User not found"
    }
  }

  //store initial length for verification
  const initialLength = user.history.length
  
  //remove by id
  user.history = user.history.filter(
    (item) => item._id.toString() !== historyId
  )

  //check if anything is actual remove 
  if(user.history.length === initialLength){
    return{
      status:404,
      message:"History entry not found"
    }
  }

  await user.save()
  return {
    status:200,
    message:"History entry remove",
    history:user.history
  }
}

//clear history
export const clearHistoryService = async(userId) => {
  const user = await User.findById(userId)
  if(!user){
    return {
      status:404,
      message:'User not found'
    }
  }
  user.history = []
  await user.save()
  return {
    status:200,
    message:"history cleared",
    history:[]
  }
}