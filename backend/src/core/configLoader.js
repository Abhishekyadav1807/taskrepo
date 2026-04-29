import { readFileSync } from "node:fs";
import path from "node:path";
import { env } from "./env.js";

const allowedTypes = ["string", "number", "boolean", "date", "enum", "json"];

const safeType = (raw) => {
  if (!raw) return "string";
  return allowedTypes.includes(raw) ? raw : "string";
};

const fieldLabel = (field) => field.label || { en: field.name };

const sanitizeField = (field, entityName, warnings) => {
  if (!field?.name || typeof field.name !== "string") {
    warnings.push(`Ignored invalid field in ${entityName}`);
    return null;
  }

  const type = safeType(field.type);
  if (field.type && type !== field.type) {
    warnings.push(`Unknown field type '${field.type}' in ${entityName}.${field.name}; defaulted to string`);
  }

  if (type === "enum" && (!field.options || field.options.length === 0)) {
    warnings.push(`Enum without options in ${entityName}.${field.name}; defaulted to string`);
    return {
      name: field.name,
      type: "string",
      required: Boolean(field.required),
      default: field.default,
      label: fieldLabel(field),
      sourceType: field.type || "unknown"
    };
  }

  return {
    name: field.name,
    type,
    required: Boolean(field.required),
    default: field.default,
    options: field.options,
    label: fieldLabel(field),
    sourceType: field.type || "string"
  };
};

const sanitizeEntity = (entity, warnings) => {
  if (!entity?.name || typeof entity.name !== "string") {
    warnings.push("Ignored entity with invalid name");
    return null;
  }

  const fields = (entity.fields || [])
    .map((field) => sanitizeField(field, entity.name, warnings))
    .filter((field) => field !== null);

  if (fields.length === 0) {
    warnings.push(`Entity '${entity.name}' had no valid fields; injected fallback 'title' field`);
    fields.push({
      name: "title",
      type: "string",
      required: false,
      label: { en: "Title" },
      sourceType: "injected"
    });
  }

  const fieldNames = new Set(fields.map((f) => f.name));
  const list = (entity.ui?.list || fields.map((f) => f.name)).filter((name) => fieldNames.has(name));
  const form = (entity.ui?.form || fields.map((f) => f.name)).filter((name) => fieldNames.has(name));

  return {
    name: entity.name,
    label: entity.label || entity.name,
    fields,
    ui: {
      list: list.length ? list : fields.map((f) => f.name),
      form: form.length ? form : fields.map((f) => f.name)
    }
  };
};

export const loadConfig = () => {
  const warnings = [];
  const resolvedPath = path.resolve(process.cwd(), env.configPath);

  let raw = {};
  try {
    raw = JSON.parse(readFileSync(resolvedPath, "utf-8"));
  } catch {
    warnings.push("Failed to parse config JSON. Running with safe defaults.");
  }

  const entities = (raw.entities || [])
    .map((entity) => sanitizeEntity(entity, warnings))
    .filter((entity) => entity !== null);

  return {
    app: {
      name: raw.app?.name || "Generated App",
      defaultLanguage: raw.app?.defaultLanguage || "en",
      languages: raw.app?.languages?.length ? raw.app.languages : ["en"],
      theme: raw.app?.theme || { primary: "#0f766e", secondary: "#f97316" }
    },
    auth: {
      enabled: raw.auth?.enabled !== false,
      methods: raw.auth?.methods?.length ? raw.auth.methods : ["email_password"]
    },
    entities,
    warnings
  };
};
