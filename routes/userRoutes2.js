const express = require("express");
const app = require("./../app");
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getTimeCreated,
  updateMe,
  updateSelectedAccount,
  deleteMe,
  getMe,
  transfer,
  deposit,
} = require("./../controllers/userController");
const { createAccount } = require("./../controllers/accountController");
const authController = require("./../controllers/authController");
// const transactionController = require("./../controllers/transactionController2");
const router = express.Router();

router.patch(
  "/updateSelectedAccount",
  authController.protect,
  getMe,
  updateSelectedAccount
);
router.get("/me", authController.protect, getMe, getUser);
router.post("/signup", createAccount, authController.signup);
router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);
router.patch(
  "/updateMyPassword",
  authController.protect,
  authController.updatePassword
);
router.patch("/updateMe", authController.protect, getMe, updateMe);

router.delete("/deleteMe", authController.protect, deleteMe);
// router.post("/transfer", authController.protect, getMe, transfer)
// router.post("/deposit", authController.protect, getMe, deposit)

router.route("/").get(authController.protect, getAllUsers).post(createUser);
router
  .route("/:id")
  .get(getUser)
  .patch(updateMe)
  .delete(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    deleteUser
  );

//create a router for user transactions
// router.route("/:userId/transactions").post(authController.protect,  transactionController.createTransaction);
module.exports = router;
