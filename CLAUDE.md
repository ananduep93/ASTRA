# ASTRA 2027 (Design B: "The Issue")
Inter-college arts & tech fest, Don Bosco College, Mampetta. Built by a student (Anandu) who is learning: explain unfamiliar terms briefly. Windows laptop (Ryzen 9, RTX 4060, 16 GB RAM), tested on a real Android phone.

This branch (design-b) is a SEPARATE design from design-a ("The Constellation"). Never copy Design A's visuals, 3D canvas or dot effects, and never modify the design-a branch from here.

## Concept: "The Issue"
The website is a comic issue called ASTRA #2027. One continuous issue from the first screen: cover, opening page, five chapters (Arts, Tech, Gaming, Business, Fun), finale. No separate sections, no intro or loader screen: the cover is the first thing visible. Text and motion share one paced scene progress and one easing set. Every page turn, wipe and zoom has to feel excellent.

## Look
- Paper #F6F4EF background, ink #0A0A0A, ONE red accent. No other colours. All values defined once in lib/theme.js.
- Red only for spot highlights (bursts, a word, a marker), never for body text.
- Thick ink outlines (3-4px), panel gutters, halftone dot shading (CSS radial-gradient or SVG pattern), slight paper grain.
- Two fonts: Bricolage Grotesque (heavy display) and Courier Prime (typewriter mono for captions). No cartoon fonts, no condensed face from Design A.
- The brief above wins over any generic design defaults from the frontend-design skill.

## Theme rules
- Comic mood only, with original generic devices: panel borders, caption boxes, speech bubbles, invented sound words ("WHOOSH", "THUD").
- NEVER use Marvel/Avengers (or any publisher's) names, logos, characters, panel layouts, art, quotes or catchphrases.
- Use words like squad, mission, roster, briefing, issue, chapter. Five original squads: Arts, Tech, Gaming, Business, Fun.

## Stack
Next.js (App Router), Tailwind, GSAP + ScrollTrigger, Lenis. DOM, SVG and CSS only: no WebGL, no three.js. No other animation libraries without asking.

## Motion rules
- One shared motion config (lib/motion.js: easings, durations, staggers, pacing). Every animation uses it.
- DOM animation: transform, opacity, clip-path only. No scroll hijacking: the page scrolls natively; only scene playback is paced (speed limiter in lib/motion.js). Max two pinned sections.
- Panels reveal with skewed clip-path wipes from the gutters. Text reveals are state-based (never resting half-clipped).
- "Zoom into a panel" between scenes: one panel scales to fill the screen and becomes the next page.
- prefers-reduced-motion: no wipes, simple fades, no pacing.
- Low-end devices: the same page with fewer animations, never a different design.
- Mobile scroll multiplier 1.2. Test at 360px and on a real phone. No hydration warnings, horizontal scroll or console errors. Text at least 14px, tap targets at least 44px. No hover effects.
- Use Context7 for current GSAP, Lenis and Next.js docs. Use Playwright to check work at 360px and 1280px, and Chrome DevTools for performance.

## Data and safety
- 15 programs live in /data/programs.js. Mark every unconfirmed detail (dates, fees, venues, rules) as TBA. Never invent facts.
- Preserve working routes, registration and any backend. Ask before major architecture changes.
- Validate all form input. No secrets in the repo.

## How to work
- Git checkpoint before each phase. Explain the plan before editing files.
- Never claim something is done unless you ran and tested it. Report: done / partial / not done.
- No destructive changes without explaining the consequences first.
- Never paste purchased or third-party component code as is. Adapt it to our motion config and palette.
