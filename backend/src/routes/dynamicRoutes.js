import { Router } from "express";
import { db } from "../core/db.js";
import { buildEntitySchema } from "../core/validation.js";
import { requireAuth } from "../middleware/auth.js";

const escapeId = (value) => `"${value.replace(/"/g, "")}"`;

const parseCsv = (csvText) => {
  const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || "";
    });
    return row;
  });
};

export const dynamicRouter = (config) => {
  const router = Router();
  const entityMap = new Map(config.entities.map((e) => [e.name, e]));

  router.get("/meta", requireAuth, (_req, res) => {
    res.json(config);
  });

  router.use("/:entity", requireAuth);

  router.get("/:entity", async (req, res) => {
    const entity = entityMap.get(String(req.params.entity));
    if (!entity || !req.user) return res.status(404).json({ message: "Entity not found." });

    const result = await db.query(`SELECT * FROM ${escapeId(entity.name)} WHERE owner_id=$1 ORDER BY id DESC`, [req.user.id]);
    res.json(result.rows);
  });

  router.post("/:entity", async (req, res) => {
    const entity = entityMap.get(String(req.params.entity));
    if (!entity || !req.user) return res.status(404).json({ message: "Entity not found." });

    const parsed = buildEntitySchema(entity).safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ message: "Validation failed", details: parsed.error.flatten() });

    const payload = parsed.data;
    const columns = Object.keys(payload).filter((key) => payload[key] !== undefined);
    const values = columns.map((col) => payload[col]);
    const place = columns.map((_v, i) => `$${i + 2}`);

    const query = `INSERT INTO ${escapeId(entity.name)} (owner_id${columns.length ? `, ${columns.map(escapeId).join(", ")}` : ""}) VALUES ($1${place.length ? `, ${place.join(", ")}` : ""}) RETURNING *`;
    const result = await db.query(query, [req.user.id, ...values]);
    res.status(201).json(result.rows[0]);
  });

  router.put("/:entity/:id", async (req, res) => {
    const entity = entityMap.get(String(req.params.entity));
    if (!entity || !req.user) return res.status(404).json({ message: "Entity not found." });

    const parsed = buildEntitySchema(entity).partial().safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ message: "Validation failed", details: parsed.error.flatten() });

    const payload = parsed.data;
    const columns = Object.keys(payload).filter((key) => payload[key] !== undefined);
    if (!columns.length) return res.status(400).json({ message: "No fields to update." });

    const assignments = columns.map((col, i) => `${escapeId(col)}=$${i + 1}`).join(", ");
    const values = columns.map((col) => payload[col]);

    const result = await db.query(
      `UPDATE ${escapeId(entity.name)} SET ${assignments}, updated_at=NOW() WHERE id=$${columns.length + 1} AND owner_id=$${columns.length + 2} RETURNING *`,
      [...values, Number(req.params.id), req.user.id]
    );

    if (!result.rowCount) return res.status(404).json({ message: "Record not found." });
    res.json(result.rows[0]);
  });

  router.delete("/:entity/:id", async (req, res) => {
    const entity = entityMap.get(String(req.params.entity));
    if (!entity || !req.user) return res.status(404).json({ message: "Entity not found." });

    const result = await db.query(`DELETE FROM ${escapeId(entity.name)} WHERE id=$1 AND owner_id=$2 RETURNING id`, [Number(req.params.id), req.user.id]);
    if (!result.rowCount) return res.status(404).json({ message: "Record not found." });
    res.json({ deleted: true });
  });

  router.post("/:entity/import/csv", async (req, res) => {
    const entity = entityMap.get(String(req.params.entity));
    if (!entity || !req.user) return res.status(404).json({ message: "Entity not found." });

    const csvText = String(req.body?.csv || "");
    const rows = parseCsv(csvText);
    if (!rows.length) return res.status(400).json({ message: "CSV must include header and at least one row." });

    const schema = buildEntitySchema(entity).partial();
    let inserted = 0;
    const errors = [];

    for (const [idx, row] of rows.entries()) {
      const parsed = schema.safeParse(row);
      if (!parsed.success) {
        errors.push(`Row ${idx + 2} validation failed.`);
        continue;
      }

      const payload = parsed.data;
      const cols = Object.keys(payload).filter((k) => payload[k] !== undefined && payload[k] !== "");
      const vals = cols.map((c) => payload[c]);
      const place = cols.map((_v, i) => `$${i + 2}`);
      const query = `INSERT INTO ${escapeId(entity.name)} (owner_id${cols.length ? `, ${cols.map(escapeId).join(", ")}` : ""}) VALUES ($1${place.length ? `, ${place.join(", ")}` : ""})`;
      await db.query(query, [req.user.id, ...vals]);
      inserted += 1;
    }

    res.json({ inserted, errors });
  });

  return router;
};
