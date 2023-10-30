const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./../../models/userModel");

dotenv.config({ path: `${__dirname}/../../config.env` });

console.log(process.env.DATABASE);
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
  .then((con) => console.log("Successful Database connection"));

const deleteData = async () => {
  try {
    await User.deleteMany();
    console.log("users successfully deleted")
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

if (process.argv[2] === "--delete") {
  deleteData();
}
