import fs from "node:fs";
import path from "node:path";

const AUTHORITATIVE_STATE = {
  d024:
    "D-024 is satisfied only for the approved UX baseline and isolated low-fidelity prototype (docs/discovery/decisions.md).",
  implementation:
    "Implementation Contract promotion and production implementation remain unapproved; implementation_ready must remain false (docs/discovery/implementation-contract-promotion-proposal.md).",
};

const HISTORICAL_PATHS = [
  /^docs\/discovery\/decisions\.md$/,
  /^docs\/research\//,
  /^docs\/reviews\//,
];

const IGNORED_DIRECTORIES = new Set([
  ".agents",
  ".codex",
  ".git",
  ".omx",
  ".worktrees",
  "build",
  "coverage",
  "dist",
  "node_modules",
]);

const D024_DIRECT_PATTERNS = [
  /\bD-024\b\s*(?:gate\s*)?(?:is|remains|status:)?\s*(?:still\s+)?(?:pending|awaiting|unsatisfied|not yet satisfied|the next gate|still gated|approval (?:is )?pending)\b/i,
  /\b(?:pending|awaiting|blocked by|still gated by|next gate(?:\s+is)?)\s+(?:the\s+)?(?:UX\s+gate\s+)?\bD-024\b/i,
  /\bD-024\b\s+(?:must|needs? to)\s+pass\b/i,
  /\b(?:until|before)\s+D-024\s+(?:is\s+)?(?:satisfied|approved)\b/i,
  /\b(?:pending UX approval|UX approval (?:is )?pending|awaiting UX approval|UX approval (?:is )?(?:incomplete|unfinished))\b/i,
  /D-024.{0,40}(?:승인 대기|미충족|충족 전|다음\s*(?:Gate|게이트))/i,
  /(?:UX|사용자 경험).{0,30}(?:승인 대기|승인 미완료|미승인)/i,
];

const D024_AMBIGUOUS_PATTERNS = [
  /\b(?:after|once|following)\s+(?:the\s+)?UX approval\b/i,
  /\b(?:after|once|following)\s+D-024\b/i,
  /(?:UX 승인|D-024)\s*(?:후|이후에만|완료 후)/i,
];

const CONTRACT_PROMOTION_PATTERNS = [
  /\bImplementation Contract(?: documentation)? (?:phase|promotion)\s+(?:is|was|has been)\s+(?:approved|authorized)\b/i,
  /\bImplementation Contract artifacts?\s+(?:are|is)\s+(?:approved|authorized|implementation-ready)\b/i,
  /Implementation Contract.{0,40}(?:단계|승격).{0,30}(?:승인됨|승인되었|허가됨)/i,
];

const IMPLEMENTATION_AUTHORITY_PATTERNS = [
  /\b(?:OpenAPI|AsyncAPI|DBML|migrations?|production implementation)\b.{0,60}\b(?:is|are|may be|can be|has been)\s+(?:approved|authorized|permitted|implementation-ready|able to proceed)\b/i,
  /\bproduction implementation\b.{0,40}\bcan proceed\b/i,
  /(?:OpenAPI|AsyncAPI|DBML|마이그레이션|프로덕션 구현).{0,50}(?:작성 가능|구현 가능|승인됨|허가됨)/i,
];

function normalizePath(file) {
  return file.replaceAll("\\", "/").replace(/^\.\//, "");
}

function frontMatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return new Map();
  const values = new Map();
  match[1].split(/\r?\n/).forEach((line, index) => {
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*?)\s*$/);
    if (field) values.set(field[1].toLowerCase(), { value: field[2].replace(/^["']|["']$/g, ""), line: index + 2 });
  });
  return values;
}

function finding(id, severity, file, line, matched, state, action) {
  return { id, severity, file: normalizePath(file), line, matched: matched.trim(), state, action };
}

function isHistoricalPath(file) {
  return HISTORICAL_PATHS.some(pattern => pattern.test(file));
}

function hasHistoricalContext(lines, index) {
  const context = lines.slice(Math.max(0, index - 5), Math.min(lines.length, index + 6)).join(" ");
  return /\b20\d{2}-\d{2}-\d{2}\b|status\/date\/authority|histor(?:y|ical)|previously|at the time|retrospective|archive|과거|당시|이전 상태|역사 기록/i.test(context);
}

function hasDenialContext(lines, index) {
  const context = lines.slice(Math.max(0, index - 1), Math.min(lines.length, index + 2)).join(" ");
  return /\b(?:no|not|never|unapproved|unauthorized|remain(?:s)? blocked|may not|cannot)\b|(?:미승인|승인되지 않|금지|허가되지 않)/i.test(context);
}

function matchingPattern(line, patterns) {
  return patterns.find(pattern => pattern.test(line));
}

function inspectLines(file, text) {
  const findings = [];
  const lines = text.replace(/\r/g, "").split("\n");
  let fenced = false;

  lines.forEach((line, index) => {
    if (/^\s*```/.test(line)) {
      fenced = !fenced;
      return;
    }
    if (fenced) return;

    const directD024 = matchingPattern(line, D024_DIRECT_PATTERNS);
    if (directD024) {
      const historicalContext = hasHistoricalContext(lines, index);
      const quotedResearch = /^docs\/research\//.test(file) && /^\s*>/.test(line);
      if (isHistoricalPath(file) && (historicalContext || quotedResearch)) return;
      const severity = historicalContext || isHistoricalPath(file) ? "warning" : "error";
      findings.push(finding(
        severity === "error" ? "SGV-D024-E001" : "SGV-D024-W001",
        severity,
        file,
        index + 1,
        line,
        AUTHORITATIVE_STATE.d024,
        severity === "error"
          ? "Rewrite the current-state claim or add explicit dated historical context."
          : "Confirm that this is a dated historical statement or update the stale wording.",
      ));
      return;
    }

    if (matchingPattern(line, D024_AMBIGUOUS_PATTERNS)) {
      findings.push(finding(
        "SGV-D024-W002",
        "warning",
        file,
        index + 1,
        line,
        AUTHORITATIVE_STATE.d024,
        "Clarify whether this refers to a historical dependency or a still-open implementation gate.",
      ));
    }

    if (matchingPattern(line, CONTRACT_PROMOTION_PATTERNS) && !hasDenialContext(lines, index)) {
      findings.push(finding(
        "SGV-CONTRACT-E001",
        "error",
        file,
        index + 1,
        line,
        AUTHORITATIVE_STATE.implementation,
        "Cite explicit recorded owner approval or restore approval-pending wording.",
      ));
    }

    if (matchingPattern(line, IMPLEMENTATION_AUTHORITY_PATTERNS) && !hasDenialContext(lines, index)) {
      findings.push(finding(
        "SGV-CONTRACT-E002",
        "error",
        file,
        index + 1,
        line,
        AUTHORITATIVE_STATE.implementation,
        "Remove the implementation-authority claim or cite the explicit promotion decision.",
      ));
    }
  });

  return findings;
}

function inspectFrontMatter(file, text) {
  const findings = [];
  const values = frontMatter(text);
  const ready = values.get("implementation_ready");
  const classification = values.get("classification");
  const status = values.get("status");
  const documentType = values.get("document_type");
  const authority = values.get("decision_authority");
  const proposalLike = /proposal/i.test(classification?.value || "") || /pending|unapproved|proposal/i.test(status?.value || "");

  if (/^true$/i.test(ready?.value || "")) {
    findings.push(finding(
      "SGV-IMPL-E001",
      "error",
      file,
      ready.line,
      `implementation_ready: ${ready.value}`,
      AUTHORITATIVE_STATE.implementation,
      "Keep implementation_ready false until an explicit authoritative promotion is recorded.",
    ));
  }

  if (proposalLike && /^(?:approved|authoritative|implementation-ready)$/i.test(status?.value || "")) {
    findings.push(finding(
      "SGV-FM-E001",
      "error",
      file,
      status.line,
      `status: ${status.value}`,
      AUTHORITATIVE_STATE.implementation,
      "Align proposal classification and approval-pending status; do not imply authority.",
    ));
  }

  if (/pending|unapproved/i.test(status?.value || "")
      && /authoritative/i.test(`${classification?.value || ""} ${documentType?.value || ""}`)) {
    findings.push(finding(
      "SGV-FM-E002",
      "error",
      file,
      status.line,
      `status: ${status.value}`,
      AUTHORITATIVE_STATE.implementation,
      "Remove authoritative metadata or record the explicit approval basis.",
    ));
  }

  if (/^user decision$/i.test(classification?.value || "")
      && !/(?:D-\d{3}|explicit|owner|user|delegation|승인)/i.test(authority?.value || "")) {
    findings.push(finding(
      "SGV-FM-W001",
      "warning",
      file,
      authority?.line || classification.line,
      authority ? `decision_authority: ${authority.value}` : "decision_authority: <missing>",
      "User-decision classification requires an identifiable recorded approval basis.",
      "Add the exact decision or explicit owner-delegation reference for human review.",
    ));
  }

  return findings;
}

export function inspectSemanticDocument({ file, text }) {
  const normalized = normalizePath(file);
  return [...inspectFrontMatter(normalized, text), ...inspectLines(normalized, text)]
    .sort((left, right) => left.line - right.line || left.id.localeCompare(right.id));
}

async function prohibitedArtifacts(root) {
  const findings = [];
  async function visit(directory) {
    for (const entry of await fs.promises.readdir(directory, { withFileTypes: true })) {
      if (IGNORED_DIRECTORIES.has(entry.name)) continue;
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(target);
      else {
        const rel = normalizePath(path.relative(root, target));
        const prohibited = /^docs\/spec\/api\/.*(?:openapi|asyncapi).*\.(?:json|ya?ml)$/i.test(rel)
          || /^docs\/spec\/data\/.*\.dbml$/i.test(rel)
          || /^(?:docs\/spec\/data|src|app|backend|prototype)\/(?:.*\/)?migrations?\//i.test(rel);
        if (prohibited) findings.push(finding(
          "SGV-ARTIFACT-E001",
          "error",
          rel,
          1,
          rel,
          AUTHORITATIVE_STATE.implementation,
          "Remove the authoritative artifact from the unapproved path or obtain explicit promotion authority.",
        ));
      }
    }
  }
  await visit(root);
  return findings;
}

export async function inspectSemanticRepository(root, contents) {
  const findings = [];
  for (const [file, text] of contents) {
    findings.push(...inspectSemanticDocument({ file: path.relative(root, file), text }));
  }
  findings.push(...await prohibitedArtifacts(root));
  return findings.sort((left, right) =>
    left.file.localeCompare(right.file) || left.line - right.line || left.id.localeCompare(right.id));
}

export function formatSemanticFinding(item) {
  return [
    `[${item.id}] ${item.severity.toUpperCase()} ${item.file}:${item.line}`,
    `  matched wording: ${JSON.stringify(item.matched)}`,
    `  current authoritative state: ${item.state}`,
    `  recommended review action: ${item.action}`,
  ].join("\n");
}
