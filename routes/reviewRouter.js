const express = require("express");
const reviewController = require("./../controllers/reviewController");
const authController = require("./../controllers/authController");
const userController = require("./../controllers/userController");
const router = express.Router();

//get the 5 best reviews
router.route("/top-5-reviews").get(reviewController.aliasTopReviews, reviewController.getAllReviews)
router.route("/review-stats").get(reviewController.getReviewStats)
router.route("/searchReviews").get(reviewController.searchReviews)
router.route("/updateReviewHelpful/:reviewID").patch(reviewController.updateReviewHelpful)
router.route("/")
.get(reviewController.getAllReviews)
.post(authController.protect, userController.getMe, reviewController.createReview)
module.exports = router
