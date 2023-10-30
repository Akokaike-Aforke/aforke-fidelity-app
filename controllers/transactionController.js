const Transaction = require("./../models/transactionModel")
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError")
const User = require("./../models/userModel")
const mongoose = require("mongoose")
const Account = require("./../models/accountModel")
exports.getAllTransactions = catchAsync(async (req, res, next) => {
    const transactions = await Transaction.find()
    res.status(200).json({
        status: "success",
        result: transactions.length,
        data: {
            transactions
        }
    })
})

exports.createTransaction = catchAsync(async (req, res, next) => {
  const {
    receiverUsername,
    transactionAmount,
    pin,
    description,
  } = req.body;
  const sender = await User.findById(req.params.id);
  const receiver = await User.findOne({ username: receiverUsername });

  req.body.accountOwner = req.user.id;
  req.body.otherUser = receiver.id;
  req.body.accountOwnerAccount = sender.accounts[0]._id;
  req.body.accountOtherUserAccount = receiver.accounts[0]._id;

  const senderAccount = await Account.findById(sender.accounts[0]._id);
  const receiverAccount = await Account.findById(receiver.accounts[0]._id);


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
  
  if(!senderAccount){
    return next(
      new AppError("sender account not found", 404)
    );
  }

  if (!receiverAccount) {
    return next(new AppError("receiver account not found", 404));
  }
  

  const { clearedBalance } = senderAccount;
  console.log(transactionAmount);
  console.log(clearedBalance);
  console.log(senderAccount)
  if (transactionAmount > clearedBalance || clearedBalance < 0) {
    return res
      .status(400)
      .json({ status: "fail", message: "Insufficient balance" });
  }
  console.log(transactionAmount);
  console.log(clearedBalance);
  

  const session = await mongoose.startSession();
  session.startTransaction();
  const timeOfTransaction = new Date();
  const senderTransaction = await Transaction.create({
    receiverUsername,
    transactionAmount: -transactionAmount,
    pin,
    description,
    accountOwner: req.body.accountOwner,
    otherUser: req.body.otherUser,
    accountOwnerAccount: req.body.accountOwnerAccount,
    accountOtherUserAccount: req.body.accountOtherUserAccount,
    timeOfTransaction,
  });
  await Transaction.create({
    receiverUsername,
    transactionAmount,
    pin,
    description,
    accountOwner: req.body.otherUser,
    otherUser: req.body.accountOwner,
    accountOwnerAccount: req.body.accountOtherUserAccount,
    accountOtherUserAccount: req.body.accountOwnerAccount,
    timeOfTransaction,
  });

  const updatedSenderAccount = await Account.findByIdAndUpdate(sender.accounts[0]._id, {
    $inc: { accountBalance: -transactionAmount },
  });
  const updatedReceiverAccount = await Account.findByIdAndUpdate(receiver.accounts[0]._id, {
    $inc: { accountBalance: transactionAmount },
  });

  await User.findByIdAndUpdate(req.user.id, {
    $inc: { accounts: { accountBalance: -transactionAmount }},
  });
  await User.findByIdAndUpdate(receiver.id, {
    $inc: { accounts: { accountBalance: transactionAmount }},
  });
 

  await session.commitTransaction();
  session.endSession();

  res.status(200).json({
    status: "success",
    message: `Transfer to ${receiverUsername} is successful`,
    data: {
      senderTransaction,
    },
  });
});


exports.deposit = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
   req.body.accountOwner = req.user.id;
   req.body.accountOwnerAccount = user.accounts[0]._id;

  const { transactionAmount, pin, description} = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  const updatedAccount = await Account.findByIdAndUpdate(user.accounts[0]._id, {
    $inc: { accountBalance: transactionAmount },
  });
  User.findByIdAndUpdate(req.params.id, { $inc: { accounts: { accountBalance: transactionAmount }}})
  const deposit = await Transaction.create({
    receiverUsername: "self",
    transactionAmount,
    pin,
    description,
    accountOwner: req.body.accountOwner,
    otherUser: req.body.accountOwner,
    accountOwnerAccount: req.body.accountOwnerAccount,
    accountOtherUserAccount: req.body.accountOwnerAccount,
    timeOfTransaction: Date.now(),
  });

  await session.commitTransaction();
  session.endSession();
  
  res.status(200).json({
    status: "success",
    data: {
      transaction: {
        deposit
      }
    },
  });
});