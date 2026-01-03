const XLSX = require("xlsx");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Normalize header names
 */
function normalizeHeader(h) {
  return String(h)
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

/**
 * Parse Excel date safely
 */
function parseDate(value) {
  if (!value) return null;

  // Excel numeric date
  if (typeof value === "number") {
    const utcDays = Math.floor(value - 25569);
    return new Date(utcDays * 86400 * 1000);
  }

  // String date
  const d = new Date(value);
  return isNaN(d) ? null : d;
}

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

    const headers = rows[0].map(normalizeHeader);
    const col = (name) => headers.indexOf(name);

    const idx = {
      infraPhase: col("infraphase"),
      taskName: col("taskname"),
      status: col("status"),
      percentComplete: col("%complete"),
      startDate: col("startdate"),
      endDate: col("enddate"),
      owner: col("owner"),
    };

    const data = [];

    rows.slice(1).forEach((row) => {
      if (row.every((c) => String(c).trim() === "")) return;

      data.push({
        infraPhase: row[idx.infraPhase]?.toString().trim() || "",
        taskName: row[idx.taskName]?.toString().trim() || "",
        status: row[idx.status]?.toString().trim() || "Planned",
        percentComplete: Number(row[idx.percentComplete]) || 0,
        startDate: parseDate(row[idx.startDate]),
        endDate: parseDate(row[idx.endDate]),
        owner: row[idx.owner]?.toString().trim() || "",
      });
    });

    if (!data.length) {
      return res.status(400).json({ error: "No valid data rows found" });
    }

    // 🔥 CRITICAL FIX: Correct Prisma model casing
    const result = await prisma.$transaction(async (tx) => {
      const deleted = await tx.InfraTask.deleteMany();
      const inserted = await tx.InfraTask.createMany({
        data,
      });

      return {
        deleted: deleted.count,
        inserted: inserted.count,
      };
    });

    res.json({
      message: "Infra Excel replaced successfully",
      ...result,
    });
  } catch (err) {
    console.error("❌ Infra Excel replace failed:", err);
    res.status(500).json({ error: err.message });
  }
};
