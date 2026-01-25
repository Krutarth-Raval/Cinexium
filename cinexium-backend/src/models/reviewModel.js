import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    reviewText: {
      type: String,
      required: true,
      trim: true,
      minLength:3,
      maxLength: 2000,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ]
  },
  { timestamps: true }
);

//one review per user per media

reviewSchema.index(
    {user: 1, mediaId:1, mediaType:1},
    {unique:true}
)

const Review =  mongoose.model("Review", reviewSchema)

export default Review