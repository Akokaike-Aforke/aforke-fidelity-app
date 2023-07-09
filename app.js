const express = require("express");
const cors = require("cors");
const AppError = require("./utils/appError");
const globalErrorHandleer = require("./controllers/errorController");
const userRouter = require("./routes/userRouter");
const app = express();
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  req.timeDone = new Date().toISOString(); 
  next();
});
// const getTimeCreated = app.use((req, res, next) => {
//   req.timeCreated = new Date().toISOString();
//   next();
// }); 
app.use("/api/v1/users", userRouter);
app.all("*", (req, res, next) => {
  next(new AppError(`cannot find ${req.originalUrl} on this server`, 404));
});
app.use(globalErrorHandleer);
module.exports = app;
