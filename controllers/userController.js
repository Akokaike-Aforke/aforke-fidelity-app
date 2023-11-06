// const User = require("./../models/userModel");
const User = require("./../models/userModel2");
// const Account = require("./../models/accountModel")
const Account = require("./../models/accountModel2");
const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const mongoose = require("mongoose");

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
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword",
        400
      )
    );
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
  const user = await User.findById(req.params.id).populate("transactions");
  if (!user) {
    return next(
      new AppError(`No user found with the id: ${req.params.id}`, 404)
    );
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

exports.updateMe = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    return next(
      new AppError(`No user found with the id: ${req.params.id}`, 404)
    );
  }
  res.status(200).json({
    status: "success",
    timeUpdated: req.timeDone,
    data: {
      user,
    },
  });
});

exports.deleteUser = catchAsync(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return next(
      new AppError(`No tour found with the id: ${req.params.id}`, 404)
    );
  }
  res.status(204).json({
    status: "succes",
    data: null,
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.updateSelectedAccount = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    return next(
      new AppError(`No user found with the id: ${req.params.id}`, 404)
    );
  }
  res.status(200).json({
    status: "success",
    timeUpdated: req.timeDone,
    data: {
      user,
    },
  });
});

// exports.transfer = catchAsync(async (req, res, next) => {
//   const { receiverUsername, transferAmount, pin, description } = req.body;

//   const user = await User.findById(req.params.id);
//   const receiver = await User.findOne({ username: receiverUsername });
//   if (!user) {
//     return next(
//       new AppError(`No user found with this id: ${req.params.id}`, 404)
//     );
//   }

//   if (!(await user.correctPasswordOrPin(pin, user.pin))) {
//     return next(new AppError("Invalid pin", 400));
//   }

//   if (!receiver || receiverUsername === user.username) {
//     return next(
//       new AppError(`No user found with this username: ${receiverUsername}`, 404)
//     );
//   }
//   const { clearedBalance, transactions: userTransactions, balance } = user;
//   if (balance < transferAmount || transferAmount > clearedBalance) {
//     return res
//       .status(400)
//       .json({ status: "fail", message: "Insufficient balance" });
//   }
//   // user.balance -= transferAmount;
//   // receiver.balance += transferAmount;
//   const timeOfTransaction = new Date();
//   const receiverDetails = {
//     transferAmount,
//     receiverUsername,
//     receiverAccountNumber: receiver.accountNumber,
//     timeOfTransaction,
//     description,
//     receiverName: receiver.fullname,
//     transactionType: "debit",
//     charges: transferAmount * 0.15,
//   };

//   const senderDetails = {
//     transferAmount,
//     senderUsername: user.username,
//     timeOfTransaction,
//     description,
//     senderName: user.fullname,
//     transactionType: "credit",
//   };
//   user.transactions = [...user.transactions, receiverDetails];
//   receiver.transactions = [...receiver.transactions, senderDetails];
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   await User.findByIdAndUpdate(
//     user._id,
//     { transactions: user.transactions, $inc: { balance: -transferAmount } },
//     { new: true }
//   );
//   await User.findByIdAndUpdate(
//     receiver._id,
//     { transactions: receiver.transactions, $inc: { balance: transferAmount } },
//     { new: true }
//   );
//   await session.commitTransaction();
//   session.endSession();
//   res.status(200).json({
//     status: "success",
//     message: `Transfer to ${receiverUsername} is successful`,
//     data: {
//       senderDetails,
//       receiverDetails,
//     },
//   });
// });

// exports.deposit = catchAsync(async (req, res, next) => {
//   const user = await User.findById(req.params.id);
//   const { amount, pin, description } = req.body;
//   if (!user) {
//     return next(new AppError(`No user found with this id: ${req.params.id}`));
//   }
//   // user.balance += amount;
//   await User.findByIdAndUpdate(
//     // const userNewbalance = User.findByIdAndUpdate(
//     user._id,
//     {
//       transactions: [
//         ...user.transactions,
//         {
//           transactionType: "deposit",
//           depositAmount: amount,
//           timeOfTransaction: new Date(),
//         },
//       ],
//       $inc: { balance: amount },
//     },
//     { new: true, runValidators: true }
//   );
//   // await userNewbalance.refresh
//   res.status(200).json({
//     status: "success",
//     data: {
//       depositInfo: {
//         transactionType: "deposit",
//         depositAmount: amount,
//         timeOfTransaction: new Date(),
//         description,
//       },
//     },
//   });
// });

// exports.createAccount = catchAsync(async (req, res, next)=>{
//   const newAccount = Account.create({
//     // accountNumber: req.body.accountNumber,
//     bvn: req.body.bvn,
//     accountType: req.body.accountType,
//     transactions: [],
//     clearedBalance: req.body.clearedBalance
//   });
//   req.body.account = newAccount;
//   next();
// })

// // exports.getAccount = catchAsync(async (req, res, next) => {
// //   const account = await Account.findById();
// //   req.body.account = account;
// //   next();
// // })
