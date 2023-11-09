const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
// const User = require("./../models/userModel");
const User = require("./../models/userModel2");
// const Account = require("./../models/accountModel")
const Account = require("./../models/accountModel2");
const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const sendEmail = require("./../utils/email");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    //    secure: true,
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
  }
  user.password = undefined;
  user.pin = undefined;
  res.cookie("jwt", token, cookieOptions);
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const { accountNumber, accountType, bvn } = req.body;
  const account = await req.body.account;
  const newUser = await User.create({
    fullname: req.body.fullname,
    email: req.body.email,
    username: req.body.username,
    dateOfBirth: req.body.dateOfBirth,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    pin: req.body.pin,
    pinConfirm: req.body.pinConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    accounts: [account._id],
    profilePhoto: ""
    // transactions: req.body.transactions
    // accounts: [
    //   // ...req.body.accounts,
    //   {
    //     accountType,
    //     accountNumber,
    //     bvn,
    //   },
    // ],

    // role: req.body.role,
  });
  // if(!newUser){
  //     return next(new AppError("No user created", 404))
  // }
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  //check if username and password exists
  if (!username || !password) {
    return next(new AppError("Please provide username and password!", 400));
  }

  //check if user exists and password is correct
  const user = await User.findOne({ username }).select("+password");
  if (!user || !(await user.correctPasswordOrPin(password, user.password))) {
    return next(new AppError("Incorrect username or password", 401));
  }

  // user.accounts[0].clearedBalance = user.accounts[0].accountBalance - 1000;
  console.log(user.accounts[0].clearedBalance);
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //1. get token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access", 401)
    );
  }

  //2. verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3. check if user still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError("The user belonging to this token no longer exists", 401)
    );
  }
  //4. check if user changed password after the token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again", 401)
    );
  }

  req.user = freshUser;

  //grant access to protected route
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1. get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with this email address", 404));
  }
  //2. generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //3. send to user's email

  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forg2ot your password? Submit a PATCH request with your new password and password confirm to ${resetURL}.\nif you did not forget your password, please ignore this email`;
  console.log(resetURL);

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token(valid for 10 days)",
      message,
    });
    res.status(200).json({
      status: "success",
      message: "token sent to email",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });
    return next(
      new AppError("There was an error sending the email. Try again later", 500)
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1. get user based on token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2. if token has not expired and there is still user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //3. update changedPasswordAt property for the current user(done at userSchema.pre("save", function(){......}))

  //4. log user in by sending JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1. get user from collection
  const user = await User.findById(req.user.id).select("+password");
  //2. check if posted current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong", 401));
  }
  //3. if so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //4. log user in, send JWT
  createSendToken(user, 200, res);
});
