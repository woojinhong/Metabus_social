import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const mode = process.argv[2] ?? "normal";
const detail = process.argv[3] ?? "";

function start() {
  process.stdout.write(`${JSON.stringify({
    type: "thread.started",
    thread_id: "fixture-thread",
  })}\n`);
  process.stdout.write(`${JSON.stringify({ type: "turn.started" })}\n`);
}

function usage(tokens = 12, cost = 0) {
  process.stdout.write(`${JSON.stringify({
    type: "turn.completed",
    usage: {
      input_tokens: tokens,
      cached_input_tokens: 0,
      cache_write_input_tokens: 0,
      output_tokens: 0,
      reasoning_output_tokens: 0,
      total_tokens: tokens,
      cost,
      currency: "USD",
      external_calls: 0,
    },
  })}\n`);
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

if (mode === "grandchild") {
  setTimeout(async () => {
    await writeFile(detail, "orphan survived\n", "utf8");
    process.exit(0);
  }, 1_000);
} else if (mode === "normal") {
  const prompt = await readStdin();
  start();
  process.stdout.write(`${JSON.stringify({
    type: "item.completed",
    item: {
      id: "fixture-inspect",
      type: "agent_message",
      cwd: process.cwd(),
      prompt,
    },
  })}\n`);
  process.stderr.write("fixture stderr\n");
  usage();
} else if (mode === "inspect-env") {
  const prompt = await readStdin();
  start();
  process.stdout.write(`${JSON.stringify({
    type: "item.completed",
    item: {
      id: "fixture-inspect-env",
      type: "agent_message",
      cwd: process.cwd(),
      environment: process.env,
      prompt,
    },
  })}\n`);
  usage(20);
} else if (mode === "nonzero") {
  await readStdin();
  start();
  usage(5);
  process.stderr.write("fixture nonzero\n");
  process.exitCode = 23;
} else if (mode === "hang") {
  await readStdin();
  start();
  usage(1);
  setInterval(() => {}, 10_000);
} else if (mode === "child-tree") {
  await readStdin();
  start();
  usage(2);
  spawn(process.execPath, [
    fileURLToPath(import.meta.url),
    "grandchild",
    detail,
  ], {
    shell: false,
    windowsHide: true,
    stdio: "ignore",
  });
  setInterval(() => {}, 10_000);
} else if (mode === "large-output") {
  await readStdin();
  const block = Buffer.alloc(64 * 1024, "x");
  for (let index = 0; index < 20; index += 1) {
    if (!process.stdout.write(block)) {
      await new Promise((resolve) => process.stdout.once("drain", resolve));
    }
    if (!process.stderr.write(block)) {
      await new Promise((resolve) => process.stderr.once("drain", resolve));
    }
  }
} else if (mode === "external") {
  await readStdin();
  start();
  process.stdout.write(`${JSON.stringify({
    type: "item.completed",
    item: { id: "external-1", type: "web_search" },
  })}\n`);
  usage(4);
} else if (mode === "malformed-after-usage") {
  await readStdin();
  start();
  usage(4);
  process.stdout.write("not-json\n");
} else if (mode === "positive-cost") {
  await readStdin();
  start();
  usage(4, 1);
} else {
  process.stderr.write(`unknown fixture mode: ${mode}\n`);
  process.exitCode = 64;
}
