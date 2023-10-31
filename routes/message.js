const express = require("express");
const router = express.Router();
const Message = require("../models/message");

// Add new Message

router.post("/", async (req, res) => {
  console.log("My message body", req.body);

  const newMessage = new Message(req.body);

  try {
    const saveMessage = await newMessage.save();
    res.status(200).json(saveMessage);
  } catch (error) {
    res.status(500).json(error);
  }
});

// Get messagees using conversation id
router.get("/:ticketId", async (req, res) => {
  try {
    const messages = await Message.find({
      ticketId: req.params.ticketId,
    });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = router;
