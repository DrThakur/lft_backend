const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
    },
    members: {
      type: Array,
    },
  },
  { timestamps: true }
);

// Model
const Conversation = mongoose.model("Conversation", ConversationSchema);

module.exports = Conversation;
