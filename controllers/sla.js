const mongoose = require("mongoose");
const SLA = require("../models/sla"); // Import your SLA model
const Ticket = require("../models/ticket");

// creating new SLA

const createSLA = async (req, res) => {
  console.log("My SLA Data", req.body);
  try {
    const { name, description, responseTime, resolutionTime } = req.body;
    const sla = new SLA({
      name,
      description,
      responseTime: responseTime * 60 * 60 * 1000,
      resolutionTime: resolutionTime * 60 * 60 * 1000,
    });
    await sla.save();
    res.status(201).json(sla);
  } catch (error) {
    console.error("Error creating SLA:", error);
    res.status(500).json({ error: "Failed to create SLA" });
  }
};

// delete SLA
const deleteSLA = async (req, res) => {
  try {
    const slaId = req.params.id;

    // Check if the SLA is still associated with any ticket
    const ticketsWithSLA = await Ticket.find({ sla: slaId });

    if (ticketsWithSLA.length > 0) {
      // SLA is still in use by some tickets
      return res.status(400).json({
        error: `Cannot delete the SLA. It is still associated with ${ticketsWithSLA.length} tickets.`,
      });
    }

    // Find the SLA by ID and delete it
    const deletedSLA = await SLA.findByIdAndDelete(slaId);

    console.log("Deleted SLA", deleteSLA);

    if (!deletedSLA) {
      // SLA not found
      return res.status(404).json({ error: "SLA not found" });
    }

    // Successfully deleted
    res.status(200).json({ message: "SLA deleted successfully" });
  } catch (error) {
    console.error("Error deleting SLA:", error);
    res.status(500).json({ error: "Failed to delete SLA" });
  }
};

// Get All SLAs

const getAllSlas = async (req, res) => {
  try {
    // Find all SLAs in the database
    const slas = await SLA.find();

    // Send the SLAs to the frontend
    res.status(200).json(slas);
  } catch (error) {
    console.error("Error fetching SLAs:", error);
    res.status(500).json({ error: "Failed to fetch SLAs" });
  }
};

module.exports = {
  createSLA,
  deleteSLA,
  getAllSlas,
};
