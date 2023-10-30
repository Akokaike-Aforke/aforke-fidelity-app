const Transaction2 = require("../models/Transfers");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const User = require("./../models/userModel2");
const mongoose = require("mongoose");
const Account = require("./../models/accountModel2");
exports.getAllTransactions = catchAsync(async (req, res, next) => {
  const transactions = await Transaction2.find();
  res.status(200).json({
    status: "success",
    result: transactions.length,
    data: {
      transactions,
    },
  });
});

exports.createTransaction = catchAsync(async (req, res, next) => {
  const { receiverUsername, transactionAmount, pin, description} = req.body;
  const sender = await User.findById(req.params.id);
  const receiver = await User.findOne({ username: receiverUsername });
  const selectedAccount = sender.selectedAccount;
  const selectedAccountReceiver = receiver.selectedAccount;
//   const selectedAccount = 1;
  const clearedBalance = sender.accounts[selectedAccount].clearedBalance;
  if (!sender) {
    return next(
      new AppError(`No user found with this id: ${req.params.id}`, 404)
    );
  }

  if (!(await sender.correctPasswordOrPin(pin, sender.pin))) {
    return next(new AppError("Invalid pin", 400));
  }

  if (!receiver || receiverUsername === sender.username) {
    return next(
      new AppError(`No user found with this username: ${receiverUsername}`, 404)
    );
  }

if (transactionAmount > clearedBalance || clearedBalance < 0) {
  return res
    .status(400)
    .json({ status: "fail", message: "Insufficient balance" });
}
  const session = await mongoose.startSession();
  session.startTransaction();
  const timeOfTransaction = new Date();
  const senderTransaction = await Transaction2.create({
      type: "debit",
    client: receiverUsername,
    transactionAmount: -transactionAmount,
    pin,
    description,
    timeOfTransaction,
  });
  const receiverTransaction = await Transaction2.create({
      type: "credit",
        client: sender.username,
    transactionAmount,
    pin,
    description,
    timeOfTransaction,
  });
  const userAccount = await Account.findByIdAndUpdate(
      sender.accounts[selectedAccount]._id,
      {
          $push: {transactions: senderTransaction}, 
          $inc: {accountBalance: -transactionAmount, clearedBalance: -transactionAmount},
        }
  );
  const otherAccount = await Account.findByIdAndUpdate(receiver.accounts[selectedAccountReceiver]._id, {
    $push: { transactions: receiverTransaction},
    $inc: {accountBalance: transactionAmount, clearedBalance: transactionAmount},
  });
  await User.findOneAndUpdate(
    { _id: sender._id, "accounts._id": sender.accounts[selectedAccount]._id },
    { $push: { "accounts.$.transactions": senderTransaction },
    $inc: {"accounts.$.accountBalance": -transactionAmount, "accounts.$.clearedBalance": -transactionAmount}
 }
  );
  await User.findOneAndUpdate(
    { _id: receiver._id, "accounts._id": receiver.accounts[selectedAccountReceiver]._id },
    { $push: { "accounts.$.transactions": receiverTransaction },
    $inc: {"accounts.$.accountBalance": transactionAmount, "accounts.$.clearedBalance": transactionAmount}
 }
  );
  await session.commitTransaction();
  session.endSession();

  res.status(200).json({
    status: "success",
    message: `Transfer to ${receiverUsername} is successful`,
    data: {
      type: "debit",
      client: receiverUsername,
      transactionAmount: -transactionAmount,
      pin,
      description,
      timeOfTransaction,
    },
  });
});


exports.deposit = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  const selectedAccount = user.selectedAccount;
  const timeOfTransaction = new Date();
  const { transactionAmount, pin, description } = req.body;
  const deposit = await Transaction2.create({
    type: "credit",
    client: "self",
    transactionAmount,
    description,
    timeOfTransaction,
  });
  
const userAccount = await Account.findByIdAndUpdate(user.accounts[selectedAccount]._id, {
  $push: { transactions: deposit },
  $inc: { accountBalance: transactionAmount, clearedBalance: transactionAmount },
});
  await User.findOneAndUpdate(
    { _id: user._id, "accounts._id": user.accounts[selectedAccount]._id },
    {
      $push: { "accounts.$.transactions": deposit },
      $inc: { "accounts.$.accountBalance": transactionAmount, "accounts.$.clearedBalance": transactionAmount },
    }
  );

  res.status(200).json({
    status: "success",
    data: {
      type: "credit",
      client: "self",
      transactionAmount,
      pin,
      description,
      timeOfTransaction,
    },
  });
});