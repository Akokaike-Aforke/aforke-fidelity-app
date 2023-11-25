// const path = require("path")
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");

const AppError = require("./utils/appError");
const globalErrorHandleer = require("./controllers/errorController");
// const userRouter = require("./routes/userRouter");
const userRouter = require("./routes/userRoutes2");
const transactionRouter = require("./routes/transactionRouter");
const accountRouter = require("./routes/accountRouter");
const userController = require("./controllers/userController");
const fs = require("fs");
const app = express();

//SETTING UP PUG
// app.set("view engine", "pug");
// app.set("view", path.join(__dirname, "views"))

// const multer = require("multer");
// const uploadDir = "uploads";
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir);
// }
// const storage = multer.diskStorage({
//   // destination: "uploads/", // Define where to store the uploaded files
//   // destination: (req, file, cb) => cb(null, "./uploads"),
//   destination: (req, file, cb) => cb(null, "./public/profileImages"),
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + "--" + file.originalname);
//   },
// });
// const upload = multer({ storage: storage });
// const upload = multer({ dest: "uploads/" });

//GLOBAL MIDDLEWARE
//set security http headers
// app.use("/images", express.static("images2"));
app.use(express.static(`${__dirname}/public`));
app.use(helmet());
// app.use(cors());
// app.use(cors({ credentials: true, origin: "http://127.0.0.1:5173" }));
const corsOptions = {
  origin: "https://aforke-bankify.netlify.app", // Replace with your Netlify frontend URL
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};
// app.use(
//   cors({ credentials: true, origin: "https://aforke-bankify.netlify.app" })
// );

app.use(cors(corsOptions));
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from the IP. Please try again in an hour!",
});

//limit requests
app.use("/api", limiter);

//body parser, reading data from the body into req.body
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

//data sanitization against noSQL query injection
app.use(mongoSanitize());
//data sanitization against XSS attacks
app.use(xss());
//data sanitization agains parameter pollution
app.use(hpp({ whitelist: ["duration", "ratingsQuantity", "ratingsAverage "] }));

app.use((req, res, next) => {
  req.timeDone = new Date().toISOString();
  console.log(req.timeDone);
  next();
});
// const getTimeCreated = app.use((req, res, next) => {
//   req.timeCreated = new Date().toISOString();
//   next();
// });

app.get("/", (req, res) => {
  res.status(200).render("base");
});
app.use("/api/v1/users", userRouter);
app.use("/api/v1/accounts", accountRouter);
app.use("/api/v1/transactions", transactionRouter);
app.all("*", (req, res, next) => {
  next(new AppError(`cannot find ${req.originalUrl} on this server`, 404));
});
app.use(globalErrorHandleer);
module.exports = app;
