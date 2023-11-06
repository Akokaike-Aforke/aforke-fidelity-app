const express = require("express");
// const transactionController = require("./../controllers/transactionController");
const transactionController = require("./../controllers/transactionController2");
const { protect } = require("./../controllers/authController")
const { getMe } = require("./../controllers/userController")

const router = express.Router();

router.route("/deposit").post(protect, getMe, transactionController.deposit);
router.route("/transactionHistory").post(protect, getMe, transactionController.getSpecifiedTransactions);
router.route("/").get(protect, transactionController.getAllTransactions).post(protect, getMe, transactionController.createTransaction)
module.exports = router;