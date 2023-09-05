const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  conversationId: {
    type: String,
    unique: true,
  },
  convo: [
    {
      content: String,
      role: {
        type: String,
        enum: ["user", "ai"],
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

module.exports.Conversation = mongoose.model("Conversation", conversationSchema);
