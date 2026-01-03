const XLSX = require("xlsx");
const { PrismaClient } = require("@prisma/client");

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
    };

    const today = new Date();
    const tasks = [];

    rows.slice(1).forEach((row) => {
      if (row.every((c) => String(c).trim() === "")) return;

      const startDate = parseDate(row[idx.startDate], today);
      const endDate = parseDate(row[idx.endDate], startDate);

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

    const result = await prisma.$transaction(async (tx) => {
      const deleted = await tx.infraTask.deleteMany();
      const inserted = await tx.infraTask.createMany({
        data: tasks,
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
