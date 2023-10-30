const Account2 = require("../models/accountModel2");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const User = require("./../models/userModel2");
const mongoose = require("mongoose");
const Account = require("./../models/accountModel2");

exports.getAllAccounts = catchAsync(async (req, res, next) => {
  const accounts = await Account2.find();
  res.status(200).json({
    status: "success",
    result: transactions.length,
    data: {
      accounts,
    },
  });
});

exports.createAccount = catchAsync(async (req, res, next) => {
  const newAccount = Account.create({
    accountType: req.body.accountType,
    transactions: [],
    // clearedBalance: req.body.clearedBalance
  });
  req.body.account = newAccount;
  next();
});
exports.createAnotherAccount = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);
  const { accountType } = req.body;
  const newAccount = await Account.create({
    accountType,
    transactions: [],
  });
  req.body.account = newAccount;
  await User.findOneAndUpdate(
    { _id: user._id},
    {
      $push: { accounts: newAccount },
    //   $inc: {
    //     "accounts.$.accountBalance": transactionAmount,
    //     "accounts.$.clearedBalance": transactionAmount,
    //   },
    }
  );
  res.status(200).json({
    status: "success",
    // message: `Transfer to ${receiverUsername} is successful`,
    data: {
      accountType,
    },
  });
});

// exports.getAccount = catchAsync(async (req, res, next) => {
//   const account = await Account.findById();
//   req.body.account = account;
//   next();
// })
