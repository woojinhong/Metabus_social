import { lstat } from "node:fs/promises";
import { resolve } from "node:path";
import {
  normalizeRepositoryPath,
  resolveRepositoryPath,
} from "./path-policy.mjs";

const PATCH_ONLY_OPERATIONS = new Set(["CREATE", "MODIFY"]);

function fail(code, message, details = {}) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  throw error;
}

export function validatePatchOnlyExpectedChange(workPackage, exactAllowedPath) {
  const expectedChanges = workPackage?.expected_changes ?? [];
  if (expectedChanges.length !== 1) {
    fail("RUNNER_EXPECTED_CHANGE_INVALID", "Patch-only requires exactly one expected change", {
      expected_changes: expectedChanges,
    });
  }
  const [expectedChange] = expectedChanges;
  const targetPath = normalizeRepositoryPath(expectedChange.path);
  if (targetPath !== exactAllowedPath) {
    fail(
      "RUNNER_EXPECTED_CHANGE_INVALID",
      "Patch-only expected change must equal the exact allowed path",
      { expected_path: exactAllowedPath, actual_path: targetPath },
    );
  }
  if (!PATCH_ONLY_OPERATIONS.has(expectedChange.operation)) {
    fail(
      "RUNNER_EXPECTED_CHANGE_OPERATION_UNSUPPORTED",
      "Patch-only supports CREATE or MODIFY only",
      { operation: expectedChange.operation },
    );
  }
  return { path: targetPath, operation: expectedChange.operation };
}

export async function validateExpectedChangeAtSource({
  repositoryRoot,
  workPackage,
  exactAllowedPath,
}) {
  const expected = validatePatchOnlyExpectedChange(workPackage, exactAllowedPath);
  const resolved = await resolveRepositoryPath(repositoryRoot, expected.path, {
    mustExist: false,
  });
  const target = resolve(resolved.absolutePath);
  let metadata = null;
  try {
    metadata = await lstat(target);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (metadata !== null && (metadata.isSymbolicLink() || !metadata.isFile())) {
    fail(
      "RUNNER_EXPECTED_CHANGE_TARGET_UNSUPPORTED",
      "Patch-only target must be absent or a regular file at the pinned source",
      {
        path: expected.path,
        is_directory: metadata.isDirectory(),
        is_symbolic_link: metadata.isSymbolicLink(),
      },
    );
  }
  const targetExistsAtSource = metadata !== null;
  const actualOperation = targetExistsAtSource ? "MODIFY" : "CREATE";
  if (actualOperation !== expected.operation) {
    fail(
      "RUNNER_EXPECTED_CHANGE_SOURCE_MISMATCH",
      "Expected change operation is stale against the pinned source checkout",
      {
        path: expected.path,
        expected_operation: expected.operation,
        actual_operation: actualOperation,
        target_exists_at_source: targetExistsAtSource,
      },
    );
  }
  return {
    path: expected.path,
    operation: expected.operation,
    target_exists_at_source: targetExistsAtSource,
  };
}

export async function validateExpectedChangeAfterWorker({
  repositoryRoot,
  expectedChangeState,
}) {
  const resolved = await resolveRepositoryPath(
    repositoryRoot,
    expectedChangeState.path,
    { mustExist: false },
  );
  let metadata = null;
  try {
    metadata = await lstat(resolve(resolved.absolutePath));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (metadata === null || metadata.isSymbolicLink() || !metadata.isFile()) {
    fail(
      "RUNNER_EXPECTED_CHANGE_RESULT_MISMATCH",
      `${expectedChangeState.operation} must leave the exact target as a regular file`,
      {
        path: expectedChangeState.path,
        operation: expectedChangeState.operation,
        target_exists_after_worker: metadata !== null,
      },
    );
  }
  return expectedChangeState;
}
