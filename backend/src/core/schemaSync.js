import { db } from "./db.js";

const sqlType = (field) => {
  switch (field.type) {
    case "number":
      return "DOUBLE PRECISION";
    case "boolean":
      return "BOOLEAN";
    case "date":
      return "TIMESTAMPTZ";
    case "json":
      return "JSONB";
    default:
      return "TEXT";
  }
};

const escapeId = (value) => `"${value.replace(/"/g, "")}"`;

export const ensureBaseTables = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};

export const syncConfigSchema = async (config) => {
  for (const entity of config.entities) {
    const table = escapeId(entity.name);

    await db.query(`
      CREATE TABLE IF NOT EXISTS ${table} (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    for (const field of entity.fields) {
      const column = escapeId(field.name);
      const type = sqlType(field);
      await db.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${type}`);
    }
  }
};
