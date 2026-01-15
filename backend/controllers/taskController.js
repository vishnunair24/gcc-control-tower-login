const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { createAudit } = require("../utils/audit");
const { normalizeCustomerName } = require("../utils/customerName");

/**
 * GET all tasks (optionally filtered by customerName)
 */
exports.getTasks = async (req, res) => {
  try {
    let { customerName } = req.query;

    // For customer logins, always force data to their own customerName
    if (req.user && req.user.role === "customer") {
      try {
        const cust = await prisma.customer.findUnique({
          where: { userId: req.user.id },
        });
        if (cust && cust.customerName) {
          customerName = normalizeCustomerName(cust.customerName);
        }
      } catch (e) {
        console.error("Failed to resolve customer for user", e);
      }
    }

    // Normalize any query-provided customerName as well
    if (customerName) {
      customerName = normalizeCustomerName(customerName);
    }

    const where = customerName ? { customerName } : {};

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { id: "asc" },
    });
    res.json(tasks);
  } catch (err) {
    console.error("getTasks failed:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * UPDATE task (THIS IS WHERE DATE FIX IS)
 */
exports.updateTask = async (req, res) => {
  const id = Number(req.params.id);
  const data = req.body;

  try {
    const updated = await prisma.task.update({
      where: { id },
      data: {
        workstream: data.workstream,
        deliverable: data.deliverable,
        status: data.status,
        progress: Number(data.progress),
        phase: data.phase,
        milestone: data.milestone,
        owner: data.owner,
        // allow customerName to be updated if provided
        customerName: data.customerName ?? undefined,

        // 🔥 CRITICAL FIX
        startDate: data.startDate
          ? new Date(data.startDate)
          : undefined,

        endDate: data.endDate
          ? new Date(data.endDate)
          : undefined,
      },
    });

    res.json(updated);
    // async audit (don't block response)
    createAudit(req, { action: "update", entity: "Task", entityId: id, details: updated });
  } catch (err) {
    console.error("❌ Update failed:", err);
    res.status(500).json({
      error: "Update failed",
      details: err.message,
    });
  }
};
