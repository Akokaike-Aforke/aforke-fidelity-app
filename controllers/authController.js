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

// const signToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRES_IN,
//   });
// };

const signToken = (id) => {
  return jwt.sign(
    { id },
    "this_is_why_it_is_very_important_to_go_to_the_mall_after_shopping_for_a_long_45_days_of_work",
    {
      expiresIn: "90d",
    }
  );
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    //    secure: true,
    httpOnly: false,
    sameSite: "none",
  };
  // if (process.env.NODE_ENV === "production") {
  //   cookieOptions.secure = true;
  // }
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
  try {
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
      profilePhoto: "",
    });
    createSendToken(newUser, 201, res);
  } catch (err) {
    console.log(err);
    res.status(400).json({ status: "fail", message: err.message });
  }
  
});

exports.login = catchAsync(async (req, res, next) => {
  try{
  const { username, password } = req.body;

  //check if username and password exists
  if (!username || !password) {
    // return next(new AppError("Please provide username and password!", 400));
    return res.status(400).json({
      status: "fail",
      message: "Please provide username and password!",
    });
  }

  //check if user exists and password is correct
    const user = await User.findOne({ username }).select("+password");
    if (!user || !(await user.correctPasswordOrPin(password, user.password))) {
      // return next(new AppError("Incorrect username or password", 401));
      return res.status(401).json({
        status: "fail",
        message: "Incorrect username or password",
      });
    }

  // user.accounts[0].clearedBalance = user.accounts[0].accountBalance - 1000;
  createSendToken(user, 200, res);
  }
  catch(err){
    console.log(err)
    res.status(400).json({ status: "fail", message: err.message });
  }
});

exports.protect = catchAsync(async (req, res, next) => {
  //1. get token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    // return next(
    // new AppError("You are not logged in! Please log in to get access", 401)

    // );
    return res.status(401).json({
      status: "fail",
      message: "You are not logged in! Please log in to get access",
    });
  }

  //2. verify token
  // const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const decoded = await promisify(jwt.verify)(
    token,
    "this_is_why_it_is_very_important_to_go_to_the_mall_after_shopping_for_a_long_45_days_of_work"
  );

  //3. check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    // return next(
    // new AppError("The user belonging to this token no longer exists", 401)
    // );

    return res.status(401).json({
      status: "fail",
      message: "The user belonging to this token no longer exists",
    });
  }
  //4. check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    // return next(
    //   new AppError("User recently changed password! Please log in again", 401)
    // );
    return res.status(401).json({
      status: "fail",
      message: "User recently changed password! Please log in again",
    });
  }

  req.user = currentUser;

  //grant access to protected route
  next();
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  //1. get token and check if it's there
  let token;
  if (req.cookies.jwt) {
    //2. verify token
    const decoded = await promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET
    );

    //3. check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next();
    }
    //4. check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next();
    }

    req.user = currentUser;

    //grant access to protected route
    next();
  }
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      // return next(
      //   new AppError("You do not have permission to perform this action", 403)
      // );
      return res.status(403).json({
        status: "fail",
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1. get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    // return next(new AppError("There is no user with this email address", 404));
    return res.status(404).json({
      status: "fail",
      message: "There is no user with this email address",
    });
  }
  //2. generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //3. send to user's email

  // const resetURL = `${req.protocol}://${req.get(
  //   "host"
  // )}/api/v1/users/resetPassword/${resetToken}`;
  const resetURL = `http://127.0.0.1:5173/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new password and password confirm to ${resetURL}.\nif you did not forget your password, please ignore this email`;
  console.log(resetURL);

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token(valid for 10 minutes)",
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
    // return next(
    //   new AppError("There was an error sending the email. Try again later", 500)
    // );
    return res.status(500).json({
      status: "error",
      message: "There was an error sending the email. Try again later",
    });
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  console.log(req.params.token);
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
    // return next(new AppError("Token is invalid or has expired", 400));
    return res.status(400).json({
      status: "fail",
      message: "Token is invalid or has expired",
    });
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  try {
    //added the next 2 lines so i can validate password and passwordConfirm only
    await user.validate("password");
    await user.validate("passwordConfirm");

    await user.save({ validateBeforeSave: false });

    //3. update changedPasswordAt property for the current user(done at userSchema.pre("save", function(){......}))

    //4. log user in by sending JWT
    createSendToken(user, 200, res);
  } catch (err) {
    console.log(err);
    res.status(400).json({ status: "fail", message: err.message });
  }
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1. get user from collection
  const user = await User.findById(req.user.id).select("+password");
  //2. check if posted current password is correct
  if (
    !(await user.correctPasswordOrPin(req.body.passwordCurrent, user.password))
  ) {
    // return next(new AppError("Your current password is wrong", 401));
    return res.status(401).json({
      status: "fail",
      message: "Your current password is wrong",
    });
  }
  //3. if so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  try {
    await user.validate("password");
    await user.validate("passwordConfirm");
    await user.save({ validateBeforeSave: false });
    //4. log user in, send JWT
    createSendToken(user, 200, res);
  } catch (err) {
    console.log(err);
    res.status(400).json({ status: "fail", message: err.message });
  }
});

exports.forgotPin = catchAsync(async (req, res, next) => {
  //1. get user based on posted email
  // const user = await User.findOne({ email: req.body.email });
  const user = await User.findById(req.params.id).select("+password");

  if (!user) {
    // return next(new AppError("There is no user with this email address", 404));
    return res.status(404).json({
      status: "fail",
      message: "There is no user with this email address",
    });
  }

  const { email, password } = req.body;
  if (
    !email ||
    !password ||
    email !== user.email ||
    !(await user.correctPasswordOrPin(password, user.password))
  ) {
    // return next(new AppError("Invalid email or password", 404));
    return res.status(404).json({
      status: "fail",
      message: "Invalid email or password",
    });
  }
  //2. generate random reset token
  const resetToken = user.createPinResetToken();
  await user.save({ validateBeforeSave: false });
  //3. send to user's email

  // const resetURL = `${req.protocol}://${req.get(
  //   "host"
  // )}/api/v1/users/resetPin/${resetToken}`;
  const resetURL = `http://127.0.0.1:5173/resetPin/${resetToken}`;
  const message = `Forgot your pin? Submit a PATCH request with your new password and password confirm to ${resetURL}.\nif you did not forget your password, please ignore this email`;
  console.log(resetURL);

  try {
    await sendEmail({
      email: user.email,
      subject: "Your pin reset token(valid for 10 minutes)",
      message,
    });
    res.status(200).json({
      status: "success",
      message: "token sent to email",
    });
  } catch (err) {
    user.pinResetToken = undefined;
    user.pinResetExpires = undefined;

    await user.save({ validateBeforeSave: false });
    // return next(
    //   new AppError("There was an error sending the email. Try again later", 500)
    // );

    return res.status(500).json({
      status: "error",
      message: "There was an error sending the email. Try again later",
    });
  }
});

exports.resetPin = catchAsync(async (req, res, next) => {
  console.log(req.params.token);
  //1. get user based on token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    pinResetToken: hashedToken,
    pinResetExpires: { $gt: Date.now() },
  });

  //2. if token has not expired and there is still user, set the new password
  if (!user) {
    // return next(new AppError("Token is invalid or has expired", 400));
    return res.status(400).json({
      status: "error",
      message: "Token is invalid or has expired",
    });
  }
  user.pin = req.body.pin;
  user.pinConfirm = req.body.pinConfirm;
  user.pinResetToken = undefined;
  user.pinResetExpires = undefined;

  //added the next 2 lines so i can validate password and passwordConfirm only
  try {
    await user.validate("pin");
    await user.validate("pinConfirm");

    await user.save({ validateBeforeSave: false });

    //3. update changedPasswordAt property for the current user(done at userSchema.pre("save", function(){......}))

    //4. log user in by sending JWT
    createSendToken(user, 200, res);
  } catch (err) {
    console.log(err);
    res.status(400).json({ status: "fail", message: err.message });
  }
});

exports.updatePin = catchAsync(async (req, res, next) => {
  //1. get user from collection
  const user = await User.findById(req.user.id).select("+pin +password");

  if (!(await user.correctPasswordOrPin(req.body.password, user.password))) {
    // return next(new AppError("Your password is wrong", 401));
    return res.status(401).json({
      status: "fail",
      message: "Your password is wrong",
    });
  }
  //2. check if posted current password is correct
  if (!(await user.correctPasswordOrPin(req.body.pinCurrent, user.pin))) {
    // return next(new AppError("Your current pin is wrong", 401));
    return res.status(401).json({
      status: "fail",
      message: "Your current pin is wrong",
    });
  }
  //3. if so, update password
  user.pin = req.body.pin;
  user.pinConfirm = req.body.pinConfirm;
  await user.validate("pin");
  await user.validate("pinConfirm");
  await user.save({ validateBeforeSave: false });
  //4. log user in, send JWT
  createSendToken(user, 200, res);
});
