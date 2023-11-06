const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./../../models/userModel2");
const Transactions = require("./../../models/Transfers");
const Accounts = require("./../../models/accountModel2");

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
    console.log("users successfully deleted");
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

const deleteTransaction = async() =>{
  try {
    await Transactions.deleteMany();
    console.log("Transactions successfully deleted");
    process.exit();
  } catch (err) {
    console.log(err);
  }
}

const deleteAccounts = async () => {
  try {
    await Accounts.deleteMany();
    console.log("Accounts successfully deleted");
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

const deleteAll = async () => {
  try {
    await Transactions.deleteMany();
    await User.deleteMany();
    await Accounts.deleteMany();
    console.log("All models successfully deleted");
    process.exit();
  } catch (err) {
    console.log(err);
  }
};

if (process.argv[2] === "--delete") {
  deleteData();
}
if (process.argv[2] === "--deleteT"){
  deleteTransaction();
}

if (process.argv[2] === "--deleteAll") {
  deleteAll();
}
