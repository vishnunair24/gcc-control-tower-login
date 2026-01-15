const prisma = require("../prisma/client");

const COOKIE_NAME = "sid";

exports.loadSession = async (req, res, next) => {
  try {
    const token = req.cookies && req.cookies[COOKIE_NAME];
    if (!token) return next();
    const session = await prisma.session.findUnique({ where: { token }, include: { user: true } });
    if (!session) return next();
    const now = new Date();
    const idleRaw = process.env.SESSION_IDLE_MS;
    const idleMs = idleRaw && Number(idleRaw) > 0 ? Number(idleRaw) : null;

    // Only enforce/slide idle timeout when SESSION_IDLE_MS is a
    // positive number. If it's disabled (null), sessions never
    // expire automatically.
    let effectiveExpiresAt = session.expiresAt;
    if (idleMs) {
      if (session.expiresAt < now) {
        // expired
        await prisma.session.deleteMany({ where: { token } });
        return next();
      }

      const newExpiresAt = new Date(now.getTime() + idleMs);
      try {
        await prisma.session.update({ where: { token }, data: { expiresAt: newExpiresAt } });
        effectiveExpiresAt = newExpiresAt;
      } catch (e) {
        console.error("Failed to extend session expiry", e);
      }
    }

    req.session = { ...session, expiresAt: effectiveExpiresAt };
    req.user = session.user;
    next();
  } catch (err) {
    console.error("Session load failed:", err);
    next();
  }
};

exports.requireAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  if (req.user.disabled) return res.status(403).json({ error: "Account disabled" });
  next();
};

exports.requireAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin required" });
  next();
};
