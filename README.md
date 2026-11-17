# AI Video Studio

Prompt-driven video production studio. M1 establishes a reproducible browser preview and cloud MP4 render pipeline.

## M1 — Render Engine Foundation

- React + Vite studio shell
- Remotion composition and 10-second demo
- GitHub Actions CI and manual render workflow
- MP4 uploaded as a short-lived Actions artifact

## Requirements

Node.js 22+ and npm.

```bash
npm install
npm run dev
npm run typecheck
npm test
npm run validate:demo
```

## Render locally

```bash
npm run render
```

For cloud rendering, open **Actions → Render video → Run workflow**. The resulting MP4 is available under the run's Artifacts.

## Cost controls

Renders are manual, limited to 30 minutes, and artifacts expire after 3 days. Video files are not committed to Git.
