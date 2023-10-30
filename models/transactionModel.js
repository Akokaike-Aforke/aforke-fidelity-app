// // const mongoose = require("mongoose")
// // const transactionSchema = new mongoose.Schema(
// //   {
// //     //parent referencing does not use arrays
// //     accountOwner: {
// //       type: mongoose.Schema.ObjectId,
// //       ref: "User",
// //       required: [true, "Transaction must belong to a sender"],
// //     },
// //     otherUser: {
// //       type: mongoose.Schema.ObjectId,
// //       ref: "User",
// //       required: [true, "Transaction must belong to a receiver"],
// //     },
// //     transactionAmount: {
// //       type: Number,
// //       required: [true, "An amount is required"],
// //     },
// //     description: {
// //       type: String,
// //     },
// //     timeOfTransaction: Date,
// //     accountOwnerAccount: {
// //       type: mongoose.Schema.ObjectId,
// //       ref: "Account",
// //       // required: [true, "Transaction must belong to a sender"],
// //     },
// //     accountOtherUserAccount: {
// //       type: mongoose.Schema.ObjectId,
// //       ref: "Account",
// //       // required: [true, "Transaction must belong to a receiver"],
// //     },
// //   },
// //   {
// //     toJSON: { virtuals: true },
// //     toObject: { virtuals: true },
// //   }
// // );

// // // transactionSchema.pre("save", function(next){
// // //     this.description = this.description.subString(0, 100);
// // //     next();
// // // })

// // transactionSchema.pre(/^find/, function(next){
// //     this.populate({
// //         path: "accountOwner",
// //         select: "username"
// //     })
// //     next();
// // })

// // transactionSchema.pre(/^find/, function (next) {
// //   this.populate({
// //     path: "otherUser",
// //     select: "username",
// //   });
// //   next();
// // });

// // const Transaction = mongoose.model("Transaction", transactionSchema);
// // module.exports = Transaction;






// const mongoose = require("mongoose");
// const transactionSchema = new mongoose.Schema(
//   {
//     transactionAmount: Number,
//     dateOfTransaction: {
//       type: Date,
//       default: Date.now(),
//     },
//     description: String,
//     receiverUsername: String,
//     [this.transactionAmount > 0 ? "Credit" : "Debit"]: {
//       transactionAmount: {
//         type: Number,
//         default: this.transactionAmount,
//       },

//       dateOfTransaction: {
//         type: Date,
//         default: this.dateOfTransaction,
//       },
//       description: {
//         type: String,
//         default: this.description,
//       },
//     },
//   },
//   {
//     toJSON: { virtuals: true },
//     toObject: { virtuals: true },
//   }
// );

// // transactionSchema.pre("save", function(next){
// //     this.description = this.description.subString(0, 100);
// //     next();
// // })

// transactionSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: "accountOwner",
//     select: "username",
//   });
//   next();
// });

// transactionSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: "otherUser",
//     select: "username",
//   });
//   next();
// });

// const Transaction = mongoose.model("Transaction", transactionSchema);
// module.exports = Transaction;
const mongoose = require("mongoose");
const transactionSchema = new mongoose.Schema(
  {
    transactionAmount: Number,
    dateOfTransaction: {
      type: Date,
      default: Date.now(),
    },
    description: String,
    receiverUsername: String,
    [this.transactionAmount > 0 ? "Credit" : "Debit"]: {
      transactionAmount: {
        type: Number,
        default: this.transactionAmount,
      },

      dateOfTransaction: {
        type: Date,
        default: this.dateOfTransaction,
      },
      description: {
        type: String,
        default: this.description,
      },
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// transactionSchema.pre("save", function(next){
//     this.description = this.description.subString(0, 100);
//     next();
// })


