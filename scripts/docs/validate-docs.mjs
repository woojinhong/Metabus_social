import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ALLOWED_ADR_STATUS = new Set(["Proposed", "Accepted", "Rejected", "Superseded"]);

async function exists(target) {
  try { await fs.promises.access(target); return true; } catch { return false; }
}

async function walk(dir, accept = () => true) {
  const output = [];
  for (const entry of await fs.promises.readdir(dir, { withFileTypes: true })) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...await walk(target, accept));
    else if (accept(target)) output.push(target);
  }
  return output;
}

function linesOf(text) {
  return text.replace(/\r/g, "").split("\n").length - (text.endsWith("\n") ? 1 : 0);
}

function headingSlugs(text) {
  const counts = new Map();
  const slugs = new Set();
  for (const match of text.matchAll(/<a\s+(?:name|id)=["\']([^"\']+)["\']/gi)) slugs.add(match[1].toLowerCase());
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^#{1,6}\s+(.+?)\s*#*$/);
    if (!match) continue;
    const base = match[1].toLowerCase().replace(/`/g, "").replace(/<[^>]+>/g, "")
      .replace(/[^\p{L}\p{N} _-]/gu, "").trim().replace(/\s+/g, "-");
    const count = counts.get(base) || 0;
    slugs.add(count ? `${base}-${count}` : base);
    counts.set(base, count + 1);
  }
  return slugs;
}

function tableCellCount(line) {
  let count = 1, escaped = false, code = false;
  const body = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  for (const char of body) {
    if (escaped) { escaped = false; continue; }
    if (char === "\\") { escaped = true; continue; }
    if (char === "`") { code = !code; continue; }
    if (char === "|" && !code) count += 1;
  }
  return count;
}

function validateYamlSubset(file, text, errors) {
  const seenIds = new Set();
  const rows = text.split(/\r?\n/);
  rows.forEach((line, index) => {
    if (/\t/.test(line)) errors.push(`${file}:${index + 1} YAML tab indentation`);
    if (!line.trim() || line.trim().startsWith("#")) return;
    const indent = line.match(/^ */)[0].length;
    if (indent % 2) errors.push(`${file}:${index + 1} YAML indentation is not two-space aligned`);
    if (!/^\s*(?:-\s+)?[A-Za-z0-9_-]+:\s*(?:.*)?$/.test(line) && !/^\s*-\s+.+$/.test(line))
      errors.push(`${file}:${index + 1} unsupported or malformed YAML line`);
    const quotes = (line.match(/(?<!\\)"/g) || []).length;
    if (quotes % 2) errors.push(`${file}:${index + 1} unbalanced double quotes`);
    const id = line.match(/^\s+id:\s+([A-Za-z0-9_-]+)\s*$/);
    if (id && seenIds.has(id[1])) errors.push(`${file}:${index + 1} duplicate form id ${id[1]}`);
    if (id) seenIds.add(id[1]);
  });
  if (file.includes("ISSUE_TEMPLATE")) {
    for (const key of ["name:", "description:", "body:"])
      if (!text.includes(key)) errors.push(`${file}: missing ${key}`);
  }
  if (file.includes("workflows")) {
    for (const key of ["name:", "on:", "jobs:"])
      if (!text.includes(key)) errors.push(`${file}: missing ${key}`);
  }
}

export async function validateRepository(root = globalThis.process?.cwd?.() || (typeof nodeRepl !== "undefined" ? nodeRepl.cwd : ".")) {
  const errors = [];
  const docsDir = path.join(root, "docs");
  const markdown = await walk(docsDir, file => file.endsWith(".md"));
  for (const rel of ["AGENTS.md", "CLAUDE.md", "korea.md", ".github/pull_request_template.md"]) {
    const target = path.join(root, rel);
    if (await exists(target)) markdown.push(target);
  }
  const contents = new Map();
  for (const file of markdown) contents.set(file, await fs.promises.readFile(file, "utf8"));

  for (const [file, text] of contents) {
    const rel = path.relative(root, file).replaceAll("\\", "/");
    const count = linesOf(text);
    if (count > 200) errors.push(`${rel}: ${count} lines exceeds 200`);
    text.split(/\r?\n/).forEach((line, index) => {
      if (/[ \t]+$/.test(line)) errors.push(`${rel}:${index + 1} trailing whitespace`);
    });

    const linkPattern = /!?\[[^\]]*\]\(([^)]+)\)/g;
    for (const match of text.matchAll(linkPattern)) {
      let target = match[1].trim().replace(/^<|>$/g, "").split(/\s+["']/)[0];
      if (/^(?:https?:|mailto:|tel:)/i.test(target)) continue;
      const [rawPath, fragment] = target.split("#", 2);
      const linked = rawPath ? path.resolve(path.dirname(file), decodeURIComponent(rawPath)) : file;
      if (!await exists(linked)) { errors.push(`${rel}: broken link ${target}`); continue; }
      if (fragment && linked.endsWith(".md")) {
        const linkedText = contents.get(linked) || await fs.promises.readFile(linked, "utf8");
        if (!headingSlugs(linkedText).has(decodeURIComponent(fragment).toLowerCase()))
          errors.push(`${rel}: missing fragment ${target}`);
      }
    }

    const rows = text.split(/\r?\n/);
    rows.forEach((line, index) => {
      if (!line.includes("|") || !/^\s*\|?\s*:?-{3,}/.test(line) || index === 0) return;
      const expected = tableCellCount(rows[index - 1]);
      if (expected < 2) errors.push(`${rel}:${index + 1} malformed table header`);
      for (let row = index + 1; row < rows.length && rows[row].includes("|") && rows[row].trim(); row += 1)
        if (tableCellCount(rows[row]) !== expected) errors.push(`${rel}:${row + 1} malformed table columns`);
    });
  }

  const declarations = new Map();
  const headingDeclaration = /^#{1,6}\s+(D-\d{3}|ADR-\d{3})\b/;
  const tableDeclaration = /^(?:\|\s*|-\s+\*\*(?:Safety requirement\s+)?)(A-\d{3}|UX-OQ-\d{3}|WM-GATE-\d{2}|(?:FR|UX|SR|NFR)-[A-Z]+-\d{3})\b/;
  for (const [file, text] of contents) {
    const rel = path.relative(root, file).replaceAll("\\", "/");
    text.split(/\r?\n/).forEach((line, index) => {
      const id = line.match(headingDeclaration)?.[1] || line.match(tableDeclaration)?.[1];
      if (!id) return;
      const prior = declarations.get(id);
      if (prior) errors.push(`${rel}:${index + 1} duplicate ID ${id} first declared at ${prior}`);
      else declarations.set(id, `${rel}:${index + 1}`);
    });
  }

  const decisions = await fs.promises.readFile(path.join(root, "docs/discovery/decisions.md"), "utf8");
  const approvedDecisionIds = new Set();
  for (const match of decisions.matchAll(/^###\s+(D-\d{3})\b[^\n]*\n([\s\S]*?)(?=^###\s+D-\d{3}\b|(?![\s\S]))/gm)) {
    if (/\*\*Status\/date\/authority:\*\*\s*Approved\b/i.test(match[2])) approvedDecisionIds.add(match[1]);
  }
  const adrFiles = await walk(path.join(root, "docs/adr"), file => /ADR-\d{3}.*\.md$/.test(file));
  const adrIds = new Set();
  for (const file of adrFiles) {
    const rel = path.relative(root, file).replaceAll("\\", "/");
    const id = path.basename(file).match(/^(ADR-\d{3})/)[1];
    if (adrIds.has(id)) errors.push(`${rel}: duplicate ADR ID ${id}`);
    adrIds.add(id);
    const text = await fs.promises.readFile(file, "utf8");
    const front = text.match(/^---\s*\n([\s\S]*?)\n---/);
    const status = front && front[1].match(/^status:\s*["']?([^"'\n]+)["']?\s*$/m);
    const statusValue = status?.[1]?.trim();
    if (!statusValue || !ALLOWED_ADR_STATUS.has(statusValue)) errors.push(`${rel}: invalid ADR status`);
    if (statusValue === "Accepted") {
      const authority = front?.[1].match(/^decision_authority:\s*(.+)$/m)?.[1] || "";
      const references = [...authority.matchAll(/D-\d{3}/g)].map(match => match[0]);
      if (!references.length || references.some(reference => !approvedDecisionIds.has(reference))) {
        errors.push(`${rel}: Accepted ADR lacks matching approved decision authority`);
      }
    }
  }

  const index = await fs.promises.readFile(path.join(root, "docs/INDEX.md"), "utf8");
  for (const required of ["../korea.md", "discovery/decisions.md", "research/README.md", "spec/mvp-scope.md", "spec/ux/README.md", "architecture/README.md", "adr/README.md", "wiki/README.md", "operations/README.md"])
    if (!index.includes(`](${required})`)) errors.push(`docs/INDEX.md: missing required link ${required}`);

  const yaml = await walk(path.join(root, ".github"), file => /\.ya?ml$/.test(file));
  for (const file of yaml) validateYamlSubset(path.relative(root, file).replaceAll("\\", "/"), await fs.promises.readFile(file, "utf8"), errors);

  const result = { markdownFiles: markdown.length, yamlFiles: yaml.length, declaredIds: declarations.size, adrFiles: adrFiles.length, errors };
  if (errors.length) throw new Error(`Documentation validation failed:\n${errors.join("\n")}`);
  return result;
}

const runtime = globalThis.process;
const invoked = runtime?.argv?.[1] && path.resolve(runtime.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  validateRepository().then(result => { console.log(JSON.stringify(result, null, 2)); })
    .catch(error => { console.error(error.message); runtime.exitCode = 1; });
}
