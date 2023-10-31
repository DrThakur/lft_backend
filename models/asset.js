const mongoose = require("mongoose");

// Schema
const assetSchema = new mongoose.Schema(
  {
    assetType: {
      type: String,
      required: true,
    },
    financedBy: {
      type: String,
      required: true,
    },
    procuredUnder: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    system: {
      type: String,
      required: true,
    },
    assetCode: {
      type: String,
      required: true,
      unique: true,
    },
    serviceTag: {
      type: String,
      required: true,
      unique: true,
    },
    make: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    cpu: {
      type: String,
      required: true,
    },
    cpuGeneration: {
      type: String,
      required: true,
    },
    cpuVersion: {
      type: String,
      required: true,
    },
    cpuSpeed: {
      type: String,
      required: true,
    },
    ram: {
      type: String,
      required: true,
    },
    hardDisk: {
      type: String,
      required: true,
    },
    hardDiskType: {
      type: String,
      required: true,
    },
    issuedTo: {
      type: String,
      required: true,
      enum: [
        "Employee",
        "Intern",
        "Consultant",
        "Project",
        "Isolated",
        "Stock",
      ],
    },
    employeeCode: {
      type: String,
      required: function () {
        return this.issuedTo === "Employee";
      },
    },
    employeeName: {
      type: String,
      required: function () {
        return this.issuedTo === "Employee";
      },
    },
    internCode: {
      type: String,
      required: function () {
        return this.issuedTo === "Intern";
      },
    },
    internName: {
      type: String,
      required: function () {
        return this.issuedTo === "Intern";
      },
    },
    consultantCode: {
      type: String,
      required: function () {
        return this.issuedTo === "Consultant";
      },
    },
    consultantName: {
      type: String,
      required: function () {
        return this.issuedTo === "Consultant";
      },
    },
    projectName: {
      type: String,
      required: function () {
        return this.issuedTo === "Project";
      },
    },
    projectOwner: {
      type: String,
      required: function () {
        return this.issuedTo === "Project";
      },
    },
    isolatedTo: {
      type: String,
      required: function () {
        return this.issuedTo === "Isolated";
      },
    },
    isolatedOwner: {
      type: String,
      required: function () {
        return this.issuedTo === "Isolated";
      },
    },
  },
  { timestamps: true }
);

// Model
const Asset = mongoose.model("asset", assetSchema);

module.exports = Asset;
