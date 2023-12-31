const mongoose = require("mongoose");
const validator = require("validator");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const Account = require("./accountModel");
const userSchema = new mongoose.Schema(
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
    },
    accounts: Array,
    username: {
      type: String,
      required: [true, "a username is required"],
      unique: [true, "this username is already in use"],
    },
    password: {
      type: String,
      required: [true, "password is required"],
    },
    passwordConfirm: {
      type: String,
      required: [true, "Please confirm password"],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: "Passwords are not the same",
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    pin: {
      type: String,
      required: [true, "pin is required"],
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
    },
    pinChangedAt: Date,
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

//virtual populate the userSchema with transactions
userSchema.virtual("transactions", {
  ref: "Transaction",
  foreignField: "accountOwner",
  localField: "_id",
});
// userSchema.virtual("clearedBalance").get(function () {
//   return this.accounts[0].accountBalance - 1000;
// });
// userSchema.virtual("availableBalance").get(function(){
//   return this.accounts[0].accountBalance
// })


//use virtual populate instead of child referencing to populate transactions
userSchema.virtual("transaction", {
  ref: "Transaction",
  localField: "_id",
  foreignField: ["sender", "receiver"]
});

// userSchema.virtual("receiver", {
//   ref: "Transaction",
//   foreignField: "receiver",
//   localField: "_id",
// });

userSchema.pre("save", async function (next) {
  const accountPromises = this.accounts.map(
    async (id) => await Account.findById(id)
  );
  this.accounts = await Promise.all(accountPromises);
  next();
});


// populate all find queries in User model
// userSchema.pre(/^find/, function(next)
// {
//   this.populate({
//     path: "transactions",
//     select: "-__v -passwordChangedAt"
//   })
// })



// userSchema.pre("save", function (next) {
//   this.clearedBalance = this.balance - 1000;
//   next();
// });

userSchema.pre("save", async function (next) {
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

userSchema.pre("save", async function (next) {
  if (!this.isModified("pin")) {
    return next();
  }
  this.pin = await bcrypt.hash(this.pin, 12);
  this.pinConfirm = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) {
    return next();
  }
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("pin") || this.isNew) {
    return next();
  }
  this.pinChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// userSchema.methods.correctPassword = async function (
//   candidatePassword,
//   userPassword
// ) {
//   return await bcrypt.compare(candidatePassword, userPassword);
// };

userSchema.methods.correctPasswordOrPin = async function (
  candidateValue,
  userValue
) {
  return await bcrypt.compare(candidateValue, userValue);
};

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimeStamp < changedTimeStamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // const resetToken = crypto.randomBytes(32).toString("hex");
  // this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  //  console.log({resetToken}, this.passwordResetToken)
  // this.passwordResetExpires = Date.now() + (10 * 60 * 1000);
  // return resetToken; 

  console.log("reset reset");
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  console.log({ resetToken }, this.passwordResetToken);
  return resetToken;
};
// userSchema.post("save", async function () {
//   const accountPromises = this.accounts.map(
//     async (id) => await Account.findById(id)
//   );
//   this.accounts = await Promise.all(accountPromises);
// });

const User = mongoose.model("User", userSchema);
module.exports = User;
