const express = require("express");
const router = express.Router();
const {
  getAllAssets,
  getAssetById,
  createAsset,
  updateAssetById,
  deleteAssetById,
  deleteMultipleAssetsByIds,
} = require("../controllers/asset");

router
  .route("/")
  .get(getAllAssets)
  .post(createAsset)
  .delete(deleteMultipleAssetsByIds);

router.route("/:id").get(getAssetById).patch(updateAssetById);

module.exports = router;
