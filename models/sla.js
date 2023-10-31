const mongoose = require("mongoose");

const slaSchema = new mongoose.Schema({
  name: {
    type: String, // Name of the SLA (e.g., "Gold", "Silver", "Bronze")
    default: "Default SLA",
    required: true,
  },

  description: {
    type: String,
  },
  responseTime: {
    type: Number,  // Response time in milliseconds
    required: true,
  },
  resolutionTime: {
    type: Number,  // Resolution time in  milliseconds
    required: true,
  },
});

const SLA = mongoose.model("SLA", slaSchema);

module.exports = SLA;
