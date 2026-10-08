# ʻŌiwi Observer

A mobile-first web game for learning Hawaiian plants: scan a plant, identify it with AI, collect it, and grow your own 3D ahupuaʻa.

## Run it

```bash
pnpm install
cp .env.example .env   # add ROBOFLOW_API_KEY for photo identification
pnpm dev
```

Then open http://localhost:22395 and sign in with a test account such as `kai` / `wave123`.

Requires Node ≥ 22.9 and pnpm. See [AGENTS.md](AGENTS.md) for architecture, commands and gotchas. It's written for coding agents and humans alike.
