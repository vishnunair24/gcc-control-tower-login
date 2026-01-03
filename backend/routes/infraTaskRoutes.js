const express = require("express");
const router = express.Router();

const {
  getInfraTasks,
  updateInfraTask,
} = require("../controllers/infraTaskController");

// =======================
// Infra Setup Tracker Routes
// =======================

// Get all infra tasks
router.get("/", getInfraTasks);

// Update infra task (inline edit save)
router.put("/:id", updateInfraTask);

module.exports = router;
