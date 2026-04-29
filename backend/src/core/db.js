import { Pool } from "pg";
import { env } from "./env.js";

const isHostedDb = /supabase\.com|render\.com|neon\.tech/i.test(env.dbUrl);
let connectionString = env.dbUrl;

if (isHostedDb) {
  try {
    const parsed = new URL(env.dbUrl);
    parsed.searchParams.delete("sslmode");
    connectionString = parsed.toString();
  } catch {
    connectionString = env.dbUrl;
  }
}

export const db = new Pool({
  connectionString,
  ssl: isHostedDb ? { rejectUnauthorized: false } : undefined
});
