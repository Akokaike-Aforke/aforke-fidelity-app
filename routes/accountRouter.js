const express = require("express");
// const transactionController = require("./../controllers/transactionController");
const accountController = require("./../controllers/accountController");
const { protect } = require("./../controllers/authController");
const { getMe } = require("./../controllers/userController");

const router = express.Router();

// router.route("/deposit").post(protect, getMe, transactionController.deposit);
router.route("/newAccount").post(protect, getMe, accountController.createAnotherAccount);
router
  .route("/")
  .get(protect, accountController.getAllAccounts)
  .post(protect, accountController.createAccount);
  
module.exports = router;
