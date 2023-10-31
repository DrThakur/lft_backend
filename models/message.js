const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
    },
    senderId: {
      type: String,
    },
    senderName: {
      type: String,
    },
    senderImage: {
      type: String,
    },
    text: {
      type: String,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", MessageSchema);

module.exports = Message;
