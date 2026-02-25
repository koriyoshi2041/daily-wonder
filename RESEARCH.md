# Daily Wonder Portfolio - Research

## 1. Creative Developer Portfolio Patterns

### Common Organization Forms

| Form | Description | Best For |
|------|-------------|----------|
| **Gallery Grid** | Responsive grid with thumbnails, hover reveals metadata, click to interact | Large volume of works (365 pieces) |
| **Timeline** | Chronological display, shows accumulation over time | Daily practice narrative |
| **Category/Theme** | Grouped by technique or concept (shaders, particles, typography...) | Diverse media types |
| **Immersive Experience** | The portfolio itself is the demo (Bruno Simon's 3D car world) | Maximum impact |
| **Calendar Grid** | One cell per day, visual density | Challenge-based projects |
| **Blog/Journal** | Dated entries with embedded visuals + process notes | Process-focused documentation |

### Key Design Principles (from Awwwards Research)

**Typography**: Bold sans-serif headers + readable body. Title:body ratio up to 1:200. Negative letter-spacing on large titles (-0.02em to -0.05em).

**Color**: Deep dark themes (#0a0a0a, #111111) with bright accents dominate award-winning sites. 2-color palettes are preferred.

**Whitespace**: Golden ratio system with 8px base (8, 16, 32, 64, 128, 256+). "One-screen-one-idea" principle.

**Animation Sequencing**: Background (0ms) -> Logo (100ms) -> Title (300ms) -> Subtitle (500ms) -> CTA (700ms).

**Hover Effects**: Magnetic buttons, image reveal via clip-path, custom dual-cursor system (slow circle + fast dot), 3D tilt cards.

### Notable Portfolio References

| Creator | Approach | Key Takeaway |
|---------|----------|--------------|
| **Bruno Simon** | 3D game-world portfolio (Three.js) | The portfolio IS the demo |
| **Zach Lieberman** | 10+ years of daily sketches, Instagram as primary venue | Accumulation effect turns daily outputs into exhibition-worthy work |
| **Matt DesLauriers** | Clean project-focused site + separate shop for prints | Bridges code art and fine art commerce |
| **Yuri Artiukh (Akella)** | YouTube live-coding + Codrops demos | Educational content as portfolio strategy |

---

## 2. Daily Creative Coding Project References

### Major Challenges

**Genuary** (genuary.art) - January, 31 prompts
- Largest active creative coding challenge
- Participants share via #genuary + #genuary2026 on Bluesky/X/Instagram
- p5.js dominates submissions
- Prompts range from conceptual ("One color, one shape") to technical ("Shaders only")

**Codevember** - November, 30 prompts
- Single-word daily prompts
- CodePen was primary venue
- Matt DesLauriers built custom showcase at mattdesl.github.io/codevember with screenshots + interactive links per day
- His advice: iterate on existing ideas, avoid unnecessary polish, leverage personal code libraries

**36 Days of Type** - 36 days (26 letters + 10 digits)
- Instagram-primary (#36daysoftype, #36days_A etc.)
- Many use code for generative typography (Three.js, p5.js, shaders)

**Inktober (digital)** - October
- "Divtober" variant: CSS art with single `<div>` elements
- Processing/p5.js interpretations of prompts

### How Daily Projects Get Organized

1. **GitHub repo per challenge** - e.g. `ronikaufman/genuary2024`, one folder per day
2. **Custom showcase site** - screenshots + links (Matt DesLauriers' approach)
3. **Social media timeline** - Instagram/Bluesky as living portfolio
4. **OpenProcessing collection** - all sketches in one place with live previews
5. **Blog retrospective** - post-challenge writeup with curated highlights

### Key Insight: The Accumulation Effect

Zach Lieberman's 10+ years of daily sketches became gallery exhibitions. The consistency of daily practice produces something "far more profound than the sum of its daily outputs." This is the core narrative of Daily Wonder.

---

## 3. Showcase Platforms Landscape

| Platform | Focus | Notes |
|----------|-------|-------|
| **OpenProcessing** | p5.js sketches | 1M+ projects, live preview, fork/remix |
| **Shadertoy** | GLSL shaders | 80K+ shaders, real-time rendering |
| **CodePen** | HTML/CSS/JS | Browser editor, social features, collections |
| **fxhash** | Generative art (Tezos) | Mint-on-demand generative art |
| **Art Blocks** | Generative art (Ethereum) | Premier platform, $1.36B total sales |
| **Dwitter** | Micro JS demos | 140-character JavaScript art |
| **twigl.app** | One-tweet shaders | GIF generator, sound shaders |
| **NEORT** | Digital art | Creative coder focused |
| **Turtletoy** | Pen-plotter style | Minimalist API |

**Strategy**: Use platforms for discovery (hashtags, community), personal site for permanence.

---

## 4. Technical Stack Recommendation

### Creative Coding Libraries

| Library | Use For | Daily Driver? |
|---------|---------|---------------|
| **p5.js** | 2D sketches, rapid prototyping, most daily work | Yes - primary |
| **Three.js** | 3D scenes, immersive pieces | Dedicated 3D days |
| **Raw Canvas** | Performance-critical pieces | When p5.js is too slow |
| **GLSL Shaders** | Visual effects, via p5.js WEBGL or Three.js | Gradual integration |
| **GSAP** | SVG animation, scroll-driven, typography | Motion-focused days |
| **D3.js** | Data-driven visualization art | Data sketch days |
| **Pixi.js** | High-performance 2D (WebGL-backed) | When p5.js can't keep up |

**p5.js as daily driver rationale**: Lowest barrier, fastest iteration, huge community (OpenProcessing, Genuary). `setup()` + `draw()` loop gets you rendering immediately. Sufficient for 80% of sketch ideas.

**Three.js for 3D days**: Full scene graph, cameras, lights, materials, post-processing. Now supports WebGPU via TSL. React Three Fiber available if using React.

**Shader integration**: GLSL can be used inside p5.js (WEBGL mode), Three.js (ShaderMaterial), or standalone. Learn gradually, use for "shader day" sketches.

### Site Framework: Astro

**Why Astro wins for this project**:

1. **Zero JS by default** - Gallery of 365 thumbnails loads as pure HTML/CSS
2. **Island Architecture** - Each sketch is an independent interactive island, hydrates only when visible via `client:visible`
3. **Framework agnostic** - Use React (for R3F), Svelte, vanilla JS, or raw `<script>` tags for p5.js. Not locked to one ecosystem
4. **Content Collections** - Built for hundreds of entries with metadata (date, title, tags, tools, thumbnail) in frontmatter
5. **Performance** - Static sites load under 500ms, 40-70% lower LCP than Next.js

**Alternatives considered**:
- Next.js: Overkill, ships too much JS for content-first portfolio
- SvelteKit: Good DX but smaller ecosystem
- Vanilla HTML: No code sharing, no content management at scale

### Deployment: Cloudflare Pages

**Why Cloudflare Pages**:
- 300+ edge locations (vs Vercel's 100+)
- Free tier with no bandwidth limits (critical for JS-heavy sketch bundles)
- No surprise bills (Vercel users have reported $2K+/month surprises)
- WebGL/Canvas sites are entirely client-side, need fast CDN not SSR

**Alternatives**:
- GitHub Pages: Simplest, but no preview deployments
- Vercel: Best for Next.js, overkill for static
- Netlify: Solid but slower edge network

---

## 5. Recommended Project Structure

```
daily-wonder-portfolio/
  src/
    content/
      config.ts                        # Content collection schema
      sketches/
        2026-02-25-first-wonder.md     # Frontmatter: date, title, tags, tools, thumbnail
        2026-02-26-flow-fields.md
        ...
    components/
      SketchEmbed.astro                # Wrapper for embedding sketches
      SketchGallery.astro              # Grid gallery with lazy thumbnails
      SketchCard.astro                 # Individual thumbnail card
      SketchNav.astro                  # Previous/next navigation
    layouts/
      BaseLayout.astro                 # Global layout (nav, footer, meta)
      SketchLayout.astro               # Individual sketch page layout
      GalleryLayout.astro              # Gallery/archive page layout
    pages/
      index.astro                      # Home - latest works or featured
      archive.astro                    # Full gallery (paginated)
      sketches/
        [...slug].astro                # Dynamic sketch pages
    styles/
      global.css                       # CSS variables, typography, colors
    lib/
      shared/
        math.ts                        # Vector math, noise, random, mapping
        color.ts                       # Palettes, HSL/RGB conversion, lerp
        canvas.ts                      # Canvas setup, DPI scaling, RAF loop
        p5-utils.ts                    # p5.js helpers
  sketches/                            # Actual sketch source code (standalone modules)
    2026-02-25/
      index.ts
      sketch.ts
    2026-02-26/
      index.ts
      sketch.ts
  public/
    thumbnails/                        # Preview images (WebP, 400x400)
      2026-02-25.webp
      2026-02-26.webp
    og/                                # Social sharing images (1200x630)
  astro.config.mjs
  package.json
  tsconfig.json
```

### Content Collection Schema

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content'

const sketches = defineCollection({
  type: 'content',
  schema: z.object({
    title: string(),
    date: z.date(),
    day: z.number(),              // Day number (1-365)
    tags: z.array(z.string()),    // ['generative', 'particles', 'noise']
    tools: z.array(z.string()),   // ['p5.js', 'GLSL']
    thumbnail: z.string(),
    description: z.string().optional(),
    featured: z.boolean().default(false),
    interactive: z.boolean().default(true),
  })
})

export const collections = { sketches }
```

### Shared Library Strategy

Grow organically - extract only after writing the same pattern 2-3 times:

- **Week 1-4**: Write sketches directly, copy-paste utilities as needed
- **Month 2+**: Extract recurring patterns into `src/lib/shared/`
- Common extractions: noise functions, color palettes, easing, canvas boilerplate, seeded random

---

## 6. Performance Architecture

### Gallery Page Performance

1. **Never render sketches on the gallery page** - Show static thumbnails only
2. **Native lazy loading** - `<img loading="lazy">` for all thumbnails
3. **WebP format** - 30-50% smaller than PNG at same quality
4. **Pagination** - Show 30-50 items per page, or virtual scrolling for archive
5. **Astro's `<Image>` component** - Handles responsive sizing and format negotiation

### Individual Sketch Pages

1. **`client:visible`** - Sketch island hydrates only when scrolled into view
2. **Per-sketch code splitting** - Each sketch is a separate JS module
3. **Library-level splitting** - p5.js sketches never load Three.js and vice versa
4. **RAF discipline** - Cancel animation loop on page navigation and when canvas leaves viewport
5. **GPU cleanup** - Dispose Three.js geometries/materials/textures on unmount

### Thumbnail Pipeline

**Phase 1 (Day 1-30)**: Manual capture
- Press a key in sketch to trigger `canvas.toDataURL('image/webp')`
- Save to `public/thumbnails/`

**Phase 2 (Month 2+)**: Automated via Playwright
- Build script opens each sketch in headless browser
- Waits for first frame, captures screenshot
- Generates WebP at 400x400 (gallery) and 1200x630 (OG image)
- For WebGL: set `preserveDrawingBuffer: true` during capture

---

## 7. Implementation Roadmap

### Phase 1: Foundation
- Set up Astro project with content collections
- Create base layouts and gallery component
- Build first 7 sketches (p5.js focus)
- Deploy to Cloudflare Pages
- Manual thumbnail capture

### Phase 2: Expand
- Add Three.js support for 3D days
- Build shared utility library from recurring patterns
- Implement previous/next navigation
- Add tag filtering to gallery
- Start shader experiments

### Phase 3: Polish
- Automate thumbnail pipeline
- Add OG image generation
- Implement search/filter
- Add process blog posts alongside sketches
- Performance audit

### Phase 4: Evolve
- Calendar view option
- Featured/curated collection
- Print shop integration (if desired)
- Cross-post automation to social platforms

---

## Sources

### Portfolio & Design
- Awwwards Lab research (local: awwwards-lab/)
- [Webflow Portfolio Best Practices](https://webflow.com/blog/design-portfolio-examples)
- [Muzli Top 100 Portfolios 2025](https://muz.li/blog/top-100-most-creative-and-unique-portfolio-websites-of-2025/)
- [Bruno Simon Portfolio Case Study](https://www.casestudy.club/case-studies/bruno-simon-a-portfolio-case-study)

### Daily Creative Coding
- [Genuary 2026](https://genuary.art/)
- [Matt DesLauriers' Codevember](https://mattdesl.svbtle.com/codevember)
- [36 Days of Type](https://www.36daysoftype.com/)
- [Zach Lieberman 10 Years of Daily Sketches](https://nguyenwahed.com/exhibitions/33-10-years-of-daily-sketches-zach-lieberman-london/overview/)
- [Awesome Creative Coding](https://github.com/terkelg/awesome-creative-coding)

### Technical
- [Astro Islands Architecture](https://docs.astro.build/en/concepts/islands/)
- [Next.js vs Astro vs SvelteKit 2025](https://medium.com/better-dev-nextjs-react/next-js-vs-remix-vs-astro-vs-sveltekit-the-2025-showdown-9ee0fe140033)
- [Vercel vs Netlify vs Cloudflare Pages](https://www.digitalapplied.com/blog/vercel-vs-netlify-vs-cloudflare-pages-comparison)
- [Three.js Portfolio Examples 2025](https://www.creativedevjobs.com/blog/best-threejs-portfolio-examples-2025)
- [p5.js vs Canvas](https://davidmatthew.ie/p5js-vs-html-canvas/)
- [Faster WebGL with OffscreenCanvas](https://evilmartians.com/chronicles/faster-webgl-three-js-3d-graphics-with-offscreencanvas-and-web-workers)
- [OpenProcessing](https://openprocessing.org/)
- [Shadertoy](https://www.shadertoy.com/)
