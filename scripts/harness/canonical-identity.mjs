import { createHash } from "node:crypto";
import {
  canonicalRecordBytes,
  normalizePosixPath,
  normalizeText,
} from "./canonical-json.mjs";

export const URL_NAMESPACE_UUID = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
export const CANONICAL_REPOSITORY_URI = "https://github.com/woojinhong/metabus_social";

function parseUuid(uuid) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid)) {
    throw new TypeError(`Invalid UUID namespace: ${uuid}`);
  }
  return Buffer.from(uuid.replaceAll("-", ""), "hex");
}

function formatUuid(bytes) {
  const hex = Buffer.from(bytes).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function uuidv5(name, namespace) {
  if (typeof name !== "string" || name.length === 0) {
    throw new TypeError("UUIDv5 name must be a non-empty string");
  }
  const digest = createHash("sha1")
    .update(parseUuid(namespace))
    .update(Buffer.from(normalizeText(name), "utf8"))
    .digest()
    .subarray(0, 16);
  digest[6] = (digest[6] & 0x0f) | 0x50;
  digest[8] = (digest[8] & 0x3f) | 0x80;
  return formatUuid(digest);
}

export function normalizeRepositoryUri(repositoryUri) {
  let parsed;
  try {
    parsed = new URL(repositoryUri);
  } catch {
    throw new TypeError("Repository identity must be an absolute HTTPS URI");
  }
  if (
    parsed.protocol !== "https:"
    || parsed.username
    || parsed.password
    || parsed.port
    || parsed.search
    || parsed.hash
  ) {
    throw new TypeError("Repository identity must be credential-free HTTPS without query or fragment");
  }
  const parts = parsed.pathname
    .replace(/\/+$/, "")
    .replace(/\.git$/i, "")
    .split("/")
    .filter(Boolean);
  if (parts.length !== 2) {
    throw new TypeError("Repository URI must contain exactly owner and repository");
  }
  return `https://${parsed.hostname.toLowerCase()}/${parts[0].toLowerCase()}/${parts[1].toLowerCase()}`;
}

export function projectNamespaceUuid(repositoryUri = CANONICAL_REPOSITORY_URI) {
  return uuidv5(normalizeRepositoryUri(repositoryUri), URL_NAMESPACE_UUID);
}

function normalizeIdentityText(value) {
  return normalizeText(value)
    .replace(/^[ \t]*```[^\n]*$/gmu, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/gu, "$1")
    .replace(/`([^`\n]+)`/gu, "$1")
    .replace(/(\*\*|__)(.*?)\1/gu, "$2")
    .replace(/(\*|_)([^*_\n]+)\1/gu, "$2")
    .trim()
    .replace(/\s+/gu, " ");
}

export function requirementIdentityName(record) {
  if (record?.record_kind !== "CANONICAL_REQUIREMENT") {
    throw new TypeError("Requirement identity name requires a canonical Requirement record");
  }
  const identityPath = normalizePosixPath(record.source?.identity_path);
  const anchor = normalizeIdentityText(record.source?.section_anchor ?? "").toLowerCase();
  const kind = normalizeIdentityText(record.requirement_kind).toLowerCase();
  const statement = normalizeIdentityText(record.statement);
  if (anchor === "" || kind === "" || statement === "") {
    throw new TypeError("Requirement identity fields must be non-empty");
  }
  return `${identityPath}\n${anchor}\n${kind}\n${statement}`;
}

export function officialIdentityUuid({
  record,
  repositoryUri,
  schema,
  registry,
}) {
  canonicalRecordBytes(record, { schema, registry });
  if (record === null || typeof record !== "object" || Array.isArray(record)) {
    throw new TypeError("Official identity requires a canonical record");
  }
  if (record.record_kind !== "CANONICAL_REQUIREMENT" || Object.hasOwn(record, "candidate_ref")) {
    throw new TypeError("Candidate records cannot produce official UUIDs");
  }
  if (
    record.schema_version !== "1.0.0"
    || record.authority?.source_authority !== "APPROVED"
    || record.authority.approval_record === null
    || typeof record.authority.approval_record !== "object"
    || typeof record.authority.approved_by !== "string"
    || record.authority.approved_by.trim() === ""
    || typeof record.authority.approved_at !== "string"
    || record.authority.approved_at.trim() === ""
  ) {
    throw new TypeError("Official identity requires approved canonical lineage");
  }
  const source = record.source;
  if (
    source === null
    || typeof source !== "object"
    || !/^[0-9a-f]{40}$/.test(source.repository_sha ?? "")
    || !/^[0-9a-f]{40}$/.test(source.document_blob_sha ?? "")
    || !/^sha256:[0-9a-f]{64}$/.test(source.source_text_hash ?? "")
  ) {
    throw new TypeError("Official identity requires a pinned canonical source");
  }
  const sourceRepository = normalizeRepositoryUri(source.repository);
  if (
    repositoryUri !== undefined
    && normalizeRepositoryUri(repositoryUri) !== sourceRepository
  ) {
    throw new TypeError("Repository URI does not match the canonical record source");
  }
  return uuidv5(requirementIdentityName(record), projectNamespaceUuid(sourceRepository));
}

export function deriveProjectIdentity({
  repositoryUri,
  localPath: _localPath,
  branch: _branch,
  worktree: _worktree,
}) {
  const canonicalRepositoryUri = normalizeRepositoryUri(repositoryUri);
  return {
    canonicalRepositoryUri,
    projectNamespace: projectNamespaceUuid(canonicalRepositoryUri),
  };
}
