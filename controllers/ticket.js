const Ticket = require("../models/ticket");
const transporter = require("../services/nodemailerConfig");
const User = require("../models/user");
const SLA = require("../models/sla");
const { assign } = require("nodemailer/lib/shared");

// Get all tickets
const getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({});
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
};

// Ticket Counter Definition
let ticketCounter;

// Inside an asynchronous function, you can use await
async function initializeTicketCounter() {
  try {
    const count = await Ticket.countDocuments({});
    ticketCounter = count;
    console.log("Ticket count:", ticketCounter);
    return count;
  } catch (error) {
    console.error("Error fetching ticket count:", error);
  }
}

// Call the function to initialize the ticketCounter
initializeTicketCounter();

// Create a new ticket

const createTicket = async (req, res) => {
  const { userId, ...body } = req.body;
  console.log("User", userId);
  console.log("My latest Form Data", req.body);

  try {
    // Validate if requestType is provided
    const defaultSLAId = "652cfb678281d7ce37e35dc8";

    if (!body.requestType) {
      return res
        .status(400)
        .json({ status: "error", message: "requestType is required" });
    }
    if (body.requestType === "Report Something") {
      // Validate the required fields for "Report an Issue" ticket type
      if (!body.issueType || !body.issueDescription) {
        return res.status(400).json({
          status: "error",
          message:
            "issueType and issueDescription are required for 'Report an Issue' ticket",
        });
      }
    } else if (body.requestType === "Request Something") {
      // validation for "Request Something" ticket type:
      console.log("Requirement Details", body.requirementDetails);
      console.log("Reporting Manager", body.reportingManager);
      console.log("Asset required For", body.assetRequiredFor);

      if (body.assetRequiredFor === "Self") {
        if (
          !body.requestFor ||
          !body.requirementDetails ||
          !body.reportingManager
        ) {
          return res.status(400).json({
            status: "error",
            message:
              "requestFor, requirementDetails or reportingManager data is not available ",
          });
        }
      } else if (body.assetRequiredFor === "Project") {
        if (
          !body.requestFor ||
          !body.requirementDetails ||
          !body.projectName ||
          !body.projectDuration ||
          !body.projectManagerName
        ) {
          return res.status(400).json({
            status: "error",
            message: "All project details field are mandatory",
          });
        }
      }
    } else {
      // Handle the case when an invalid requestType is provided
      return res
        .status(400)
        .json({ status: "error", message: "Invalid requestType" });
    }

    // Generate the ticket ID
    console.log(ticketCounter);
    const ticketId = `LFT-${ticketCounter + 1}`;
    const serialNumber = ticketCounter + 1;
    ticketCounter++;

    console.log(req.user);

    //fetching specific user
    const user = await User.findById(userId); // Fetch user based on userId
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Extract the reporting manager's full name from the current user's data
    const reportingManagerFullName = user.reportingManager;

    // Fetch the reporting manager's user data based on the full name
    const reportingManagerInfo = await User.findOne({
      fullName: reportingManagerFullName,
    });

    if (!reportingManagerInfo) {
      // Handle the case when reporting manager is not found
      return res.status(404).json({ error: "Reporting manager not found" });
    }

    // Now you can use the properties of reportingManagerInfo as needed
    const reportingManagerEmail = reportingManagerInfo.email;

    console.log("My reporting manager name", reportingManagerFullName);
    console.log("My reporting manager email", reportingManagerEmail);

    // Initialize statusHistory with the initial status "New"
    const statusHistory = [
      {
        status: "New",
        timestamp: new Date(),
      },
    ];

    // create new ticket
    const newTicket = new Ticket({
      ticketId,
      serialNumber,
      createdBy: {
        _id: userId,
        fullName: user.fullName,
        email: user.email,
        employeeCode: user.employeeCode,
        profileImageURL: user.profileImageURL,
      },
      sla: defaultSLAId,
      statusHistory,
      ...req.body,
    });

    // Add the user who created the ticket to the members array
    newTicket.members.push(newTicket.createdBy._id.toString());

    await newTicket.save();
    console.log("New Ticket Created", serialNumber);

    // Send an email Notification
    const mailOptions = {
      from: '"Ankit Kumar Thakur 👻" <akankit114@gmail.com>', // Sender's email address
      to: [user.email, reportingManagerEmail], // Receiver's email address
      subject: "New Ticket Created",
      html: `
        <p>Hello,${user.fullName}</p>
        <p>A new ticket with ID ${newTicket.ticketId} has been created.</p>
        <p>Visit the app to view the ticket details.</p>
      `,
      envelope: {
        from: '"Ankit Kumar Thakur 👻" <akankit114@gmail.com>',
        to: [user.email, reportingManagerEmail],
      },
    };

    //Transporter Object
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    // status code/response
    res.status(201).json({
      msg: "success",
      id: newTicket.ticketId,
      _id: newTicket._id,
      requestType: newTicket.requestType,
      assetRequiredFor: newTicket.assetRequiredFor,
      requestFor: newTicket.requestFor,
    });

    calculateResponseDueDateAndUpdateTicket(newTicket._id);
  } catch (error) {
    console.error("Error creating ticket:", error);
    if (error.name === "ValidationError") {
      // Validation error occurred due to schema validation
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: validationErrors,
      });
    }
    // Other error occured
    res.status(500).json({ error: "Failed to create ticket- Server Error" });
  }
};

// Get ticket by ID
const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch ticket" });
  }
};

// Update ticket by ID
const updateTicketById = async (req, res) => {
  console.log("My reqhhhhhbody", req.body);

  try {
    const { assignedTo, status, approvedByManager, user, ...otherUpdates } =
      req.body;

    console.log("My Status changing user", user);
    console.log("My assigned to OBJHS", assignedTo);
    console.log("mY satus", status);
    console.log("approvedBy Manager", approvedByManager);
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, otherUpdates, {
      new: true,
      runValidators: true,
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Check if the ticket is being assigned to a new owner
    if (assignedTo && assignedTo._id) {
      // Update the ticket ownership data
      ticket.assignedTo = assignedTo;

      // Add the assignedTo member ID to the members array if not already present
      if (!ticket.members.includes(assignedTo._id)) {
        ticket.members.push(assignedTo._id);
      }
      // Add the status change to statusHistory
      ticket.statusHistory.push({
        status: "Open",
        timestamp: new Date(),
      });

      const assignedEmail = assignedTo?.email;
      const mailOptions = {
        from: '"Ankit Kumar Thakur 👻" <akankit114@gmail.com>', // Sender's email address
        to: [ticket.createdBy?.email, assignedEmail], // Receiver's email address
        subject: "Ticket Assigned",
        html: `
          <p>Hello,${ticket.createdBy?.fullName}</p>
          <p>The Ticket ${ticket.ticketId} has been assigned to ${assignedTo.fullName}.</p>
          <p>Visit the app to view the ticket details.</p>
        `,
        envelope: {
          from: '"Ankit Kumar Thakur 👻" <akankit114@gmail.com>',
          to: [ticket.createdBy?.email, assignedEmail],
        },
      };

      //Transporter Object
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error);
        } else {
          console.log("Email sent:", info.response);
        }
      });
    }

    // Update the ticket status if provided in the request body
    console.log("Status before update: ", ticket.status);
    if (status) {
      ticket.status = status;
      ticket.statusHistory.push({
        status: status,
        timestamp: new Date(),
      });
      if (status === "Closed") {
        ticket.closedDate = new Date();
        ticket.closedBy = user.fullName;

        const mailOptions = {
          from: '"Ankit Kumar Thakur 👻" <akankit114@gmail.com>', // Sender's email address
          to: [ticket.createdBy?.email, user.email], // Receiver's email address
          subject: "Ticket Closed",
          html: `
            <p>Hello,${ticket.createdBy?.fullName}</p>
            <p>The Ticket ${ticket.ticketId} has been closed By ${user.fullName}.</p>
            <p>Visit the app to view the ticket details.</p>
          `,
          envelope: {
            from: '"Ankit Kumar Thakur 👻" <akankit114@gmail.com>',
            to: [ticket.createdBy?.email, user.email],
          },
        };

        //Transporter Object
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Error sending email:", error);
          } else {
            console.log("Email sent:", info.response);
          }
        });
      }
      console.log("Status after update: ", ticket.status);
    }

    // Update the approvedByManager if provided in the request body
    if (approvedByManager) {
      ticket.approvedByManager = approvedByManager;
      ticket.approvedOn = new Date();
    }

    // Check if CC recipients are provided
    if (req.body.ccRecipients && req.body.ccRecipients.length > 0) {
      // Extract member IDs from CC recipients
      const memberIds = req.body.ccRecipients.map((recipient) => recipient._id);

      // Add new members to the ticket's conversation
      ticket.members = [...new Set([...ticket.members, ...memberIds])];
    }
    console.log("My Before Updated Ticket", ticket);

    await ticket.save();
    console.log("My After Updated Ticket", ticket);

    res.status(200).json({ status: "Success", id: req.params.id });
    calculateResponseDueDateAndUpdateTicketAfterManagerApproval(req.params.id);
  } catch (error) {
    console.log("Error during ticket save:", error);
    res.status(500).json({ error: "Failed to update ticket" });
  }
};

// Delete ticket by ID
const deleteTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    console.log("Ticket Deleted Successfully", req.params.id);
    res
      .status(200)
      .json({ message: "Ticket deleted successfully", id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete ticket" });
  }
};

// Delete multiple tickets by IDs
const deleteMultipleTicketsByIds = async (req, res) => {
  const { ticketIds } = req.body;

  try {
    // Check if ticketIds array is provided
    console.log("Ticket Ids", ticketIds);
    if (!Array.isArray(ticketIds)) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    // Delete the tickets
    const result = await Ticket.deleteMany({ _id: { $in: ticketIds } });

    // Check if any documents were deleted
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Tickets not found" });
    }

    res
      .status(200)
      .json({ status: "Success", deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete tickets" });
  }
};

// Get Ticket By User Id
const getTicketsByUserId = async (req, res) => {
  console.log(req.query);
  const userId = req.query.userId; // Get user ID from query parameter
  console.log(userId);
  try {
    // Fetch user based on userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User Not found" });
    }

    // Fetch tickets associated with the user
    const createdByTickets = await Ticket.find({
      "createdBy._id": user._id,
    });
    // Find tickets where the user is a member
    const memberTickets = await Ticket.find({ members: userId });

    // Find tickets where the user is the reportingManager
    const reportingManagerTickets = await Ticket.find({
      reportingManager: user.fullName,
    });

    // Find tickets where the user is the projectManagerName
    const projectManagerTickets = await Ticket.find({
      projectManagerName: user.fullName,
    });

    // Merge the two arrays into a single array
    const allTickets = [
      ...createdByTickets,
      ...memberTickets,
      ...reportingManagerTickets,
      ...projectManagerTickets,
    ];

    console.log("My All tickets", allTickets);

    // Create an empty array to store unique tickets based on their _id
    const uniqueTickets = [];

    // Iterate through allTickets
    allTickets.forEach((ticket) => {
      // Check if the ticket's _id is not in uniqueTickets
      if (
        !uniqueTickets.some(
          (uniqueTicket) =>
            uniqueTicket._id.toString() === ticket._id.toString()
        )
      ) {
        // Add the ticket to uniqueTickets
        uniqueTickets.push(ticket);
      }
    });

    console.log("My Unique ticktes", uniqueTickets);

    if (!uniqueTickets.length) {
      return res
        .status(404)
        .json({ message: "No tickets found for this user." });
    }

    res.status(200).json(uniqueTickets);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
};

const getTicketByMemeberId = async (req, res) => {
  try {
    const memberId = req.params.memberId;
    const tickets = await Ticket.find({ members: memberId });
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ error: "Error fetching tickets by member ID" });
  }
};

const deleteMemberFromTicket = async (req, res) => {
  console.log("Myt ticket id", req.params.ticketId);
  console.log("Myt memeberid", req.params.memberId);
  try {
    const ticketId = req.params.ticketId;
    const memberId = req.params.memberId;
    console.log("My ticket jd", ticketId);
    console.log("My memeber Id jd", memberId);

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const memberIndex = ticket.members.indexOf(memberId);
    if (memberIndex !== -1) {
      ticket.members.splice(memberIndex, 1);
      await ticket.save();
      res.status(200).json({ message: "Member removed successfully" });
    } else {
      res
        .status(404)
        .json({ error: "Member not found in the ticket's members array" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error removing member from the ticket's members array" });
  }
};

// Add array of members by ticket id and member id
const addNewMembersToTicketConversation = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Assuming an array of member IDs is provided in the request body as 'memberIds'
    const memberIds = req.body.memberIds;

    // Loop through the provided member IDs and add them if they're not already part of the conversation
    const membersAdded = [];
    for (const memberId of memberIds) {
      if (!ticket.members.includes(memberId)) {
        ticket.members.push(memberId);
        membersAdded.push(memberId);
      }
    }

    if (membersAdded.length > 0) {
      await conversation.save();
    }

    res
      .status(200)
      .json({ message: "Members added successfully", membersAdded });
  } catch (error) {
    res.status(500).json({ error: "Error adding members to conversation" });
  }
};

// Function to add members (user IDs) to a ticket
async function addMembersToTicket(ticketId, memberUserIds) {
  try {
    // Find the ticket by its ID
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // Filter out memberUserIds that already exist in the ticket's members array
    const newMembers = memberUserIds.filter(
      (userId) => !ticket.members.includes(userId)
    );

    // Add member user IDs to the ticket's members array
    ticket.members = [...ticket.members, ...newMembers];

    // Save the updated ticket back to the database
    const updatedTicket = await ticket.save();

    return updatedTicket;
  } catch (error) {
    console.error("Error adding members to the ticket:", error);
    throw error;
  }
}

// Removing memeber from ticket

const removeMemberFromTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { email } = req.body;

    // Find the ticket by ID and update the members array to remove the email.
    const updatedTicket = await Ticket.findByIdAndUpdate(
      ticketId,
      { $pull: { members: email } },
      { new: true }
    );

    res.json(updatedTicket);
  } catch (error) {
    console.error("Error removing member from ticket:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const assignedToTickets = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find tickets where assignedTo._id matches the provided userId
    const tickets = await Ticket.find({ "assignedTo._id": userId });

    if (!tickets) {
      return res
        .status(404)
        .json({ message: "No tickets found for this user." });
    }

    res.status(200).json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getTicketsCreatedBy = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find tickets where the provided userId is in the members array
    const tickets = await Ticket.find({ "createdBy._id": userId });

    if (!tickets) {
      return res
        .status(404)
        .json({ message: "No tickets found for this user." });
    }

    res.status(200).json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update ticket with resolution Due date
async function calculateResponseDueDateAndUpdateTicket(ticketId) {
  try {
    // Find the new ticket by its ID
    const newTicket = await Ticket.findById(ticketId);

    if (!newTicket) {
      throw new Error("Ticket not found");
    }

    // Check if requestType is "Request Something"
    if (newTicket.requestType === "Request Something") {
      console.log("Not a 'Request Something' ticket. Skipping calculation.");
      return; // Exit the function
    }

    // Retrieve the SLA document based on the SLA ID in the ticket
    const sla = await SLA.findById(newTicket.sla);

    if (!sla) {
      throw new Error("SLA not found");
    }

    // Calculate the responseDueDate by adding SLA's response time to createdAt
    const resolutionDueDate = new Date(
      newTicket.createdAt.getTime() + sla.resolutionTime
    );

    // Update the responseDueDate field in the ticket
    newTicket.resolutionDueDate = resolutionDueDate;

    // Save the updated ticket to the database
    const updatedTicket = await newTicket.save();

    console.log("Updated Ticket with Response Due Date:", updatedTicket);
  } catch (error) {
    console.error("Error updating ticket:", error);
  }
}

// Update ticket with resolution Due date based on Manager Approved On
async function calculateResponseDueDateAndUpdateTicketAfterManagerApproval(
  ticketId
) {
  try {
    // Find the new ticket by its ID
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // Check if requestType is "Request Something"
    if (!ticket.approvedOn) {
      console.log(
        "Ticket Is stiil not approved By manager' ticket. Skipping calculation."
      );
      return; // Exit the function
    }

    // Retrieve the SLA document based on the SLA ID in the ticket
    const sla = await SLA.findById(ticket.sla);

    if (!sla) {
      throw new Error("SLA not found");
    }

    // Calculate the responseDueDate by adding SLA's response time to createdAt
    const resolutionDueDate = new Date(
      ticket.approvedOn.getTime() + sla.resolutionTime
    );

    // Update the responseDueDate field in the ticket
    ticket.resolutionDueDate = resolutionDueDate;

    // Save the updated ticket to the database
    const updatedTicket = await ticket.save();

    console.log("Updated Ticket with Response Due Date:", updatedTicket);
  } catch (error) {
    console.error("Error updating ticket:", error);
  }
}

module.exports = {
  getAllTickets,
  createTicket,
  getTicketById,
  updateTicketById,
  deleteTicketById,
  deleteMultipleTicketsByIds,
  getTicketsByUserId,
  getTicketByMemeberId,
  deleteMemberFromTicket,
  addNewMembersToTicketConversation,
  addMembersToTicket,
  removeMemberFromTicket,
  assignedToTickets,
  getTicketsCreatedBy,
};

// req.body, {
//   new: true,
//   runValidators: true,
// }

// {
//   requestType: req.body.requestType,
//   assetRequiredFor: req.body.assetRequiredFor,
//   requestFor: req.body.requestFor,
//   requirementDetails: req.body.requirementDetails,
//   approvedByManager: req.body.approvedByManager,
//   managerName: req.body.managerName,
//   issueType: req.body.issueType,
//   issueDescription: req.body.issueDescription,
// }
