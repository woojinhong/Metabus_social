#!/usr/bin/env node

import {
  realpathSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import {
  basename,
  dirname,
  isAbsolute,
  relative,
  resolve,
} from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import {
  compilePlanner,
  serializePlannerResult,
} from "./compiler.mjs";
import {
  createErrorRecord,
  PlannerError,
} from "./planner-error.mjs";

function usage() {
  return [
    "Usage:",
    "  node scripts/harness/planner/cli.mjs",
    "    --requirements <file>",
    "    --repository-sha <40-lowercase-hex>",
    "    [--output <new-file-under-os-temp>]",
  ].join("\n");
}

function parseArgs(args) {
  const known = new Set(["--requirements", "--repository-sha", "--output"]);
  const parsed = {};
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (!known.has(flag) || value === undefined || value.startsWith("--")) {
      throw new TypeError(usage());
    }
    if (Object.hasOwn(parsed, flag)) {
      throw new TypeError(`Duplicate option ${flag}\n${usage()}`);
    }
    parsed[flag] = value;
  }
  if (!parsed["--requirements"] || !parsed["--repository-sha"]) {
    throw new TypeError(usage());
  }
  return parsed;
}

function assertTemporaryOutput(outputPath) {
  if (!isAbsolute(outputPath)) {
    throw new TypeError("--output must be an absolute path under the OS temp directory");
  }
  const tempRoot = realpathSync(tmpdir());
  const resolved = resolve(outputPath);
  const realParent = realpathSync(dirname(resolved));
  const candidate = relative(tempRoot, resolve(realParent, basename(resolved)));
  if (
    candidate === ""
    || candidate === ".."
    || candidate.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`)
    || isAbsolute(candidate)
  ) {
    throw new TypeError("--output must be a file below the OS temp directory");
  }
  return resolved;
}

export function runCli(args) {
  const parsed = parseArgs(args);
  const text = readFileSync(resolve(parsed["--requirements"]), "utf8");
  const output = serializePlannerResult(
    compilePlanner(text, parsed["--repository-sha"]),
  );
  if (parsed["--output"]) {
    writeFileSync(assertTemporaryOutput(parsed["--output"]), output, {
      encoding: "utf8",
      flag: "wx",
    });
  } else {
    process.stdout.write(output);
  }
  return 0;
}

const invokedPath = process.argv[1] ? realpathSync(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = runCli(process.argv.slice(2));
  } catch (error) {
    const record = error instanceof PlannerError
      ? error.record
      : createErrorRecord({
          repositoryUri: "https://github.com/woojinhong/metabus_social",
          code: "DRP_REQUIREMENT_EXTRACTION_FAILED",
          message: error.message,
          details: {
            field: "cli",
            expected: "valid read-only Planner invocation",
            actual: error.code ?? error.name,
          },
        });
    process.stderr.write(`${JSON.stringify(record)}\n`);
    process.exitCode = 1;
  }
}
