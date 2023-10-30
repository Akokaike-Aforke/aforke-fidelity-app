const mongoose = require("mongoose");
const accountSchema = new mongoose.Schema(
  {
    accountNumber: {
      type: String,
      required: [true, "account Number is required"],
      unique: [true, "this account number is not unique"],
    },
    accountBalance: {
      type: Number,
      default: 0,
    },
    accountType: {
      type: String,
      required: [true, "account type is required"],
      enum: {
        values: ["savings", "current", "fixed-deposit"],
        message: "Account type is either savings, current of fixed-deposit",
      },
    },
    bvn: {
      type: String,
      required: [true, "bvn is required"],
      unique: [true, "this bvn number is already in use"],
      minLength: 14,
      maxLength: 14,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      // required: [true, "An account must belong to a user"]
    },
  },
  {
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
  }
);
// accountSchema.virtual("u")
accountSchema.virtual("clearedBalance").get(function () {
  return this.accountBalance - 1000;
});
const Account = mongoose.model("Account", accountSchema);
module.exports = Account;
