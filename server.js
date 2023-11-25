const mongoose = require("mongoose");
const dotenv = require("dotenv");

//handling errors(uncaught exceptions) for synchronous codes
process.on("uncaughtException", (err) => {
  console.log(err);
  console.log("UNCAUGHT EXCEPTION!!! shutting down");
  process.exit(1);
});

const app = require("./app");
dotenv.config({ path: "./config.env" });
// const DB = process.env.DATABASE.replace(
//   "<PASSWORD>",
//   process.env.DATABASE_PASSWORD
// );

const DB =
  "mongodb+srv://lucykenneth54:<PASSWORD>@cluster0.nwfegzw.mongodb.net/bank-users?retryWrites=true&w=majority".replace(
    "<PASSWORD>",
    "6ZubCwnmDu1A6qRf"
  );

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    // w: 1,
    // j: true,
  })
  .then((con) => {
    console.log("successfully connected to database...");
  });
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log("listening on port 5000...");
});

//handling for asynchronous codes
process.on("unhandledRejection", (err) => {
  console.log(err);
  console.log("UNHANDLED REJECTION!!! shutting down");
  server.close(() => {
    process.exit(1);
  });
});

//TRIED WEBSOCKET
//DID NOT WORK

// const mongoose = require("mongoose");
// const dotenv = require("dotenv");

// const app = require("./app");
// const http = require("http");
// const { Server } = require("socket.io");
// const cors = require("cors");
// const server = http.createServer(app);
// const { handleSocketDeposit } = require("./controllers/transactionController2");
// const io = new Server(server, {
//   cors: {
//     origin: "http://127.0.0.1:5173",
//     methods: ["GET", "POST"],
//   },
// });

// //handling errors(uncaught exceptions) for synchronous codes
// process.on("uncaughtException", (err) => {
//   console.log(err);
//   console.log("UNCAUGHT EXCEPTION!!! shutting down");
//   process.exit(1);
// });

// dotenv.config({ path: "./config.env" });
// const DB = process.env.DATABASE.replace(
//   "<PASSWORD>",
//   process.env.DATABASE_PASSWORD
// );
// mongoose
//   .connect(DB, {
//     useNewUrlParser: true,
//     useCreateIndex: true,
//     useFindAndModify: false,
//     // w: 1,
//     // j: true,
//   })
//   .then((con) => {
//     console.log("successfully connected to database...");
//   });

// io.on("connect", (socket) => {
//   console.log(`User connected: ${socket.id}`);
//   socket.on("disconnect", () => {
//     console.log("User disconnected", socket.id);
//   });
// });
// const PORT = process.env.PORT || 5000;
// server.listen(PORT, () => {
//   console.log("listening on port 5000...");
// });

// //handling for asynchronous codes
// process.on("unhandledRejection", (err) => {
//   console.log(err);
//   console.log("UNHANDLED REJECTION!!! shutting down");
//   server.close(() => {
//     process.exit(1);
//   });
// });

// global.io = io;
