const Transaction2 = require("../models/Transfers");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const User = require("./../models/userModel2");
const mongoose = require("mongoose");
const Account = require("./../models/accountModel2");
const moment = require("moment");

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

exports.getSpecifiedTransactions = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  const { startDate, endDate, activity, clientUsername } = req.body;
  let { selectedAccount } = req.body;
  if (!selectedAccount) selectedAccount = user.selectedAccount;
  const transactions = user.accounts[selectedAccount].transactions;

  let specifiedTransactions = [...transactions];
  if (startDate && endDate) {
    specifiedTransactions = transactions.filter((transaction) => {
      return (
        Number(
          new Date(new Date(transaction.timeOfTransaction).toDateString())
        ) >= Number(new Date(new Date(startDate).toDateString())) &&
        Number(
          new Date(new Date(transaction.timeOfTransaction).toDateString())
        ) <= Number(new Date(new Date(endDate).toDateString()))
      );
    });
  }

  if (activity)
    specifiedTransactions = specifiedTransactions.filter((transaction) => {
      return transaction.type === activity;
    });

  if (clientUsername) {
    specifiedTransactions = specifiedTransactions.filter((transaction) => {
      return transaction.client === clientUsername;
    });
  }
  res.status(200).json({
    status: "success",
    result: specifiedTransactions.length,
    data: {
      specifiedTransactions,
    },
  });
});

exports.getMoreTransactions = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  // const selectedAccount = user.selectedAccount;
  const { startDate, endDate, selectedAccount } = req.body;
  const transactions = user.accounts[selectedAccount].transactions;
  const specifiedTransactions = transactions.filter((transaction) => {
    return (
      Number(
        new Date(new Date(transaction.timeOfTransaction).toDateString())
      ) >= Number(new Date(new Date(startDate).toDateString())) &&
      Number(
        new Date(new Date(transaction.timeOfTransaction).toDateString())
      ) <= Number(new Date(new Date(endDate).toDateString()))
    );
  });
  // res.status(200).json({
  //   status: "success",
  //   result: specifiedTransactions.length,
  //   data: {
  //     specifiedTransactions,
  //   },
  // });
});

exports.createTransaction = catchAsync(async (req, res, next) => {
  const { receiverUsername, transactionAmount, pin, description } = req.body;
  const sender = await User.findById(req.params.id);
  const receiver = await User.findOne({ username: receiverUsername });

  if (!sender) {
    // return next(
      // new AppError(`No user found with this id: ${req.params.id}`, 404)
    // );
    return res.status(404).json({
      status: "fail",
      message: `No user found with this id: ${req.params.id}`,
    });
  }

  if (!(await sender.correctPasswordOrPin(pin, sender.pin))) {
    // return next(new AppError("Invalid pin", 400));
    return res.status(400).json({
      status: "fail",
      message: "Invalid pin",
    });
  }

  if (!receiver || receiverUsername === sender.username) {
    // return next(
    //   new AppError(`No user found with this username: ${receiverUsername}`, 404)
    // );
    return res.status(404).json({
      status: "fail",
      message: `No user found with this username: ${receiverUsername}`,
    });
  }
  const selectedAccountSender = sender.selectedAccount;
  const selectedAccountReceiver = receiver.selectedAccount;

  const clearedBalance = sender.accounts[selectedAccountSender].clearedBalance;
  // const receiverClearedBalance = sender.accounts[selectedAccountReceiver].clearedBalance;
  const charges = transactionAmount * 0.015;
  const senderAccountNumber =
    sender.accounts[selectedAccountSender].accountNumber;
  const senderFullname = sender.fullname;
  const receiverAccountNumber =
    receiver.accounts[selectedAccountReceiver].accountNumber;
  const receiverFullname = receiver.fullname;

  if (transactionAmount + charges > clearedBalance || clearedBalance < 0) {
    return res
      .status(400)
      .json({ status: "fail", message: "Insufficient balance" });
  }
  if (transactionAmount < 10) {
    return res.status(400).json({
      status: "fail",
      message: "Amount must be above N10",
    });
  }
  const session = await mongoose.startSession();
  const senderBalance = sender.accounts[selectedAccountSender].accountBalance;
  const receiverBalance =
    receiver.accounts[selectedAccountReceiver].accountBalance;
  session.startTransaction();
  const timeOfTransaction = new Date();
  const senderTransaction = await Transaction2.create({
    type: "debit",
    client: receiverUsername,
    clientAccountNumber: receiverAccountNumber,
    clientFullname: receiverFullname,
    transactionAmount: -transactionAmount,
    description,
    timeOfTransaction,
    charges,
    balance: senderBalance - (transactionAmount + charges),
  });
  const receiverTransaction = await Transaction2.create({
    type: "credit",
    client: sender.username,
    clientAccountNumber: senderAccountNumber,
    clientFullname: senderFullname,
    transactionAmount,
    description,
    timeOfTransaction,
    balance: receiverBalance + transactionAmount,
  });
  const userAccount = await Account.findByIdAndUpdate(
    sender.accounts[selectedAccountSender]._id,
    {
      $push: { transactions: senderTransaction },
      $inc: {
        accountBalance: -(transactionAmount + charges),
        clearedBalance: -(transactionAmount + charges),
      },
    }
  );
  const otherAccount = await Account.findByIdAndUpdate(
    receiver.accounts[selectedAccountReceiver]._id,
    {
      $push: { transactions: receiverTransaction },
      $inc: {
        accountBalance: transactionAmount,
        clearedBalance: transactionAmount,
      },
    }
  );
  await User.findOneAndUpdate(
    {
      _id: sender._id,
      "accounts._id": sender.accounts[selectedAccountSender]._id,
    },
    {
      $push: { "accounts.$.transactions": senderTransaction },
      $inc: {
        "accounts.$.accountBalance": -(transactionAmount + charges),
        "accounts.$.clearedBalance": -(transactionAmount + charges),
      },
    }
  );
  await User.findOneAndUpdate(
    {
      _id: receiver._id,
      "accounts._id": receiver.accounts[selectedAccountReceiver]._id,
    },
    {
      $push: { "accounts.$.transactions": receiverTransaction },
      $inc: {
        "accounts.$.accountBalance": transactionAmount,
        "accounts.$.clearedBalance": transactionAmount,
      },
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
      clientAccountNumber: receiverAccountNumber,
      clientFullname: receiverFullname,
      transactionAmount: -transactionAmount,
      description,
      timeOfTransaction,
      balance: senderBalance - (transactionAmount + charges),
    },
  });
});

exports.deposit = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  console.log(user);
  if (!user) {
    // return next(
    //   new AppError(`No user found with this id: ${req.params.id}`, 404)
    // );
    return res.status(404).json({
      status: "fail",
      message: `No user found with this is : ${req.params.id}`,
    });
  }
  const selectedAccount = user.selectedAccount;
  const balance = user.accounts[selectedAccount].accountBalance;
  const timeOfTransaction = new Date();
  const { transactionAmount, pin, description } = req.body;
  if (!(await user.correctPasswordOrPin(pin, user.pin))) {
    // return next(new AppError("Invalid pin", 400));
    return res.status(400).json({
      status: "fail",
      message: "invalid pin"
    })
  }
  const clientAccountNumber = user.accounts[selectedAccount].accountNumber;
  const clientFullname = user.fullname;
  const deposit = await Transaction2.create({
    type: "self transfer",
    client: "self",
    clientAccountNumber,
    clientFullname,
    transactionAmount,
    description,
    timeOfTransaction,
    balance: balance + transactionAmount,
  });

  const updatedAccount = await Account.findByIdAndUpdate(
    user.accounts[selectedAccount]._id,
    {
      $push: { transactions: deposit },
      $inc: {
        accountBalance: transactionAmount,
        clearedBalance: transactionAmount,
      },
    }
  );
  const updatedUser = await User.findOneAndUpdate(
    { _id: user._id, "accounts._id": user.accounts[selectedAccount]._id },
    {
      $push: { "accounts.$.transactions": deposit },
      $inc: {
        "accounts.$.accountBalance": transactionAmount,
        "accounts.$.clearedBalance": transactionAmount,
      },
    }
  );
  console.log("depositing2");

  res.status(200).json({
    status: "success",
    data: {
      type: "self transfer",
      client: "self",
      clientAccountNumber,
      clientFullname,
      transactionAmount,
      description,
      timeOfTransaction,
      balance: balance + transactionAmount,
    },
  });
});
