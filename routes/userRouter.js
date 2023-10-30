const express = require('express');
const app = require('./../app')
const {getAllUsers, getUser, createUser, updateUser, deleteUser, getTimeCreated, updateMe, deleteMe, getMe, transfer, deposit, createAccount} = require('./../controllers/userController')
const authController = require("./../controllers/authController")
const transactionController = require("./../controllers/transactionController")
const router = express.Router();

router.get("/me", authController.protect, getMe, getUser)
router.post("/signup", createAccount, authController.signup);
router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);
router.patch("/updateMyPassword", authController.protect, authController.updatePassword)
router.patch("/updateMe", authController.protect, updateMe)
router.delete("/deleteMe", authController.protect, deleteMe)
// router.post("/transfer", authController.protect, getMe, transfer)
// router.post("/deposit", authController.protect, getMe, deposit)

router.route('/').get(authController.protect, getAllUsers).post(createUser)
router.route('/:id').get(getUser).patch(updateUser).delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), deleteUser);

//create a router for user transactions
// router.route("/:userId/transactions").post(authController.protect,  transactionController.createTransaction);
module.exports=router 