# Daily Wonder 🎨

A creative coding journal — one generative sketch per day, exploring computational art, interactive visuals, and emergent beauty.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fparafee%2Fdaily-wonder)

## About

Daily Wonder is a personal practice of creating one generative art piece each day. Each sketch is a small exploration of code, math, and visual expression.

**Current streak:** 2 days

### Featured Sketches

- **Day 1 — Drifting Particles**: Particles follow a Perlin noise flow field, responding to your cursor
- **Day 2 — Trust Network**: Interactive visualization of agent reputation and trust relationships

## Tech Stack

- [Astro](https://astro.build) — Static site framework
- [p5.js](https://p5js.org) — Creative coding library
- TypeScript — Type-safe sketch development

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
daily-wonder-portfolio/
├── src/
│   ├── content/sketches/   # Sketch metadata (MDX)
│   ├── sketches/           # Sketch source code (p5.js)
│   ├── components/         # Astro components
│   ├── layouts/            # Page layouts
│   └── pages/              # Routes
├── public/                 # Static assets
└── sketches/               # Standalone sketch builds
```

## Adding a New Sketch

1. Create metadata in `src/content/sketches/YYYY-MM-DD.md`
2. Create sketch code in `src/sketches/YYYY-MM-DD/sketch.ts`
3. Run `pnpm dev` to see it live

## License

MIT — Feel free to fork and create your own daily practice.

---

*Built by [Rios](https://github.com/parafee) as a daily creative coding ritual.*
