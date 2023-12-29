const Review = require("./../models/reviewModel");
const catchAsync = require("./../utils/catchAsync");

exports.aliasTopReviews = catchAsync(async (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = "-rating";
  req.query.fields = "review, rating";
  next();
});
exports.createReview = catchAsync(async (req, res, next) => {
  const { review, rating } = req.body;
  const createdBy = req.params.id;
  const newReview = await Review.create({
    review,
    rating,
    createdBy,
  });
  res.status(200).json({
    status: "success",
    data: {
      review: newReview,
    },
  });
});

//GET ALL REVIEWS WITH QUERY
exports.getAllReviews = catchAsync(async (req, res, next) => {
  try {
    //1. BUILD QUERY
    //A. FILTERING
    const queryObj = { ...req.query };
    console.log(queryObj);
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => {
      delete queryObj[el];
    });
    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gte|gt|lt|lte)\b/g,
      (match) => `$${match}`
    );

    //using query with object
    let query = Review.find(JSON.parse(queryString));

    //using chaining method
    // const reviews = await Review.find().where('rating').equals(5);

    //B.SORTING
    if (req.query.sort) {
      const sortBy = req.query.sort.split(",").join(" ");
      query = query.sort(sortBy);
    } else {
      query = query.sort("-createdAt");
    }

    //C. LIMITING FIELDS
    if (req.query.fields) {
      const fields = req.query.fields.split(",").join(" ");
      console.log(fields);
      query = query.select(fields);
    } else {
      query = query.select("-__v ");
    }

    //D. PAGINATION
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);
    if (req.query.page) {
      const numReviews = await Review.countDocuments();
      if (skip >= numReviews) throw new Error("This page does not exist");
    }

    //2. EXECUTE THE QUERY
    const reviews = await query;
    res.status(201).json({
      status: "success",
      results: reviews.length,
      data: {
        reviews,
      },
    });
  } catch (err) {
    return res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
});

// exports.getAllReviews = catchAsync(async (req, res, next) => {
//     try{
//         console.log(req.query)
//         const reviews = await Review.find();
//         res.status(201).json({
//             status: "success",
//             results: reviews.length,
//             data: {
//                 reviews
//             }
//         })
//     }
//     catch(err){
//         return res.status(400).json({
//             status: "fail",
//             message: err.message
//         })
//     }
// })

//AGGREGATION PIPELINE
exports.getReviewStats = catchAsync(async (req, res) => {
  try {
    const stats = await Review.aggregate([
      {
        $match: {
          rating: { $gte: 1 },
        },
      },
      //     {
      //     $group: {
      //         _id: null,
      //         sum: {$sum: 1},
      //         //the below does not really make sense but just for example
      //         numReviews: {$sum: "$rating"},
      //         avgRating: {$avg: "$rating"},
      //         minRating: {$min: "$rating"},
      //         maxRating: {$max: "$rating"},
      //     }
      // }

      {
        $group: {
          //group according to field
          _id: "$rating",
          // _id: {$toUpper: "$rating"},
          sum: { $sum: 1 },
          //the below does not really make sense but just for example
          numReviews: { $sum: "$rating" },
          avgRating: { $avg: "$rating" },
          minRating: { $min: "$rating" },
          maxRating: { $max: "$rating" },
        },
      },
      {
        $sort: { avgRating: -1 },
      },
      // {
      //     $match: {_id: {$ne: 2}}
      // }
    ]);
    res.status(201).json({
      status: "success",
      data: {
        stats,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
});

exports.searchReviews = catchAsync(async (req, res) => {
  const searchTerm = req.query.s.split(",").map((s) => s.toLowerCase());
  // const searchTerm = req.query.s;
  const reviews = await Review.find();
  const results = reviews.filter((review) =>
    review.review.toLowerCase().includes(searchTerm)
  );
  return res.status(200).json({
    status: "success",
    results: results.length,
    data: {
      reviews: results,
    },
  });
});

exports.updateReviewHelpful = catchAsync(async (req, res) => {
  try {
    console.log(req.params.reviewID);
    const { helpful, unhelpful } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.reviewID,
      { $inc: { reviewHelpful: helpful, reviewNotHelpful: unhelpful } },
      { new: true }
    );
    console.log(review);
    res.status(200).json({
      status: "success",
      data: {
        review,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
});

exports.updateReviewUnHelpful = catchAsync(async (req, res) => {
  try {
    console.log(req.params.reviewID);
    const { helpful, unhelpful } = req.body;
    console.log(helpful, unhelpful);
    const review = await Review.findByIdAndUpdate(
      req.params.reviewID,
      { $inc: { reviewUnHelpful: helpful } },
      { new: true }
    );
    console.log(review);
    res.status(200).json({
      status: "success",
      data: {
        review,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: "",
    });
  }
});

exports.getReviewStatistics = catchAsync(async (req, res) => {
  try {
    const stats = await Review.aggregate([
      {
        $facet: {
          groupTotals: [
            {
              $group: {
                _id: null,
                numReviews: { $sum: 1 },
                avgRating: { $avg: "$rating" },
                minRating: { $min: "$rating" },
                maxRating: { $max: "$rating" },
              },
            },
          ],
          eachTotals: [
            {
              $group: {
                _id: "$rating",
                numReviewsEach: { $sum: 1 },
              },
            },
            { $sort: { _id: -1 } },
          ],
        },
      },
    ]);
    res.status(200).json({
      status: "success",
      data: {
        stats,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: "",
    });
  }
});
