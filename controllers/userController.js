const User = require('./../models/userModel');
const AppError = require('./../utils/appError')
const catchAsync = require('./../utils/catchAsync')

exports.getAllUsers = catchAsync(async (req, res, next) =>{
        const users = await User.find();
        res.status(200).json({
            status:"success",
            timeRequested: req.timeDone,
            data:{
                users
            }
        })
    
});

exports.getUser = catchAsync(async (req, res, next) =>{
        const user = await User.findById(req.params.id);
        if(!user){
           return next(new AppError(`No tour found with the id: ${req.params.id}`, 404)) }
  
        console.log(req.timeCreated)
        res.status(200).json({
          status: "success",
          timeRequested: req.timeDone,
          data: {
            user,
          },
        });
});

exports.createUser = catchAsync(async (req, res, next) =>{
        const user = await User.create(req.body);
        res.status(201).json({
          status: "success",
          timeCreated: new Date().toISOString(),
          data: {
            user,
          },
        });
});

exports.updateUser = catchAsync(async (req, res, next) =>{
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {new:true, runValidators:true})
        if (!user) {
          return next(
            new AppError(`No tour found with the id: ${req.params.id}`, 404)
          );
        }
        res.status(200).json({
            status:"success",
            timeUpdated: req.timeDone,
            data:{
                user
            }
        })
});

exports.deleteUser = catchAsync(async (req, res) =>{
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
          return next(
            new AppError(`No tour found with the id: ${req.params.id}`, 404)
          );
        }
    res.status(204).json({
        status:"succes",
        data:null
    })
});