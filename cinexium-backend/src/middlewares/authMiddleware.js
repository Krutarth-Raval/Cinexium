import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const authMiddleware = async (req, res, next) => {
  //lets call token
  const authHeader = req.headers.authorization;
  //oops token missing
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json("Token Missing");
  }

  //token is here
  const token = authHeader.split(" ")[1];

  //is token real
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    //verify user from DB
    const getUser = await User.findById(decoded.id).select("-password");

    //user not found
    if (!getUser) {
      return res.status(401).json("User not found");
    }

    //user found
    req.user = getUser;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expire token." });
  }
};
