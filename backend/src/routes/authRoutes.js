import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../core/db.js";
import { env } from "../core/env.js";

export const authRouter = Router();

authRouter.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || password.length < 6) {
    res.status(400).json({ message: "Email and password (min 6 chars) are required." });
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  try {
    const result = await db.query(
      "INSERT INTO users(email, password_hash) VALUES ($1, $2) RETURNING id, email",
      [email.toLowerCase(), hash]
    );
    const user = result.rows[0];
    const token = jwt.sign(user, env.jwtSecret, { expiresIn: "7d" });
    res.status(201).json({ token, user });
  } catch {
    res.status(409).json({ message: "User already exists." });
  }
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required." });
    return;
  }

  const result = await db.query("SELECT id, email, password_hash FROM users WHERE email=$1", [email.toLowerCase()]);
  const row = result.rows[0];

  if (!row || !(await bcrypt.compare(password, row.password_hash))) {
    res.status(401).json({ message: "Invalid credentials." });
    return;
  }

  const token = jwt.sign({ id: row.id, email: row.email }, env.jwtSecret, { expiresIn: "7d" });
  res.json({ token, user: { id: row.id, email: row.email } });
});

authRouter.post("/magic-link", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ message: "Email is required." });
    return;
  }
  res.json({ message: `Magic link sent to ${email} (mock).` });
});
