const express = require("express");
const router = express.Router();
const Conversation = require("../models/conversation");

// Creating New Conversation

router.post("/", async (req, res) => {
  const newConversation = new Conversation({
    ticketId: req.body.ticketId,
    members: [req.body.senderId, req.body.receiverId],
  });

  try {
    const savedConversation = await newConversation.save();
    res.status(200).json(savedConversation);
  } catch (error) {
    res.status(500).json(error);
  }
});

// get conversation of a  ticket

router.get("/:ticketId", async (req, res) => {
  try {
    const conversation = await Conversation.find({
      ticketId: req.params.ticketId,
    });

    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ error: "Error fetching conversation" });
  }
});

// Add a member to a conversation
router.post("/:conversationId/addMember", async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Assuming the member ID is provided in the request body
    const memberId = req.body.memberId;

    // Check if the member is already part of the conversation
    if (!conversation.members.includes(memberId)) {
      conversation.members.push(memberId);
      await conversation.save();
    }

    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ error: "Error adding member to conversation" });
  }
});

module.exports = router;
