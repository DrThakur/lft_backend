const Asset = require("../models/asset");
const csvParser = require("csv-parser");
const fs = require("fs");

// Get all assets
const getAllAssets = async (req, res) => {
  try {
    const assets = await Asset.find({});
    res.status(200).json(assets);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assets" });
  }
};

// Create a new asset
const createAsset = async (req, res) => {
  const body = req.body;
  try {
    // Validate required fields
    if (
      !body.assetType ||
      !body.financedBy ||
      !body.procuredUnder ||
      !body.location ||
      !body.system ||
      !body.assetCode ||
      !body.serviceTag ||
      !body.make ||
      !body.model ||
      !body.cpu ||
      !body.cpuGeneration ||
      !body.cpuVersion ||
      !body.cpuSpeed ||
      !body.ram ||
      !body.hardDisk ||
      !body.hardDiskType ||
      !body.issuedTo
    ) {
      return res.status(400).json({
        error:
          "assetType, financedBy, procuredUnder, and location are required fields",
      });
    }

    // Check issuedTo value and validate the corresponding fields
    switch (body.issuedTo) {
      case "Employee":
        if (!body.employeeCode || !body.employeeName) {
          return res.status(400).json({
            error: "employeeCode and employeeName are required for 'Employee'",
          });
        }
        break;
      case "Intern":
        if (!body.internCode || !body.internName) {
          return res.status(400).json({
            error: "internCode and internName are required for 'Intern'",
          });
        }
        break;
      case "Consultant":
        if (!body.consultantCode || !body.consultantName) {
          return res.status(400).json({
            error:
              "consultantCode and consultantName are required for 'Consultant'",
          });
        }
        break;
      case "Project":
        if (!body.projectName || !body.projectOwner) {
          return res.status(400).json({
            error: "projectName and projectOwner are required for 'Project'",
          });
        }
        break;
      case "Isolated":
        if (!body.isolatedTo || !body.isolatedOwner) {
          return res.status(400).json({
            error: "isolatedTo and isolatedOwner are required for 'Isolated'",
          });
        }
        break;
      case "Stock":
        // No additional fields are required for 'Stock'
        break;
      default:
        return res.status(400).json({
          error:
            "Invalid value for 'issuedTo'. Must be one of: Employee, Intern, Consultant, Project, Isolated, Stock",
        });
    }

    // create new asset
    const newAsset = await Asset.create(req.body);
    res.status(201).json(newAsset);
  } catch (error) {
    // Check for specific validation error
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res
        .status(400)
        .json({ error: "Validation failed", errors: validationErrors });
    }
    // Check for duplicate key error (unique fields)
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "Duplicate assetCode or serviceTag" });
    }
    res.status(500).json({ error: "Failed to create asset" });
  }
};

// Get asset by ID
const getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }
    res.status(200).json(asset);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch asset" });
  }
};

// Update asset by ID
const updateAssetById = async (req, res) => {
  try {
    const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }
    res.status(200).json(asset);
  } catch (error) {
    res.status(500).json({ error: "Failed to update asset" });
  }
};

// Delete asset by ID
const deleteAssetById = async (req, res) => {
  try {
    const asset = await Asset.findByIdAndDelete(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: "Asset not found" });
    }
    res.status(200).json({ message: "Asset deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete asset" });
  }
};

// Delete multiple assets by IDs
const deleteMultipleAssetsByIds = async (req, res) => {
  const { assetIds } = req.body;

  try {
    // Check if userIds array is provided
    console.log("Asset Ids", assetIds);
    if (!Array.isArray(assetIds)) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    // Delete the users
    const result = await Asset.deleteMany({ _id: { $in: assetIds } });

    // Check if any documents were deleted
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Assets not found" });
    }

    res
      .status(200)
      .json({ status: "Success", deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete assets" });
  }
};

// Function to conditionally set required fields based on 'issuedTo' value
function setRequiredFields(row) {
  if (row.issuedTo === "Employee") {
    row.employeeCode = row.employeeCode || "";
    row.employeeName = row.employeeName || "";
  } else if (row.issuedTo === "Intern") {
    row.internCode = row.internCode || "";
    row.internName = row.internName || "";
  } else if (row.issuedTo === "Consultant") {
    row.consultantCode = row.consultantCode || "";
    row.consultantName = row.consultantName || "";
  } else if (row.issuedTo === "Project") {
    row.projectName = row.projectName || "";
    row.projectOwner = row.projectOwner || "";
  } else if (row.issuedTo === "Isolated") {
    row.isolatedTo = row.isolatedTo || "";
    row.isolatedOwner = row.isolatedOwner || "";
  }

  return row;
}

// Function to validate and save the data to the database
async function saveDataToDatabase(data) {
  try {
    // Check if the document already exists based on the assetCode and serviceTag
    const existingAsset = await Asset.findOne({
      assetCode: data.assetCode,
      serviceTag: data.serviceTag,
    });

    if (existingAsset) {
      // If the document already exists, do not save it again.
      console.log(
        `Asset with assetCode: ${data.assetCode} and serviceTag: ${data.serviceTag} already exists. Skipping...`
      );
    } else {
      // If the document does not exist, create a new document
      const asset = new Asset(data);
      await asset.validate();
      await asset.save();
      console.log("Data saved successfully!");
    }
  } catch (error) {
    console.error("Error saving data:", error.message);
  }
}

const handleCSVdataToDatabase = async (req, res) => {
  try {
    // const jsonArray = await csv().fromFile(req.file.path);
    const jsonArray = [];
    // Map the CSV column headers to the Mongoose field names
    const fieldMappings = {
      "Asset Type": "assetType",
      "Financed By": "financedBy",
      "Procured Under": "procuredUnder",
      Location: "location",
      System: "system",
      "Asset Code": "assetCode",
      "Service Tag No.": "serviceTag",
      Make: "make",
      Model: "model",
      CPU: "cpu",
      "CPU Generation": "cpuGeneration",
      "CPU Version": "cpuVersion",
      "CPU Speed": "cpuSpeed",
      RAM: "ram",
      "Hard Disk": "hardDisk",
      "Hard Disk Type": "hardDiskType",
      "Issued To": "issuedTo",
      "Employee Code": "employeeCode",
      "Employee Name": "employeeName",
      "Intern Code": "internCode",
      "Intern Name": "internName",
      "Consultant Code": "consultantCode",
      "Consultant Name": "consultantName",
      "Project Name": "projectName",
      "Project Owner": "projectOwner",
      "Isolated To": "isolatedTo",
      "Isolated Owner": "isolatedOwner",
    };

    fs.createReadStream(req.file.path)
      .pipe(csvParser())
      .on("data", (row) => {
        const mappedRow = {};
        for (const key in row) {
          if (fieldMappings[key]) {
            mappedRow[fieldMappings[key]] = row[key];
          }
        }
        jsonArray.push(mappedRow);
      })
      .on("end", async () => {
        for (const entry of jsonArray) {
          const processedRow = setRequiredFields(entry);
          await saveDataToDatabase(processedRow);
        }
      });
    return res.json({ msg: "Added successfully to MongoDb" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to add data to MongoDb" });
  }
};

module.exports = {
  getAllAssets,
  createAsset,
  getAssetById,
  updateAssetById,
  deleteAssetById,
  deleteMultipleAssetsByIds,
  handleCSVdataToDatabase,
};
