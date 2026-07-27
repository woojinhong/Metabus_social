# Propscans low-fidelity UX mock

This isolated React/Vite project is only for validating the D-024-approved UX.

- Synthetic data and abstract media placeholders only.
- Local in-memory state only; refreshing intentionally resets the mock.
- No API, authentication, NICE, SMS, LiveKit, microphone capture, database,
  object storage, analytics, upload, operator system or report submission.
- No production route, DTO, component, state, event or authorization contract.
- No accessibility certification claim. Manual assistive-technology and
  real-device evidence is still required.
- This prototype is disposable and expected to be deleted or replaced.

Run:

```text
npm install
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
npm run e2e
```

The scenario switcher is a reviewer tool, not a product feature. Screenshots
under `artifacts/screenshots/` contain only generated placeholders.
