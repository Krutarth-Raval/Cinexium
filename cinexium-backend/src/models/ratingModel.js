import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mediaId: {
      type: String,
      required: true,
    },
    mediaType: {
      type: String,
      enum: ["movie", "tv"],
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
  },
  { timestamps: true }
);
ratingSchema.index(
  {
    user: 1,
    mediaId: 1,
    mediaType: 1,
  },
  { unique: true }
);

const Rating = mongoose.model("Rating", ratingSchema);

export default Rating;
