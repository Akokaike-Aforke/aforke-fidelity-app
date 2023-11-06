const express = require("express");
const accountController = require("./../controllers/accountController");
const { protect } = require("./../controllers/authController");
const { getMe } = require("./../controllers/userController");

const router = express.Router();
router
  .route("/newAccount")
  .post(protect, getMe, accountController.createAnotherAccount);
  router
    .route("/accountNumber").post(accountController.createAccountNumber);
router
  .route("/")
  .get(protect, accountController.getAllAccounts)
  .post(protect, accountController.createAccount);

module.exports = router;
