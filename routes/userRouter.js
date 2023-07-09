const express = require('express');
const app = require('./../app')
const {getAllUsers, getUser, createUser, updateUser, deleteUser, getTimeCreated} = require('./../controllers/userController')
const router = express.Router();


router.route('/').get(getAllUsers).post(createUser)
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);
module.exports=router