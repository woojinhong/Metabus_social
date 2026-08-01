import { spawnSync } from "node:child_process";

function inspectionError(message, details = {}) {
  const error = new Error(message);
  error.code = "DRP_SOURCE_TARGET_UNSUPPORTED";
  error.details = details;
  throw error;
}

export function createGitSourcePathOperation({
  cwd = process.cwd(),
  gitExecutable = "git",
  run = spawnSync,
} = {}) {
  return ({ path, repositorySha }) => {
    const result = run(
      gitExecutable,
      ["ls-tree", "-z", repositorySha, "--", path],
      { cwd, encoding: "utf8", windowsHide: true },
    );
    if (result.error || result.status !== 0) {
      inspectionError("Unable to inspect target at the pinned source SHA", {
        path,
        repository_sha: repositorySha,
        status: result.status,
        stderr: result.stderr ?? result.error?.message ?? "",
      });
    }
    if (result.stdout === "") return "CREATE";
    const record = result.stdout.replace(/\0$/u, "");
    const match = /^(\d{6})\s+(\w+)\s+[0-9a-f]{40}\t(.+)$/u.exec(record);
    if (!match || match[3] !== path || match[1] === "120000" || match[2] !== "blob") {
      inspectionError("Target must be absent or a regular file at the pinned source SHA", {
        path,
        repository_sha: repositorySha,
        tree_record: record,
      });
    }
    if (!["100644", "100755"].includes(match[1])) {
      inspectionError("Target Git mode is unsupported", {
        path,
        repository_sha: repositorySha,
        mode: match[1],
      });
    }
    return "MODIFY";
  };
}
