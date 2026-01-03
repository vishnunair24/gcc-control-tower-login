const express = require("express");
const cors = require("cors");

const taskRoutes = require("./routes/taskRoutes");
const infraTaskRoutes = require("./routes/infraTaskRoutes");
const excelUploadRoutes = require("./routes/excelUploadRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// =======================
// ROUTES
// =======================

// Program Tracker
app.use("/tasks", taskRoutes);

// Infra Setup Tracker
app.use("/infra-tasks", infraTaskRoutes);

// Excel Uploads (Program + Infra)
app.use("/excel", excelUploadRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "Backend running" });
});

app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});
