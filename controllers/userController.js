// const User = require("./../models/userModel");
const User = require("./../models/userModel2");
// const Account = require("./../models/accountModel")
const Account = require("./../models/accountModel2");
const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const mongoose = require("mongoose");
const cloudinary = require("./../utils/cloudinary");
const multer = require("multer");
const path = require("path");
const DatauriParser = require("datauri/parser");
const parser = new DatauriParser();

// exports.getAllUsers = catchAsync(async (req, res, next) =>{
//         const users = await User.find();
//         res.status(200).json({
//             status:"success",
//             timeRequested: req.timeDone,
//             data:{
//                 users
//             }
//         })

// });
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  //1. create error if user tries to post
  if (req.body.password || req.body.passwordConfirm) {
    // return next(
    //   new AppError(
    //     "This route is not for password updates. Please use /updateMyPassword",
    //     400
    //   )
    // );

    return res.status(400).json({
      status: "fail",
      message:
        "This route is not for password updates. Please use /updateMyPassword",
    });
  }

  //2. filtered out unwanted fields that are not allowed to be updated
  const filteredBody = filterObj(req.body, "fullname", "email");

  //3. update user
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    // .populate("transactions")
    .populate("reviews");
  if (!user) {
    // return next(
    //   new AppError(`No user found with the id: ${req.params.id}`, 404)
    // );

    return res.status(404).json({
      status: "fail",
      message: `No user found with the id: ${req.params.id}`,
    });
  }

  // console.log(req.timeCreated);
  res.status(200).json({
    status: "success",
    timeRequested: req.timeDone,
    data: {
      user,
    },
  });
});

exports.createUser = catchAsync(async (req, res, next) => {
  const user = await User.create(req.body);
  res.status(201).json({
    status: "success",
    timeCreated: new Date().toISOString(),
    data: {
      user,
    },
  });
});

// const fileStorageEngine = multer.diskStorage({
//   destination: (req, file, cb) => {
//     // return cb(null, "./public/profileImages");
//     return cb(
//       null,
//       "https://aforke-fidelity-app.onrender.com/public/profileImages"
//     );
//   },
//   filename: (req, file, cb) => {
//     return cb(null, Date.now() + "--" + file.originalname);
//   },
// });

// exports.uploadPhoto = multer({ storage: fileStorageEngine }).single("profilePhoto");
exports.uploadPhoto = multer({ storage: multer.memoryStorage() }).single(
  "profilePhoto"
);

const formatBufferTo64 = (file) =>
  parser.format(path.extname(file.originalname).toString(), file.buffer);
const cloudinaryUpload = (file) => cloudinary.uploader.upload(file);

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

//MEMORY STORAGE MULTER
exports.updateMe = catchAsync(async (req, res, next) => {
  const { fullname } = req.body;
  let user;
  try {
    if (req?.file) {
      const file64 = formatBufferTo64(req.file);
      const uploadResult = await cloudinary.uploader
        .upload(file64.content)
        .catch((error) => {
          console.error("Error uploading to Cloudinary:", error);
          throw error; // Rethrow the error to be caught in the outer catch block
        });
      user = await User.findByIdAndUpdate(
        req.params.id,
        { profilePhoto: uploadResult.secure_url },
        {
          new: true,
          runValidators: true,
        }
      );

      return res.json({
        cloudinaryId: uploadResult.public_id,
        url: uploadResult.secure_url,
      });
    }
    if (fullname) {
      user = await User.findByIdAndUpdate(
        req.params.id,
        { fullname },
        {
          new: true,
          runValidators: true,
        }
      );
      res.status(200).json({
        status: "success",
        timeUpdated: req.timeDone,
        data: {
          user,
        },
      });
    }
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: `No user found with the id: ${req.params.id}`,
      });
    }
  } catch (e) {
    return res.status(422).send({ message: e.message });
  }
});

//DISK STORAGE MULTER
// exports.updateMe = catchAsync(async (req, res, next) => {
//   console.log(req?.file)
//   const { fullname } = req.body;
//   let user;
//   if (req?.file?.path) {
//     const filename = req.file.filename;
//     user = await User.findByIdAndUpdate(
//       req.params.id,
//       { profilePhoto: req.file.path },
//       {
//         new: true,
//         runValidators: true,
//       }
//     );
//   }
//   if (fullname) {
//     user = await User.findByIdAndUpdate(
//       req.params.id,
//       { fullname },
//       {
//         new: true,
//         runValidators: true,
//       }
//     );
//   }
//   if (!user) {
//     // return next(
//     //   new AppError(`No user found with the id: ${req.params.id}`, 404)
//     // );

//     return res.status(404).json({
//       status: "fail",
//       message: `No user found with the id: ${req.params.id}`,
//     });
//   }
//   res.status(200).json({
//     status: "success",
//     timeUpdated: req.timeDone,
//     data: {
//       user,
//     },
//   });
// });

// //USING CLOUDINARY TO UPLOAD PHOTO
// exports.updateMe = async (req, res, next) => {
//   // console.log("cloudinary");
//   // const { profilePhoto } = req.body;
//   // console.log(req.body);
//   // console.log(`profilePhoto: ${profilePhoto}`);
//   // console.log(process.env.CLOUDINARY_API_KEY);
//   console.log(req?.file)
//   let user;
//   try {
//     if (req?.file) {
//       const uploadResponse = await cloudinary.uploader.upload(profilePhoto, {
//         upload_preset: "fidelityapp",
//       });
//       if (uploadResponse) {
//         consol.log(uploadResponse);
//         user = await User.findByIdAndUpdate(
//           req.params.id,
//           { profilePhoto: "profilesssss" },
//           {
//             new: true,
//             runValidators: true,
//           }
//         );
//       }
//     }
//     res.status(200).json({
//       status: "success",
//       timeUpdated: req.timeDone,
//       data: {
//         user,
//       },
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({
//       status: "error",
//       message: "error uploading profile photo",
//     });
//   }
// };

exports.deleteUser = catchAsync(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    // return next(
    //   new AppError(`No user found with the id: ${req.params.id}`, 404)
    // );

    return res.status(404).json({
      status: "fail",
      message: `No user found with the id: ${req.params.id}`,
    });
  }
  res.status(204).json({
    status: "succes",
    data: null,
  });
});

exports.updateSelectedAccount = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    // return next(
    //   new AppError(`No user found with the id: ${req.params.id}`, 404)
    // );
    return res.status(404).json({
      status: "fail",
      message: `No user found with the id: ${req.params.id}`,
    });
  }
  res.status(200).json({
    status: "success",
    timeUpdated: req.timeDone,
    data: {
      user,
    },
  });
});
