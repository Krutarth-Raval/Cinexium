import dotenv from "dotenv";
dotenv.config();

import axios from "axios";

const tmdbClient = axios.create({
  baseURL: process.env.TMDB_BASE_URL,
});

tmdbClient.interceptors.request.use((config) => {
  config.params = {
    ...config.params,
    api_key: process.env.TMDB_API_KEY,
  };
  return config;
});

export const tmdbGet = async (path, params = {}) => {
  try {
    const response = await tmdbClient.get(path, { params });
    return response.data;
  } catch (error) {
    throw {
      status: error.response?.status || 500,
      message: "TMDb request failed",
      original: error,
    };
  }
};

export default tmdbClient;
