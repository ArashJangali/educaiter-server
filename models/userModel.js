const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");



const userSchema = new mongoose.Schema({
  usageCount: {
    type: Number,
    default: 0,
  },
  
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: false,
  },
  picture: {
    type: String,
    required: false,
  },
  verificationToken: {
    type: String,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },

  subscription: {
    sessionId: {
      type: String,
    },
    stripeSubscriptionId: {
      type: String, 
      required: false,
    },
    planId: {
      type: String,
      required: false
    },
    planType: {
      type: String,
      required: false,
      default: 'unsubscribed'
    },
    planStartDate: {
      type: String,
      required: false
    },
    planEndDate: {
      type: String,
      required: false
    },
    planDuration: {
      type: String,
      required: false
    },
  },
  tierId: {
    type: String,
    required: false, 
  },
  subscriptionStatus: {
    type: String,
    required: false,
    enum: ['active', 'inactive', 'canceled']
  },
  hasUsedFreeTrial: {
    type: Boolean,
    default: false,
  },
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  next();
});

module.exports = mongoose.model("User", userSchema);
