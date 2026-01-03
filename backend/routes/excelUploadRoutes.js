const express = require("express");
const multer = require("multer");

// Program Tracker Excel controller (EXISTING)
const {
  replaceFromExcel,
} = require("../controllers/excelUploadController");

// Infra Setup Tracker Excel controller (NEW, ISOLATED)
const {
  replaceInfraFromExcel,
} = require("../controllers/infraExcelController");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * ============================
 * PROGRAM TRACKER EXCEL REPLACE
 * ============================
 * Endpoint:
 * POST /excel/replace
 * Writes to: Task table
 */
router.post("/replace", upload.single("file"), replaceFromExcel);

/**
 * ============================
 * INFRA SETUP EXCEL REPLACE
 * ============================
 * Endpoint:
 * POST /excel/infra-replace
 * Writes to: InfraTask table
 */
router.post(
  "/infra-replace",
  upload.single("file"),
  replaceInfraFromExcel
);

module.exports = router;
