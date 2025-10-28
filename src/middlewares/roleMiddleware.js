async function roleMiddleware(req, res, next) {
  try {
    if (!req.user.role) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
}

export default roleMiddleware;
