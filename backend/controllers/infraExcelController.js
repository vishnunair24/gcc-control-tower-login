const XLSX = require("xlsx");
const { PrismaClient } = require("@prisma/client");
const { normalizeCustomerName } = require("../utils/customerName");

const prisma = new PrismaClient();

/**
 * Normalize Excel headers
 */
function normalizeHeader(h) {
  return String(h)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Convert Excel date safely
 */
function parseDate(value, fallback) {
  if (typeof value === "number") {
    const utcDays = Math.floor(value - 25569);
    return new Date(utcDays * 86400 * 1000);
  }

  if (typeof value === "string" && value.trim() !== "") {
    const d = new Date(value);
    if (!isNaN(d)) return d;
  }

  return fallback;
}

/**
 * ============================
 * REPLACE INFRA TASKS FROM EXCEL
 * ============================
 * Endpoint: POST /excel/infra-replace
 * Table: InfraTask
 */
exports.replaceInfraFromExcel = async (req, res) => {
  console.log("🔥 INFRA EXCEL REPLACE STARTED");

  try {
    // Optional customer passed via query/body (e.g., from UI context)
    let batchCustomerName = (req.query.customerName || req.body?.customerName || "").toString().trim();
    batchCustomerName = normalizeCustomerName(batchCustomerName || null);
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
    });

    if (rows.length < 2) {
      return res.status(400).json({ error: "Excel has no data rows" });
    }

    // Normalize headers
    const headerRow = rows[0].map(normalizeHeader);

    const colIndex = (name) =>
      headerRow.findIndex((h) => h.includes(name));

    const idx = {
      infraPhase: colIndex("infra"),
      taskName: colIndex("task"),
      status: colIndex("status"),
      percentComplete: colIndex("complete"),
      startDate: colIndex("start"),
      endDate: colIndex("end"),
      owner: colIndex("owner"),
      customer: colIndex("customer"),
    };

    const today = new Date();
    const tasks = [];
    const customerNamesInSheet = new Set();

    rows.slice(1).forEach((row) => {
      if (row.every((c) => String(c).trim() === "")) return;

      const startDate = parseDate(row[idx.startDate], today);
      const endDate = parseDate(row[idx.endDate], startDate);

      // Capture customer from sheet if a Customer column exists
      if (idx.customer !== -1) {
        const sheetCustomer = String(row[idx.customer] || "").trim();
        if (sheetCustomer) customerNamesInSheet.add(sheetCustomer);
      }

      tasks.push({
        infraPhase:
          row[idx.infraPhase]?.toString().trim() || "General",
        taskName:
          row[idx.taskName]?.toString().trim() || "TBD",
        status:
          row[idx.status]?.toString().trim() || "Planned",
        percentComplete:
          Number(row[idx.percentComplete]) || 0,
        startDate,
        endDate,
        owner:
          row[idx.owner]?.toString().trim() || "",
      });
    });

    if (!tasks.length) {
      return res.status(400).json({
        error: "No valid Infra rows found in Excel",
      });
    }

    // Decide which customer this file belongs to:
    // 1) Prefer explicit query/body customerName if provided.
    // 2) Otherwise, infer from a single distinct Customer value in the sheet.
    if (!batchCustomerName) {
      const names = Array.from(customerNamesInSheet).filter(Boolean);
      if (names.length === 1) {
        batchCustomerName = normalizeCustomerName(names[0]);
      } else if (names.length > 1) {
        return res.status(400).json({
          error:
            "Excel contains multiple Customer values. Please upload one customer at a time or specify ?customerName=...",
        });
      }
    }

    const finalCustomerName = normalizeCustomerName(batchCustomerName || null);

    const tasksWithCustomer = tasks.map((t) => ({
      ...t,
      customerName: finalCustomerName,
    }));

    const result = await prisma.$transaction(async (tx) => {
      const where = finalCustomerName ? { customerName: finalCustomerName } : {};
      const deleted = await tx.infraTask.deleteMany({ where });
      const inserted = await tx.infraTask.createMany({
        data: tasksWithCustomer,
      });

      return {
        deleted: deleted.count,
        inserted: inserted.count,
      };
    });

    res.json({
      message: "Infra Excel replaced successfully",
      ...result,
      rowsRead: rows.length - 1,
    });
  } catch (err) {
    console.error("❌ INFRA EXCEL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
