const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

const AppError = require("./utils/appError");
const globalErrorHandleer = require("./controllers/errorController");
// const userRouter = require("./routes/userRouter");
const userRouter = require("./routes/userRoutes2");
const transactionRouter = require("./routes/transactionRouter")
const accountRouter = require("./routes/accountRouter")
const app = express();

//GLOBAL MIDDLEWARE
//set security http headers
app.use(helmet());
app.use(cors());
const limiter = rateLimit({
  max: 200,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from the IP. Please try again in an hour!",
});

//limit requests
app.use("/api", limiter);

//body parser, reading data from the body into req.body
app.use(express.json({ limit: "10kb" }));

//data sanitization against noSQL query injection
app.use(mongoSanitize());
//data sanitization against XSS attacks
app.use(xss());
//data sanitization agains parameter pollution
app.use(hpp({ whitelist: ["duration", "ratingsQuantity", "ratingsAverage "] }));

app.use((req, res, next) => {
  req.timeDone = new Date().toISOString();
  // console.log(req.headers)
  next();
});
// const getTimeCreated = app.use((req, res, next) => {
//   req.timeCreated = new Date().toISOString();
//   next();
// });

app.use("/api/v1/users", userRouter);
app.use("/api/v1/accounts", accountRouter);
app.use("/api/v1/transactions", transactionRouter)
app.all("*", (req, res, next) => {
  next(new AppError(`cannot find ${req.originalUrl} on this server`, 404));
});
app.use(globalErrorHandleer);
module.exports = app;
