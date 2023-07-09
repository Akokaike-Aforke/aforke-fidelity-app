const mongoose = require("mongoose");
const dotenv = require("dotenv");

//handling errors(uncaught exceptions) for synchronous codes
process.on("uncaughtException", err =>{
  console.log(err);
  console.log("UNCAUGHT EXCEPTION!!! shutting down");
    process.exit(1);
})

const app = require("./app");
dotenv.config({ path: "./config.env" });
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
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
  server.close(()=>{ 
  process.exit(1); 
})
});