const mongoose = require("mongoose");
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review can not be empty"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, "Rating is required"],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User2",
      required: [true, "You must be logged in order to leave a review."],
    },
    reviewHelpful: {
      type: Number,
      default: 0,
    },
    reviewNotHelpful: {
      type: Number,
      default: 0,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "createdBy",
    select: "fullname profilePhoto",
  });
  next();
});
const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
