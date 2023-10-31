const express = require("express");
const router = express.Router();
const { createSLA, deleteSLA, getAllSlas } = require("../controllers/sla");

router.post("/", createSLA);

router.delete("/:id", deleteSLA);

router.get("/", getAllSlas);

module.exports = router;
