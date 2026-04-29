import express from "express";
import cors from "cors";
import { env } from "./core/env.js";
import { loadConfig } from "./core/configLoader.js";
import { ensureBaseTables, syncConfigSchema } from "./core/schemaSync.js";
import { authRouter } from "./routes/authRoutes.js";
import { dynamicRouter } from "./routes/dynamicRoutes.js";

const bootstrap = async () => {
  const config = loadConfig();
  await ensureBaseTables();
  await syncConfigSchema(config);

  const app = express();
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origin === env.frontendOrigin) return callback(null, true);
      if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    }
  }));
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", app: config.app.name, warnings: config.warnings });
  });

  app.use("/auth", authRouter);
  app.use("/api", dynamicRouter(config));

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  });

  app.listen(env.port, () => {
    console.log(`Backend running on http://localhost:${env.port}`);
    if (config.warnings.length) {
      console.log("Config warnings:");
      config.warnings.forEach((warning) => console.log(`- ${warning}`));
    }
  });
};

bootstrap().catch((error) => {
  console.error("Failed to bootstrap", error);
  process.exit(1);
});
