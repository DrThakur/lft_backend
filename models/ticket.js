const mongoose = require("mongoose");

// Schema
const ticketSchema = new mongoose.Schema(
  {
    serialNumber: {
      type: Number,
    },
    ticketId: {
      type: String,
    },
    location: {
      type: String,
      required: true,
      enum: ["Gurgaon", "Bangalore", "Hyderabad", "Other"],
    },
    requestType: {
      type: String,
      required: true,
      enum: ["Request Something", "Report Something"],
    },
    assetRequiredFor: {
      type: String,
      required: function () {
        return this.requestType === "Request Something";
      },
      enum: ["Self", "Project"],
    },
    requestFor: {
      type: String,
      required: function () {
        return (
          this.requestType === "Request Something" &&
          (this.assetRequiredFor === "Self" ||
            this.assetRequiredFor === "Project")
        );
      },
      enum: [
        "Laptop",
        "Desktop",
        "Accessories",
        "Consumables",
        "Licence",
        "Others",
      ],
    },
    quantity: {
      type: Number,
    },
    requirementDetails: {
      type: String,
      required: function () {
        return (
          this.requestType === "Request Something" &&
          (this.assetRequiredFor === "Self" ||
            this.assetRequiredFor === "Project") &&
          (this.requestFor === "Laptop" ||
            this.requestFor === "Dekstop" ||
            this.requestFor === "Accessories" ||
            this.requestFor === "Consumables" ||
            this.requestFor === "Licence" ||
            this.requestFor === "Other")
        );
      },
    },
    reportingManager: {
      type: String,
      required: function () {
        return this.assetRequiredFor === "Self";
      },
    },
    projectName: {
      type: String,
      required: function () {
        return this.assetRequiredFor === "Project";
      },
    },
    projectDuration: {
      type: String,
      required: function () {
        return this.assetRequiredFor === "Project";
      },
    },
    approvedByManager: {
      type: String,
      default: "Awaited",
      enum: ["Yes", "No", "Awaited"],
    },
    approvedBy: {
      type: String,
    },
    approvedOn: {
      type: Date, // Store the approval date and time as a Date object
    },
    projectManagerName: {
      type: String,
      required: function () {
        return (
          this.requestType === "Request Something" &&
          this.assetRequiredFor === "Project" &&
          (this.requestFor === "Laptop" ||
            this.requestFor === "Dekstop" ||
            this.requestFor === "Accessories" ||
            this.requestFor === "Consumables" ||
            this.requestFor === "Licence" ||
            this.requestFor === "Other") &&
          this.requirementDetails &&
          this.requirementDetails.trim() !== "" &&
          this.projectName &&
          this.projectDuration
        );
      },
    },
    issueType: {
      type: String,
      required: function () {
        return this.requestType === "Report Something";
      },
      enum: ["Software Related", "Network Related", "LFT Resource Related"],
    },
    issueDescription: {
      type: String,
      required: function () {
        return (
          this.requestType === "Report Something" &&
          (this.issueType === "Software Related" ||
            this.issueType === "Network Related" ||
            this.issueType === "LFT Resource Related")
        );
      },
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      required: true,
    },
    status: {
      type: String,
      enum: ["New", "Open", "Pending", "Resolved", "Closed"],
      default: "New",
    },
    createdBy: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Reference the User collection
        required: true,
      },
      fullName: { type: String, required: true },
      employeeCode: { type: String, required: true },
      email: { type: String, required: true },
      profileImageURL: { type: String, default: "/images/profile_image.jpg" },
    },
    assignedTo: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Reference the User collection
        default: null, // Initialize as empty if not assigned yet
      },
      fullName: { type: String },
      employeeCode: { type: String },
      email: { type: String },
      profileImageURL: { type: String },
    },
    members: {
      type: [String],
    },
    sla: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SLA", // Reference to the SLA model
    },
    responseTime: {
      type: Date,
    },

    resolutionDueDate: {
      type: Date,
    },
    closedDate: {
      type: Date,
    },
    closedBy: {
      type: String,
    },

    statusHistory: [
      {
        status: {
          type: String,
          enum: ["New", "Open", "Pending", "Resolved", "Closed"],
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Model
const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;
