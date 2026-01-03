const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * GET all Infra Tasks
 */
exports.getInfraTasks = async (req, res) => {
  try {
    const tasks = await prisma.infraTask.findMany({
      orderBy: { id: "asc" },
    });
    res.json(tasks);
  } catch (err) {
    console.error("❌ Get infra tasks failed:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * UPDATE Infra Task
 * Handles inline edits safely (including dates)
 */
exports.updateInfraTask = async (req, res) => {
  const id = Number(req.params.id);
  const data = req.body;

  try {
    const updated = await prisma.infraTask.update({
      where: { id },
      data: {
        infraPhase: data.infraPhase,
        taskName: data.taskName,
        status: data.status,
        percentComplete: Number(data.percentComplete),
        owner: data.owner,

        // date-safe updates
        startDate: data.startDate
          ? new Date(data.startDate)
          : undefined,
        endDate: data.endDate
          ? new Date(data.endDate)
          : undefined,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error("❌ Update infra task failed:", err);
    res.status(500).json({
      error: "Update failed",
      details: err.message,
    });
  }
};
