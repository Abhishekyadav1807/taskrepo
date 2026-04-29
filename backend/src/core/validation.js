import { z } from "zod";

const coerceBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1 ? true : value === 0 ? false : value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) return true;
    if (["false", "0", "no", "n"].includes(normalized)) return false;
  }
  return value;
};

const toZod = (type, required, options) => {
  let schema;
  switch (type) {
    case "number":
      schema = z.coerce.number();
      break;
    case "boolean":
      schema = z.preprocess(coerceBoolean, z.boolean());
      break;
    case "date":
      schema = z.string().datetime().or(z.string().date());
      break;
    case "enum":
      schema = z.string().refine((value) => options?.includes(value), "Invalid enum value");
      break;
    case "json":
      schema = z.any();
      break;
    default:
      schema = z.string();
  }

  return required ? schema : schema.optional().nullable();
};

export const buildEntitySchema = (entity) => {
  const shape = {};
  for (const field of entity.fields) {
    shape[field.name] = toZod(field.type, field.required, field.options);
  }
  return z.object(shape);
};
