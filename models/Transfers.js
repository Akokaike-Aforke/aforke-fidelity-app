const mongoose = require("mongoose");
const transferSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["credit", "debit"],
    },
    charges: {
      type: Number,
      default: 0
    },
    client: String,
    clientAccountNumber: Number,
    clientFullname: String,
    transactionAmount: Number,
    timeOfTransaction: Date,
    description: String,
    balance: Number
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

transferSchema.pre("save", function(next){
  if(this.description)
    this.description = this.description.substring(0, 30);
    next();
})

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
