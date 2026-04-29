import jwt from "jsonwebtoken";
import { env } from "../core/env.js";

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Missing bearer token" });
    return;
  }

  try {
    const token = header.slice("Bearer ".length);
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
