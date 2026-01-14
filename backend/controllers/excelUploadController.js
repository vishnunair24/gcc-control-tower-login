const XLSX = require("xlsx");
const prisma = require("../prisma/client");

/**
 * Normalize header names
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

/* =========================================================
   EXISTING PROGRAM TRACKER EXCEL REPLACE (UNCHANGED)
   ========================================================= */
exports.replaceFromExcel = async (req, res) => {
  try {
    // Optional customer passed via query/body (e.g., from UI context)
    let batchCustomerName = (req.query.customerName || req.body?.customerName || "").toString().trim();

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

    const headerRow = rows[0].map(normalizeHeader);
    const colIndex = (name) =>
      headerRow.findIndex((h) => h.includes(name));

    const idx = {
      workstream: colIndex("workstream"),
      deliverable: colIndex("deliverable"),
      status: colIndex("status"),
      duration: colIndex("duration"),
      startDate: colIndex("start"),
      endDate: colIndex("end"),
      progress: colIndex("progress"),
      phase: colIndex("phase"),
      milestone: colIndex("milestone"),
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
        workstream: row[idx.workstream] || "General",
        deliverable: row[idx.deliverable] || "TBD",
        status: row[idx.status] || "WIP",
        duration: Number(row[idx.duration]) || 0,
        startDate,
        endDate,
        progress: Number(row[idx.progress]) || 0,
        phase: row[idx.phase] || "",
        milestone: row[idx.milestone] || "",
        owner: row[idx.owner] || "",
      });
    });

    // Decide which customer this file belongs to:
    // 1) Prefer explicit query/body customerName if provided.
    // 2) Otherwise, infer from a single distinct Customer value in the sheet.
    if (!batchCustomerName) {
      const names = Array.from(customerNamesInSheet).filter(Boolean);
      if (names.length === 1) {
        batchCustomerName = names[0];
      } else if (names.length > 1) {
        return res.status(400).json({
          error:
            "Excel contains multiple Customer values. Please upload one customer at a time or specify ?customerName=...",
        });
      }
    }

    const finalCustomerName = batchCustomerName || null;

    const tasksWithCustomer = tasks.map((t) => ({
      ...t,
      customerName: finalCustomerName,
    }));

    const result = await prisma.$transaction(async (tx) => {
      const where = finalCustomerName ? { customerName: finalCustomerName } : {};
      const deleted = await tx.task.deleteMany({ where });
      const inserted = await tx.task.createMany({ data: tasksWithCustomer });

      return {
        deleted: deleted.count,
        inserted: inserted.count,
      };
    });

    res.json({ message: "Program tracker replaced", ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =========================================================
   NEW: INFRA SETUP TRACKER EXCEL REPLACE
   ========================================================= */
exports.replaceInfraFromExcel = async (req, res) => {
  try {
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

    const headerRow = rows[0].map(normalizeHeader);
    const colIndex = (name) =>
      headerRow.findIndex((h) => h.includes(name));

    const idx = {
      infraPhase: colIndex("infra"),
      taskName: colIndex("task"),
      status: colIndex("status"),
      percent: colIndex("complete"),
      startDate: colIndex("start"),
      endDate: colIndex("end"),
      owner: colIndex("owner"),
    };

    const today = new Date();
    const infraTasks = [];

    rows.slice(1).forEach((row) => {
      if (row.every((c) => String(c).trim() === "")) return;

      infraTasks.push({
        infraPhase: row[idx.infraPhase] || "General",
        taskName: row[idx.taskName] || "TBD",
        status: row[idx.status] || "Planned",
        percentComplete: Number(row[idx.percent]) || 0,
        startDate: parseDate(row[idx.startDate], today),
        endDate: parseDate(row[idx.endDate], today),
        owner: row[idx.owner] || "",
      });
    });

    const result = await prisma.$transaction(async (tx) => {
      const deleted = await tx.infraTask.deleteMany();
      const inserted = await tx.infraTask.createMany({
        data: infraTasks,
      });

      return {
        deleted: deleted.count,
        inserted: inserted.count,
      };
    });

    res.json({
      message: "Infra setup tracker replaced",
      ...result,
    });
  } catch (err) {
    console.error("Infra Excel replace failed:", err);
    res.status(500).json({ error: err.message });
  }
};
