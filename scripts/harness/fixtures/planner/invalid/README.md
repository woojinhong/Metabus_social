# Invalid Planner fixture scenarios

`planner.test.mjs` derives invalid records from the Owner-pinned fixture factory
so every test changes exactly one boundary: Candidate input, missing approval
lineage, stale repository SHA, unknown field, digest mismatch, or hard cycle.
