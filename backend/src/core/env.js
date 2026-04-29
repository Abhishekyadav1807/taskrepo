import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  dbUrl: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/app_generator",
  jwtSecret: process.env.JWT_SECRET || "dev_secret_change_me",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  configPath: process.env.CONFIG_PATH || "../shared/app-config.json"
};
