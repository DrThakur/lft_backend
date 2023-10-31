const express = require("express");
const router = express.Router();
const {
  getAllTickets,
  createTicket,
  getTicketById,
  updateTicketById,
  deleteTicketById,
  deleteMultipleTicketsByIds,
  getTicketByMemeberId,
  getTicketsByUserId,
  deleteMemberFromTicket,
  addNewMembersToTicketConversation,
  assignedToTickets,
  getTicketsCreatedBy,
} = require("../controllers/ticket");

router
  .route("/")
  .get(getAllTickets)
  .post(createTicket)
  .delete(deleteMultipleTicketsByIds);

router
  .route("/:id")
  .get(getTicketById)
  .patch(updateTicketById)
  .delete(deleteTicketById);

router.get("/members/:memberId", getTicketByMemeberId);
// Delete a member from the members array of a ticket
router.delete("/:ticketId/members/:memberId", deleteMemberFromTicket);

// Add members to a conversation
router.patch("/:ticketId/addMembers", addNewMembersToTicketConversation);

// assigne to ticket
router.get("/assigned/:userId", assignedToTickets);

// members tickets
router.get("/createdBy/:userId", getTicketsCreatedBy);

module.exports = router;
