import fs from "node:fs";
import path from "node:path";

const AUTHORITATIVE_STATE = {
  d024:
    "D-024 is satisfied only for the approved UX baseline and isolated low-fidelity prototype (docs/discovery/decisions.md).",
  implementation:
    "Proposal-only Implementation Contract documentation is approved; authoritative contracts and production implementation remain unapproved, and implementation_ready must remain false (docs/discovery/implementation-contract-promotion-proposal.md).",
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

const OWNER_APPROVED_PRODUCT_MIGRATIONS = new Set([
  "src/main/resources/db/migration/V1__framework_spring_session_4_1_0_postgresql.sql",
  "src/main/resources/db/migration/V2__account_persistence.sql",
  "src/main/resources/db/migration/V3__credential_persistence.sql",
  "src/main/resources/db/migration/V4__authorization_persistence.sql",
  "src/main/resources/db/migration/V5__audit_persistence.sql",
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
  /\bImplementation Contract(?: documentation)? (?:phase|promotion)\s*:?\s+(?:is|was|has been)\s+(?:approved|authorized)\b/i,
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

function yamlScalar(value) {
  let quote = "";
  let escaped = false;
  let comment = value.length;
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quote && char === "\\") {
      escaped = true;
      continue;
    }
    if (char === quote) {
      quote = "";
      continue;
    }
    if (!quote && (char === '"' || char === "'")) {
      quote = char;
      continue;
    }
    if (!quote && char === "#" && (index === 0 || /\s/.test(value[index - 1]))) {
      comment = index;
      break;
    }
  }
  const scalar = value.slice(0, comment).trim();
  const quoted = scalar.match(/^(["'])([\s\S]*)\1$/);
  return quoted ? quoted[2] : scalar;
}

function frontMatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return new Map();
  const values = new Map();
  match[1].split(/\r?\n/).forEach((line, index) => {
    const field = line.match(/^([A-Za-z0-9_-]+):\s*(.*?)\s*$/);
    if (field) values.set(field[1].toLowerCase(), { value: yamlScalar(field[2]), line: index + 2 });
  });
  return values;
}

function finding(id, severity, file, line, matched, state, action) {
  return { id, severity, file: normalizePath(file), line, matched: matched.trim(), state, action };
}

function isHistoricalPath(file) {
  return HISTORICAL_PATHS.some(pattern => pattern.test(file));
}

const HISTORICAL_CONTEXT_PATTERN =
  /\b20\d{2}-\d{2}-\d{2}\b|status\/date\/authority|reversibility\/gate|histor(?:y|ical)|previously|at the time|retrospective|archive|과거|당시|이전 상태|역사 기록/i;
const LIST_ITEM_PATTERN = /^(\s*)(?:[-+*]|\d+\.)\s+/;
const BLOCK_BOUNDARY_PATTERN = /^\s*(?:#{1,6}\s+|```|>|\|)/;

function isBlockBoundary(line) {
  return BLOCK_BOUNDARY_PATTERN.test(line) || line.includes("|");
}

function listItemRange(lines, index) {
  let start = index;
  while (start >= 0) {
    const line = lines[start];
    if (!line.trim() || isBlockBoundary(line)) return null;
    const item = line.match(LIST_ITEM_PATTERN);
    if (item) {
      if (start === index || (lines[index].match(/^\s*/)?.[0].length || 0) >= item[1].length + 2) {
        let end = start + 1;
        while (end < lines.length
          && lines[end].trim()
          && !isBlockBoundary(lines[end])
          && !LIST_ITEM_PATTERN.test(lines[end])) end += 1;
        return [start, end];
      }
      return null;
    }
    start -= 1;
  }
  return null;
}

function hasHistoricalContext(lines, index) {
  if (HISTORICAL_CONTEXT_PATTERN.test(lines[index])) return true;
  const itemRange = listItemRange(lines, index);
  if (itemRange && HISTORICAL_CONTEXT_PATTERN.test(lines.slice(...itemRange).join(" "))) return true;
  for (const direction of [-1, 1]) {
    for (let distance = 1; distance <= 2; distance += 1) {
      const line = lines[index + direction * distance];
      if (line === undefined || !line.trim() || isBlockBoundary(line)) break;
      if (HISTORICAL_CONTEXT_PATTERN.test(line)) return true;
    }
  }
  return false;
}

function hasDenialContext(statement) {
  return /\b(?:no|not|never|unapproved|unauthorized|remain(?:s)? blocked|may not|cannot)\b|(?:미승인|승인되지 않|금지|허가되지 않)/i.test(statement);
}

function isDocumentationOnlyApproval(statement) {
  return /(?:proposal-only|documentation-only|제안 전용|문서 전용)/i.test(statement)
    && /Implementation Contract/i.test(statement)
    && /(?:documentation|문서)/i.test(statement);
}

function boundedStatement(lines, index) {
  const currentLine = lines[index];
  const current = currentLine.trim();
  if (!current || isBlockBoundary(currentLine) || /[.!?;]\s*$/.test(current)) return current;
  const nextLine = lines[index + 1] || "";
  const next = nextLine.trim();
  if (!next || isBlockBoundary(nextLine) || LIST_ITEM_PATTERN.test(nextLine)) return current;
  const currentItem = currentLine.match(LIST_ITEM_PATTERN);
  const nextIndent = nextLine.match(/^\s*/)?.[0].length || 0;
  if (currentItem && nextIndent < currentItem[1].length + 2) return current;
  return `${current} ${next}`;
}

function sameSentenceContext(lines, index, statement) {
  const current = lines[index] || "";
  const previous = lines[index - 1]?.trim() || "";
  if (!previous
      || isBlockBoundary(current)
      || LIST_ITEM_PATTERN.test(current)
      || isBlockBoundary(previous)
      || LIST_ITEM_PATTERN.test(previous)) return statement;
  const boundary = Math.max(
    previous.lastIndexOf("."),
    previous.lastIndexOf("!"),
    previous.lastIndexOf("?"),
    previous.lastIndexOf(";"),
    previous.lastIndexOf(":"),
  );
  return `${previous.slice(boundary + 1).trim()} ${statement}`.trim();
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

    const statement = boundedStatement(lines, index);
    const statementContext = sameSentenceContext(lines, index, statement);
    if (matchingPattern(statement, CONTRACT_PROMOTION_PATTERNS)
        && !hasDenialContext(statementContext)
        && !isDocumentationOnlyApproval(statement)) {
      findings.push(finding(
        "SGV-CONTRACT-E001",
        "error",
        file,
        index + 1,
        statement,
        AUTHORITATIVE_STATE.implementation,
        "Cite explicit recorded owner approval or restore approval-pending wording.",
      ));
    }

    if (matchingPattern(statement, IMPLEMENTATION_AUTHORITY_PATTERNS) && !hasDenialContext(statementContext)) {
      findings.push(finding(
        "SGV-CONTRACT-E002",
        "error",
        file,
        index + 1,
        statement,
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

  const statusValue = status?.value || "";
  const approvalDenied = /^(?:not approved(?: for implementation)?|approval pending|unapproved)$/i.test(statusValue);
  const approvalClaimed = /^(?:approved(?: for implementation)?|authoritative|implementation-ready)$/i.test(statusValue);
  if (proposalLike && approvalClaimed && !approvalDenied) {
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
          || (/^(?:docs\/spec\/data|src|app|backend|prototype)\/(?:.*\/)?migrations?\//i.test(rel)
            && !OWNER_APPROVED_PRODUCT_MIGRATIONS.has(rel));
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
