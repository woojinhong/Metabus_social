import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SCHEMA_NAMES = [
  "common",
  "requirement",
  "work-package",
  "workgraph",
  "dry-run",
  "error",
];

function loadSchema(name) {
  const path = fileURLToPath(
    new URL(`../../../schemas/automation/${name}.schema.json`, import.meta.url),
  );
  return JSON.parse(readFileSync(path, "utf8"));
}

export const schemas = Object.freeze(
  Object.fromEntries(SCHEMA_NAMES.map((name) => [name, loadSchema(name)])),
);

export const schemaRegistry = Object.freeze(Object.values(schemas));
