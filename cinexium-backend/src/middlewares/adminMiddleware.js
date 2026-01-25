import jwt from "jsonwebtoken";
import user from "../models/userModel.js";

export const adminMiddleWare = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
  next();
};
