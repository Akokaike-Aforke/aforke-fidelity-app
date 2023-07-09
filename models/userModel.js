const mongoose = require("mongoose");
const validator = require("validator");
const userSchema = new mongoose.Schema({
  fullname: {
    type: String,
    required: [true, "first name is required"],
    validate: {
      validator: function (val) {
        const nameRegex =
          /^[A-Z][A-Z]+-{0,1}[A-Z]+\s[A-Z]+-{0,1}[A-Z]+$|^[A-Z][A-Z]+-{0,1}[A-Z]+\s[A-Z]+-{0,1}[A-Z]+\s[A-Z]+-{0,1}[A-Z]+$/gi;
        let wsRegex2 = /^[A-Z]([A-Z]+-{0,1}[A-Z]+\s){1,2}[A-Z]+-{0,1}[A-Z]+$/gi;
        return wsRegex2.test(val);
      },
      message: "A tour name must contain greater than 2 and less than 3 words",
    },
    lowercase: true,
  },
  bvn: {
    type: String,
    required: [true, "bvn is required"],
    unique: true,
    minLength: 14,
    maxLength: 14,
  },
  dateOfBirth: {
    type: Date,
    required: [true, "date of birth is required"],
  },
  email: {
    type: String,
    required: [true, "email is required"],
    validate: [validator.isEmail, "Please provide a valid email"],
    unique: true,
    lowercase: true,
  },
  accountType: {
    type: String,
    required: [true, "account type is required"],
    enum: {
      values: ["savings", "current", "fixed deposit"],
      message: "Account type is either savings, current or fixed deposit",
    },
    lowercase: true,
  },
  username: {
    type: String,
    required: [true, "a username is required"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "password is required"],
  },
  transactions: [
    {
      type: Object,
    },
  ],
  accountNumber: {
    type: String,
    required: [true, "account number is required"],
    unique: [true, "account number must be unique"],
    maxLength: 10,
    minLength: 10,
  },
  pin: {
    type: Number,
    required: [true, "pin is required"],
    unique: true,
  },
  dateCreated: { type: Date, default: () => new Date() },
});
const User = mongoose.model("User", userSchema);
module.exports = User;
