import { canonicalRecordBytes } from "../canonical-json.mjs";
import {
  digestRecord,
  stableId,
} from "./digest.mjs";
import { failPlanner } from "./planner-error.mjs";
import { schemaRegistry, schemas } from "./schemas.mjs";

function sortedUnique(values) {
  return [...new Set(values)].sort();
}

function provenance(workPackage, sourceField, ruleId) {
  return {
    source_wp: workPackage.work_package_id,
    source_field: sourceField,
    policy_rule_id: ruleId,
  };
}

function nodeId(repositoryUri, graphId, workPackageId, type, discriminator = "") {
  return stableId(
    "N",
    repositoryUri,
    `${graphId}\n${workPackageId}\n${type}\n${discriminator}`,
  );
}

function edgeId(repositoryUri, from, to, type, condition) {
  return stableId("E", repositoryUri, `${from}\n${to}\n${type}\n${condition}`);
}

function pathsOverlap(left, right) {
  return (
    left === right
    || left.startsWith(`${right}/`)
    || right.startsWith(`${left}/`)
  );
}

function requiredEdge({
  repositoryUri,
  from,
  to,
  type,
  condition,
  targetNode,
  provenanceValue,
}) {
  return {
    edge_id: edgeId(repositoryUri, from, to, type, condition),
    from,
    to,
    type,
    condition,
    required: true,
    target_node: targetNode,
    provenance: provenanceValue,
  };
}

function baseNode({
  id,
  workPackage,
  nodeType,
  targetNode,
  nodeContract,
  provenanceValue,
}) {
  return {
    node_id: id,
    work_package_id: workPackage.work_package_id,
    work_package_revision: workPackage.work_package_revision,
    work_package_plan_digest: workPackage.work_package_plan_digest,
    node_type: nodeType,
    target_node: targetNode,
    priority: 0,
    execution_order: 0,
    entrypoint: false,
    terminal: false,
    dependencies: [],
    soft_dependencies: [],
    approval_dependencies: [],
    evidence_dependencies: [],
    validation_dependencies: [],
    resource_locks: [],
    module_locks: [],
    path_locks: [],
    node_contract: nodeContract,
    provenance: provenanceValue,
  };
}

function detectCycle(nodeIds, edges) {
  const adjacency = new Map(nodeIds.map((id) => [id, []]));
  const indegree = new Map(nodeIds.map((id) => [id, 0]));
  for (const edge of edges.filter(({ required }) => required)) {
    if (!adjacency.has(edge.from) || !adjacency.has(edge.to)) continue;
    adjacency.get(edge.from).push(edge.to);
    indegree.set(edge.to, indegree.get(edge.to) + 1);
  }
  const queue = [...nodeIds.filter((id) => indegree.get(id) === 0)].sort();
  const ordered = [];
  while (queue.length > 0) {
    const id = queue.shift();
    ordered.push(id);
    for (const next of adjacency.get(id).sort()) {
      indegree.set(next, indegree.get(next) - 1);
      if (indegree.get(next) === 0) {
        queue.push(next);
        queue.sort();
      }
    }
  }
  return {
    cycle: ordered.length !== nodeIds.length,
    ordered,
    cycleNodes: nodeIds.filter((id) => !ordered.includes(id)).sort(),
  };
}

export function analyzeGraph(nodes, edges) {
  const nodeIds = nodes.map(({ node_id }) => node_id);
  const known = new Set(nodeIds);
  const missingDependencies = edges
    .flatMap((edge) => [edge.from, edge.to])
    .filter((id) => !known.has(id));
  const cycle = detectCycle(nodeIds, edges);
  const incoming = new Map(nodeIds.map((id) => [id, 0]));
  const adjacency = new Map(nodeIds.map((id) => [id, []]));
  for (const edge of edges.filter(({ required }) => required)) {
    if (!known.has(edge.from) || !known.has(edge.to)) continue;
    incoming.set(edge.to, incoming.get(edge.to) + 1);
    adjacency.get(edge.from).push(edge.to);
  }
  const entrypoints = nodeIds.filter((id) => incoming.get(id) === 0).sort();
  const reachable = new Set();
  const queue = [...entrypoints];
  while (queue.length > 0) {
    const id = queue.shift();
    if (reachable.has(id)) continue;
    reachable.add(id);
    queue.push(...adjacency.get(id));
  }
  return {
    ...cycle,
    missingDependencies: sortedUnique(missingDependencies),
    entrypoints,
    orphanNodes: nodeIds.filter((id) => !reachable.has(id)).sort(),
  };
}

function buildLockAnalysis(repositoryUri, workNodes, itemByPackageId) {
  const requiredLocks = [];
  for (const workNode of workNodes) {
    const item = itemByPackageId.get(workNode.work_package_id);
    for (const path of item.workPackage.lock_requirements.paths) {
      const lockId = stableId(
        "L",
        repositoryUri,
        `${workNode.node_id}\nPATH\n${path}\nWRITE\nATTEMPT_END`,
      );
      requiredLocks.push({
        lock_id: lockId,
        node_id: workNode.node_id,
        lock_type: "PATH",
        resource: path,
        mode: "WRITE",
        scope: `work-package:${workNode.work_package_id}`,
        hold_until: "ATTEMPT_END",
      });
      workNode.resource_locks.push(lockId);
      workNode.path_locks.push(path);
    }
    workNode.module_locks = sortedUnique(
      item.workPackage.lock_requirements.modules,
    );
    workNode.resource_locks.sort();
    workNode.path_locks.sort();
  }
  const conflictPairs = [];
  const conflictResources = new Set();
  const workNodeIds = workNodes.map(({ node_id }) => node_id).sort();
  for (let leftIndex = 0; leftIndex < workNodes.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < workNodes.length;
      rightIndex += 1
    ) {
      const left = workNodes[leftIndex];
      const right = workNodes[rightIndex];
      let overlaps = false;
      for (const leftPath of left.path_locks) {
        for (const rightPath of right.path_locks) {
          if (!pathsOverlap(leftPath, rightPath)) continue;
          overlaps = true;
          conflictResources.add(
            leftPath === rightPath
              ? leftPath
              : [leftPath, rightPath].sort().join(" <> "),
          );
        }
      }
      if (overlaps) {
        conflictPairs.push([left.node_id, right.node_id].sort());
      }
    }
  }
  const serializedIds = new Set(conflictPairs.flat());
  const safeCandidates = workNodeIds.filter((id) => !serializedIds.has(id));
  return {
    required_locks: requiredLocks.sort((left, right) =>
      left.lock_id.localeCompare(right.lock_id),
    ),
    conflicts: [...conflictResources].sort(),
    safe_parallel_groups: safeCandidates.length > 1 ? [safeCandidates] : [],
    serialized_groups: conflictPairs.sort((left, right) =>
      left.join("\n").localeCompare(right.join("\n")),
    ),
    integration_hold_required: false,
  };
}

function assignGraphPositions(nodes, edges, analysis) {
  const order = new Map(analysis.ordered.map((id, index) => [id, index]));
  const incoming = new Map(nodes.map(({ node_id }) => [node_id, 0]));
  const outgoing = new Map(nodes.map(({ node_id }) => [node_id, 0]));
  for (const edge of edges.filter(({ required }) => required)) {
    incoming.set(edge.to, incoming.get(edge.to) + 1);
    outgoing.set(edge.from, outgoing.get(edge.from) + 1);
  }
  for (const node of nodes) {
    node.execution_order = order.get(node.node_id) ?? 0;
    node.entrypoint = incoming.get(node.node_id) === 0;
    node.terminal = outgoing.get(node.node_id) === 0;
    node.dependencies.sort();
    node.approval_dependencies.sort();
    node.evidence_dependencies.sort();
    node.validation_dependencies.sort();
  }
}

export function compileWorkGraph({
  items,
  completedWorkPackageIds,
  requirementSetDigest,
  workPackageSetDigest,
  inputSnapshot,
  repositoryUri,
}) {
  if (items.length === 0) {
    return {
      workgraph: null,
      lockAnalysis: {
        required_locks: [],
        conflicts: [],
        safe_parallel_groups: [],
        serialized_groups: [],
        integration_hold_required: false,
      },
    };
  }
  const graphId = stableId(
    "WG",
    repositoryUri,
    `${requirementSetDigest}\n${workPackageSetDigest}\n${inputSnapshot.policy.policy_version}`,
  );
  const workNodeByPackageId = new Map();
  const completionNodeByPackageId = new Map();
  const nodes = [];
  const edges = [];
  const itemByPackageId = new Map(
    items.map((item) => [item.workPackage.work_package_id, item]),
  );
  for (const item of items) {
    const workPackage = item.workPackage;
    const workId = nodeId(
      repositoryUri,
      graphId,
      workPackage.work_package_id,
      "WORK",
    );
    const reviewId = nodeId(
      repositoryUri,
      graphId,
      workPackage.work_package_id,
      "REVIEW",
      "owner-review",
    );
    const workNode = baseNode({
      id: workId,
      workPackage,
      nodeType: "WORK",
      targetNode: null,
      nodeContract: {},
      provenanceValue: provenance(
        workPackage,
        "objective",
        "AH-P1-01-WORK",
      ),
    });
    const reviewNode = baseNode({
      id: reviewId,
      workPackage,
      nodeType: "REVIEW",
      targetNode: workId,
      nodeContract: { check_id: "owner-review" },
      provenanceValue: provenance(
        workPackage,
        "required_checks",
        "AH-P1-01-REVIEW",
      ),
    });
    reviewNode.dependencies.push(workId);
    workNode.validation_dependencies.push(reviewId);
    nodes.push(workNode, reviewNode);
    workNodeByPackageId.set(workPackage.work_package_id, workNode);
    completionNodeByPackageId.set(workPackage.work_package_id, reviewNode);
    edges.push(
      requiredEdge({
        repositoryUri,
        from: workId,
        to: reviewId,
        type: "VALIDATES",
        condition: "SUCCESS",
        targetNode: workId,
        provenanceValue: reviewNode.provenance,
      }),
    );
    if (item.gate.gate === "BLOCKED_OWNER") {
      const approval = workPackage.human_approval.execution;
      const approvalId = nodeId(
        repositoryUri,
        graphId,
        workPackage.work_package_id,
        "HUMAN_APPROVAL",
        approval.approval_record_id,
      );
      const approvalNode = baseNode({
        id: approvalId,
        workPackage,
        nodeType: "HUMAN_APPROVAL",
        targetNode: workId,
        nodeContract: {
          approval_record_id: approval.approval_record_id,
          approval_type: approval.approval_type,
        },
        provenanceValue: provenance(
          workPackage,
          "human_approval.execution",
          "AH-P1-01-OWNER-GATE",
        ),
      });
      workNode.approval_dependencies.push(approvalId);
      nodes.push(approvalNode);
      edges.push(
        requiredEdge({
          repositoryUri,
          from: approvalId,
          to: workId,
          type: "APPROVES",
          condition: "GRANTED",
          targetNode: workId,
          provenanceValue: approvalNode.provenance,
        }),
      );
    }
    if (workPackage.external_evidence_gate.blocks_execution) {
      const evidenceId = stableId(
        "EV",
        repositoryUri,
        `${workPackage.work_package_id}\nexternal-evidence`,
      );
      const evidenceNodeId = nodeId(
        repositoryUri,
        graphId,
        workPackage.work_package_id,
        "EVIDENCE",
        evidenceId,
      );
      const evidenceNode = baseNode({
        id: evidenceNodeId,
        workPackage,
        nodeType: "EVIDENCE",
        targetNode: workId,
        nodeContract: { evidence_id: evidenceId },
        provenanceValue: provenance(
          workPackage,
          "external_evidence_gate",
          "AH-P1-01-EVIDENCE-GATE",
        ),
      });
      workNode.evidence_dependencies.push(evidenceNodeId);
      nodes.push(evidenceNode);
      edges.push(
        requiredEdge({
          repositoryUri,
          from: evidenceNodeId,
          to: workId,
          type: "PRODUCES_EVIDENCE_FOR",
          condition: "ACCEPTED",
          targetNode: workId,
          provenanceValue: evidenceNode.provenance,
        }),
      );
    }
  }
  for (const item of items) {
    const childNode = workNodeByPackageId.get(item.workPackage.work_package_id);
    for (const dependencyId of item.workPackage.dependencies) {
      if (completedWorkPackageIds.includes(dependencyId)) continue;
      const parentNode = completionNodeByPackageId.get(dependencyId);
      if (!parentNode) {
        failPlanner({
          repositoryUri,
          code: "DRP_GRAPH_DEPENDENCY_MISSING",
          message: `Work Package ${item.workPackage.work_package_id} has a missing dependency`,
          details: {
            field: "dependencies",
            expected: "compiled or completed Work Package",
            actual: dependencyId,
            related_ids: [item.workPackage.work_package_id, dependencyId],
          },
        });
      }
      childNode.dependencies.push(parentNode.node_id);
      edges.push(
        requiredEdge({
          repositoryUri,
          from: parentNode.node_id,
          to: childNode.node_id,
          type: "REQUIRES",
          condition: "COMPLETED",
          targetNode: parentNode.node_id,
          provenanceValue: provenance(
            item.workPackage,
            "dependencies",
            "AH-P1-01-HARD-DEPENDENCY",
          ),
        }),
      );
    }
  }
  const analysis = analyzeGraph(nodes, edges);
  if (analysis.cycle) {
    failPlanner({
      repositoryUri,
      code: "DRP_GRAPH_HARD_CYCLE",
      message: "WorkGraph contains a hard dependency cycle",
      details: {
        field: "edges",
        expected: "acyclic graph",
        actual: "cycle",
        related_ids: analysis.cycleNodes,
      },
    });
  }
  if (analysis.missingDependencies.length > 0) {
    failPlanner({
      repositoryUri,
      code: "DRP_GRAPH_DEPENDENCY_MISSING",
      message: "WorkGraph references a missing Node",
      details: {
        field: "edges",
        expected: "known Node IDs",
        actual: analysis.missingDependencies.join(","),
        related_ids: analysis.missingDependencies,
      },
    });
  }
  if (analysis.orphanNodes.length > 0) {
    failPlanner({
      repositoryUri,
      code: "DRP_GRAPH_ORPHAN_NODE",
      message: "WorkGraph contains an unreachable Node",
      details: {
        field: "nodes",
        expected: "reachable from an entrypoint",
        actual: analysis.orphanNodes.join(","),
        related_ids: analysis.orphanNodes,
      },
    });
  }
  assignGraphPositions(nodes, edges, analysis);
  const workNodes = [...workNodeByPackageId.values()];
  const lockAnalysis = buildLockAnalysis(
    repositoryUri,
    workNodes,
    itemByPackageId,
  );
  const blocked = items.some(({ gate }) => gate.gate !== "READY");
  const workgraph = {
    schema_id:
      "https://github.com/woojinhong/metabus_social/schemas/automation/workgraph.schema.json",
    schema_version: "1.0.0",
    record_kind: "CANONICAL_WORKGRAPH_PLAN",
    graph_id: graphId,
    graph_revision: 1,
    title: `Read-only plan for ${inputSnapshot.planning_scope.workstream}`,
    source_snapshot: {
      repository: repositoryUri,
      repository_sha: inputSnapshot.repository.repository_sha,
      requirement_set_digest: requirementSetDigest,
      work_package_set_digest: workPackageSetDigest,
      policy_version: inputSnapshot.policy.policy_version,
    },
    graph_status: blocked ? "BLOCKED" : "PROPOSED",
    entrypoints: nodes
      .filter(({ entrypoint }) => entrypoint)
      .map(({ node_id }) => node_id)
      .sort(),
    nodes: nodes.sort((left, right) => left.node_id.localeCompare(right.node_id)),
    edges: edges.sort((left, right) => left.edge_id.localeCompare(right.edge_id)),
    graph_policy: {
      max_nodes: inputSnapshot.policy.max_graph_nodes,
      max_parallel_nodes: inputSnapshot.policy.max_parallel_nodes,
      max_parallel_write_nodes: 1,
      failure_strategy: "BLOCK_DESCENDANTS",
      cancellation_strategy: "BLOCK_DESCENDANTS",
      stale_strategy: "REPLAN_REQUIRED",
    },
    validation_result: {
      planner_status: blocked ? "BLOCKED" : "READY_FOR_OWNER_REVIEW",
      findings: [],
    },
    workgraph_plan_digest:
      "sha256:0000000000000000000000000000000000000000000000000000000000000000",
    created_at: inputSnapshot.existing_state.snapshot.as_of,
    generated_by: "ah-p1-01-planner@1.0.0",
  };
  if (workgraph.nodes.length > inputSnapshot.policy.max_graph_nodes) {
    failPlanner({
      repositoryUri,
      code: "DRP_LIMIT_EXCEEDED",
      message: "WorkGraph exceeds the approved Node limit",
      details: {
        field: "nodes",
        expected: inputSnapshot.policy.max_graph_nodes,
        actual: workgraph.nodes.length,
        related_ids: workgraph.nodes.map(({ node_id }) => node_id),
      },
    });
  }
  workgraph.workgraph_plan_digest = digestRecord(workgraph, schemas.workgraph);
  canonicalRecordBytes(workgraph, {
    schema: schemas.workgraph,
    registry: schemaRegistry,
  });
  return { workgraph, lockAnalysis };
}
