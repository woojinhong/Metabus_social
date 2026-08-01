$RunnerArgs = @(
  '--execute-patch-only',
  '--real-codex-worker',
  '--worker-sandbox', 'workspace-write',
  '--worker-approval', 'never',
  '--require-effective-sandbox-probe'
)
