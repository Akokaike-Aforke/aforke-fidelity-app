const mongoose = require("mongoose");
const Transaction = require("./Transfers");
const account2Schema = new mongoose.Schema(
  {
    accountNumber: {
      type: String,
      //   required: [true, "account Number is required"],
      unique: [true, "this account number is not unique"],
    },
    accountBalance: {
      type: Number,
      default: 0,
    },
    clearedBalance: {
      type: Number,
      default: -1000,
    },
    accountType: {
      type: String,
      required: [true, "account type is required"],
      enum: {
        values: ["savings", "current", "fixed-deposit"],
        message: "Account type is either savings, current of fixed-deposit",
      },
    },
    dateCreated: {
      type: Date, 
      default: () => new Date() 
    },
    transactions: Array,
  },
  {
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  }
);
// account2Schema.pre("save", function (next) {
//   if (!this.accountNumber) {
//     // Generate a random 10-digit account number
//     const uniqueAccountNumber = generateUniqueAccountNumber();
//     this.accountNumber = uniqueAccountNumber;
//   }
//   next();
// });

// // Define a function to generate a unique 10-digit account number
// function generateUniqueAccountNumber() {
//   const min = 1000000000; // Minimum 10-digit number
//   const max = 9999999999; // Maximum 10-digit number
//   const randomAccountNumber = Math.floor(Math.random() * (max - min + 1)) + min;
//   return randomAccountNumber.toString();
// }

account2Schema.pre(/^find/, async function (next) {
  if (this.transactions) {
    const transactionPromises = this.transactions.map(
      async (id) => await Transaction.findById(id)
    );
    this.transactions = await Promise.all(transactionPromises);
  } else this.transactions = [];
  next();
});

const Account2 = mongoose.model("Account2", account2Schema);
module.exports = Account2;
