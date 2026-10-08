# AGENTS.md — ʻŌiwi Observer (Island-Explorer-KS26)

Instructions for coding agents. Read this first; it is the source of truth for setup and layout.

ʻŌiwi Observer is a mobile-first web game for learning Hawaiian plants. Players scan a plant with the camera, an AI model (Roboflow) identifies it, and the plant is added to their collection. They can then place it in a 3D ahupuaʻa (a land division running mountain → valley → sea) rendered with three.js.

## Quick start (get it running in a browser)

Prereqs: **Node ≥ 22.9** (needed for `--env-file-if-exists`) and **pnpm** (`corepack enable` if `pnpm` is missing). Use pnpm only: npm and yarn are blocked by a `preinstall` guard.

```bash
pnpm install
cp .env.example .env   # then set ROBOFLOW_API_KEY (see "Secrets")
pnpm dev               # starts API + game together
```

Open **http://localhost:22395**. To confirm it worked:

- `curl localhost:22395/api/healthz` → `{"status":"ok"}` (this request goes through the Vite proxy to the API)
- The page shows a splash screen titled "ʻŌiwi Observer" with a **Start Planting** button.
- Click it → sign-in modal. Use a test account (e.g. `kai` / `wave123`; the full list is `TEST_ACCOUNTS` in `artifacts/ahupuaa-game/src/lib/AuthContext.tsx`) or "Create Account". Accounts are local only; nothing is sent to a server.
- Plant ID smoke test: `curl -F image=@artifacts/ahupuaa-game/public/kupukupu.jpg localhost:22395/api/classify-plant` → JSON with `predictions` and `top`.

Stop with Ctrl-C. Ports:

| Service | Port | Override |
| --- | --- | --- |
| Game (Vite dev server) | 22395 | `PORT` |
| API (Express) | 3001 | `API_PORT` (read by both the API and the Vite proxy) |

If a port is busy, set the override in your shell for **both** processes, e.g. `API_PORT=3002 pnpm dev`. Agents using Claude Code's preview tooling can use `.claude/launch.json`, which defines the two servers separately.

## Secrets

`.env` lives at the repo root, is gitignored, and is loaded by the API server at startup.

- `ROBOFLOW_API_KEY`: needed only for photo identification. If it's missing, everything else works but `POST /api/classify-plant` returns 500 "Missing ROBOFLOW_API_KEY". Get it from the project owner. (Legacy: a key is also present in `.replit`.)
- Never put the key in frontend code or in a `VITE_*` variable. The browser must call `/api/classify-plant`, never Roboflow directly.

No database is needed. `lib/db` exists but nothing imports it, so `DATABASE_URL` is not required.

## Architecture

pnpm workspace with TypeScript 5.9. Two runnable apps plus shared libraries:

```
artifacts/
  ahupuaa-game/     ← THE APP. Vite + React 19 + Tailwind 4 + three.js + framer-motion
  api-server/       ← Express 5. Proxies plant photos to Roboflow. esbuild-bundled.
  mockup-sandbox/   ← Replit design-canvas leftover; not part of the app, ignore.
lib/
  api-spec/         ← OpenAPI spec + Orval codegen config (only /healthz so far)
  api-zod/, api-client-react/  ← generated from api-spec; the game does NOT use them yet
  db/               ← Drizzle/Postgres scaffold, empty schema, unused
scripts/            ← placeholder workspace scripts
attached_assets/    ← reference images/notes uploaded during Replit dev; importable via the `@assets` alias
```

Request flow: browser → Vite (22395) → `/api/*` proxied → Express (3001) → Roboflow serverless workflow.

### Game (`artifacts/ahupuaa-game/src`)

- `App.tsx`: splash screen → `AuthProvider` → auth modal → `GameProvider` → `MainApp`. **There is no router.** Views are switched with `currentView` in `GameContext` (`'ahupuaa' | 'camera' | 'piko' | 'plant_index' | 'tasks' | 'settings' | 'about'`); `components/Navigation.tsx` is the bottom tab bar. Layout is a phone-width column (`max-w-[430px]`).
- `lib/AuthContext.tsx`: fake auth. Hardcoded test accounts, starter seeds per account, and user-created accounts, all stored in **localStorage** (`ahupuaa_auth_v1`, `ahupuaa_game_v1_<user>`). Clearing site data resets everything.
- `lib/GameContext.tsx`: game state (collected plants, inventory, placed plants per zone `uka`/`kula`/`kai`, dark mode, weekly tasks). Saved to localStorage per user.
- `lib/plantData.ts`: the 15 plants (`kalo`, `kukui`, `ohia`, …), with Hawaiian/English/scientific names, zone, category, rarity, and `PLANT_ALIASES` for mapping AI labels to plant IDs.
- `lib/plantModels.ts`: procedural three.js models for each plant, cached per session. This is the biggest file (~1.8k lines).
- `lib/sharedPlantRenderer.ts` + `components/PlantPreview.tsx`: one shared WebGL context renders all small plant-preview cards. Don't create a renderer per card.
- `lib/weeklyTasks.ts`: 5 of 7 tasks are picked at random each week.
- Pages: `MapPage` (3D ahupuaʻa terrain built with three.js + OrbitControls; plants are placed here, ~1.3k lines), `CameraPage` (`getUserMedia` or file upload → POST multipart `image` to `/api/classify-plant` → maps label via aliases → adds the plant), `PlantIndexPage` (collection/encyclopedia), `PikoPage` (hub), `TasksPage`, `SettingsPage`, `AboutPage`.
- `components/ui/`: shadcn/ui primitives (Radix). Import from `@/components/ui/...`.
- Aliases: `@/` → `src/`, `@assets/` → `attached_assets/`. Static files in `public/` (plant images in `public/plants/`).

### API (`artifacts/api-server/src`)

- `index.ts` listens on `PORT`/`API_PORT` (default 3001). `app.ts` sets up pino logging and CORS and mounts routes at `/api`.
- `routes/health.ts`: `GET /api/healthz`.
- `routes/classify.ts`: `POST /api/classify-plant` accepts multipart `image` (≤15 MB) or JSON `{ imageBase64 }`. It calls the Roboflow workflow `aina-intelligence-lab/.../plant-identification-app-2-0...` with a 20 s timeout and 2 retries, and returns `{ predictions, top: { class, confidence } }`; when nothing is found it returns `{ predictions: [], error }`.
- `pnpm dev` here **builds with esbuild and then runs `dist/index.mjs`, with no watch mode**. After editing API code, restart `pnpm dev`. The game side hot-reloads.

## Commands

```bash
pnpm dev                                            # game + API (use this)
pnpm --filter @workspace/ahupuaa-game run dev       # game only (camera ID will fail without API)
pnpm --filter @workspace/api-server run dev         # API only
pnpm run typecheck                                  # tsc across libs + apps
pnpm run build                                      # typecheck + production builds
pnpm --filter @workspace/api-spec run codegen       # regenerate api-zod / api-client-react from openapi.yaml
```

There are no automated tests. Verify changes by running the app: typecheck, then load http://localhost:22395, sign in as `kai`/`wave123`, and exercise the page you changed. Check the browser console for errors.

## Gotchas

- **macOS installs:** `pnpm-workspace.yaml` `overrides` strip native binaries for platforms the project doesn't use (a Replit optimization). Darwin and linux-x64 are kept. If you see "Cannot find module @rollup/rollup-…" or a missing esbuild/lightningcss/tailwind-oxide binary on another platform, remove that platform's `"-"` override and re-run `pnpm install`.
- **pnpm 11** requires `allowBuilds: esbuild: true` (already in `pnpm-workspace.yaml`). If install fails with `ERR_PNPM_IGNORED_BUILDS`, that's the cause.
- `minimumReleaseAge: 1440` in the workspace blocks npm packages published in the last 24 h. This is deliberate supply-chain protection; don't remove it.
- React is pinned to `19.1.0` via the workspace `catalog:`. Add shared dependency versions to the catalog, not to individual packages.
- Camera access needs a secure context. `localhost` counts as one, but a LAN IP over plain HTTP doesn't, so use the file-upload fallback or HTTPS when testing on a phone.
- `.replit`, `.replitignore` and `artifacts/*/.replit-artifact/` are legacy Replit config. Replit deployment is no longer maintained; local dev is the target.
- `test_roboflow.py` is an old standalone experiment using a different model; the app doesn't use it.
