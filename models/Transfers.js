const mongoose = require("mongoose");
const transferSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["credit", "debit"],
    },
    client: String,
      transactionAmount: Number,
      timeOfTransaction: Date,
      description: String
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

transferSchema.pre(/^find/, function (next) {
  this.populate({
    path: "accountOwner",
    select: "username",
  });
  next();
});

transferSchema.pre(/^find/, function (next) {
  this.populate({
    path: "otherUser",
    select: "username",
  });
  next();
});

const Transfer = mongoose.model("Transfer", transferSchema);
module.exports = Transfer;
