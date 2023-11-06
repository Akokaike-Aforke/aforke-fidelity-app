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

let accountNumber;
const generatedAccountNumbers = new Set();
exports.createAnotherAccount = catchAsync(async (req, res, next) => {
  const accountNumber = generateUniqueAccountNumber();
  const user = await User.findById(req.params.id);
  const { accountType } = req.body;
  const newAccount = await Account.create({
    accountType,
    accountNumber,
    transactions: [],
  });
  req.body.account = newAccount;
  await User.findOneAndUpdate(
    { _id: user._id },
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
    newAccount,
  });
});

// exports.getAccount = catchAsync(async (req, res, next) => {
//   const account = await Account.findById();
//   req.body.account = account;
//   next();
// })

// account2Schema.pre("save", function (next) {
//   if (!this.accountNumber) {
//     // Generate a random 10-digit account number
//     const uniqueAccountNumber = generateUniqueAccountNumber();
//     this.accountNumber = uniqueAccountNumber;
//   }
//   next();
// });

// Define a function to generate a unique 10-digit account number
function generateUniqueAccountNumber() {
  const min = 1000000000; // Minimum 10-digit number
  const max = 9999999999; // Maximum 10-digit number
  const randomAccountNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  const accountNumberString = randomAccountNumber.toString();
  if (!generatedAccountNumbers.has(accountNumberString)) {
    // The generated number is unique
    generatedAccountNumbers.add(accountNumberString);
    return accountNumberString;
  }
}

exports.createAccountNumber = (req, res, next) => {
  accountNumber = generateUniqueAccountNumber();
  res.status(200).json({
    status: "success",
    accountNumber,
  });
};

exports.createAccount = catchAsync(async (req, res, next) => {
  const newAccount = Account.create({
    accountType: req.body.accountType,
    accountNumber,
    transactions: [],
  });
  req.body.account = newAccount;
  next();
  // res.status(200).json({
  //   status: "success",
  //   data: {
  //     accountNumber: req.body.accountNumber,
  //   },
  // });
});
