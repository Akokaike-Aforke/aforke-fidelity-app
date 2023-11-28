const mongoose = require("mongoose");
const validator = require("validator");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const Account = require("./accountModel2");
const Transaction = require("./Transfers");
const user2Schema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: [true, "first name is required"],
      validate: {
        validator: function (val) {
          const nameRegex =
            /^[A-Z][A-Z]+-{0,1}[A-Z]+\s[A-Z]+-{0,1}[A-Z]+$|^[A-Z][A-Z]+-{0,1}[A-Z]+\s[A-Z]+-{0,1}[A-Z]+\s[A-Z]+-{0,1}[A-Z]+$/gi;
          let wsRegex2 =
            /^[A-Z]([A-Z]+-{0,1}[A-Z]+\s){1,2}[A-Z]+-{0,1}[A-Z]+$/gi;
          return wsRegex2.test(val);
        },
        message:
          "A user name must contain greater than 2 and less than 3 words",
      },
      lowercase: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, "date of birth is required"],
    },
    email: {
      type: String,
      required: [true, "email is required"],
      validate: [validator.isEmail, "Please provide a valid email"],
      unique: [true, "this email is already in use"],
      lowercase: true,
      trim: true,
    },
    bvn: {
      type: String,
      unique: [true, "this bvn number is already in use"],
      minLength: 14,
      maxLength: 14,
    },
    accounts: Array,
    selectedAccount: {
      type: Number,
      default: 0,
    },
    username: {
      type: String,
      required: [true, "a username is required"],
      unique: [true, "this username is already in use"],
      lowercase: true,
      trim: true
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    password: {
      type: String,
      required: [true, "password is required"],
      select: false,
      trim: true,
    },
    passwordConfirm: {
      type: String,
      required: [true, "Please confirm password"],

      //custom validators only work on model.create() and model.save() not model.findByIdAndUpdate()
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: "Passwords are not the same",
      },
      trim: true,
    },
    profilePhoto: String,
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    pin: {
      type: String,
      required: [true, "pin is required"],
      trim: true,
    },
    pinConfirm: {
      type: String,
      required: [true, "Please confirm your pin"],
      validate: {
        validator: function (el) {
          return el === this.pin;
        },
        message: "Pins are not the same",
      },
      trim: true,
    },
    pinChangedAt: Date,
    pinResetToken: String,
    pinResetExpires: Date,
    dateCreated: { type: Date, default: () => new Date() },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    // child referencing uses array
    // remove child referencing and use virtual populate instead
    // transactions: [
    //   {
    //     type: mongoose.Schema.ObjectId,
    //     ref: 'Transaction',
    //   },
    // ],
  },
  {
    // Include virtual properties when converting the document to JSON
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// user2Schema.virtual("accounts.clearedBalance").get(function () {
//   return this.accounts.accountBalance - 1000;
// });
user2Schema.pre("save", function (next) {
  if (!this.bvn) {
    // Generate a random 10-digit account number
    const uniqueBVN = generateUniqueBVN();
    this.bvn = uniqueBVN;
  }
  next();
});
user2Schema.pre("save", async function (next) {
  const accountPromises = this.accounts.map(
    async (id) => await Account.findById(id)
  );
  this.accounts = await Promise.all(accountPromises);
  next();
});

// userSchema.pre("save", async function(next)
// {
//     const transactionPromises = this.transactions.map( async (id) => await Transaction.findById(id));
//     this.transactions = await Promise.all(transactionPromises);
//     next();
// })

// userSchema.pre("save", function (next) {
//   this.clearedBalance = this.balance - 1000;
//   next();
// });

user2Schema.pre("save", async function (next) {
  //only run this function if password was modified
  if (!this.isModified("password")) {
    return next();
  }
  //hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  //delete the password confirm from the database
  this.passwordConfirm = undefined;
  next();
});

user2Schema.pre("save", async function (next) {
  if (!this.isModified("pin")) {
    return next();
  }
  this.pin = await bcrypt.hash(this.pin, 12);
  this.pinConfirm = undefined;
  next();
});

user2Schema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) {
    return next();
  }
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

user2Schema.pre("save", function (next) {
  if (!this.isModified("pin") || this.isNew) {
    return next();
  }
  this.pinChangedAt = Date.now() - 1000;
  next();
});

user2Schema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// userSchema.methods.correctPassword = async function (
//   candidatePassword,
//   userPassword
// ) {
//   return await bcrypt.compare(candidatePassword, userPassword);
// };

user2Schema.methods.correctPasswordOrPin = async function (
  candidateValue,
  userValue
) {
  return await bcrypt.compare(candidateValue, userValue);
};

user2Schema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimeStamp < changedTimeStamp;
  }
  return false;
};

user2Schema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  console.log({ resetToken }, this.passwordResetToken);
  return resetToken;
};

user2Schema.methods.createPinResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.pinResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.pinResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

function generateUniqueBVN() {
  const min = 10000000000000; // Minimum 14-digit number
  const max = 99999999999999; // Maximum 14-digit number
  const randomAccountNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  return randomAccountNumber.toString();
}
// userSchema.post("save", async function () {
//   const accountPromises = this.accounts.map(
//     async (id) => await Account.findById(id)
//   );
//   this.accounts = await Promise.all(accountPromises);
// });

const User2 = mongoose.model("User2", user2Schema);
module.exports = User2;
