# ASTRA 2027
Inter-college arts & tech fest, Don Bosco College, Mampetta. Built by a student (Anandu) who is learning: explain unfamiliar terms briefly. Windows laptop (Ryzen 9, RTX 4060, 16 GB RAM), tested on a real Android phone.

## Concept: "The Constellation"
One continuous scroll story from first screen to footer. One fixed 3D canvas behind the whole site; scroll moves the camera and changes the scene. No separate "sections" and no separate intro screen. Page text and 3D share one scroll value and one easing set. The flow must feel seamless: every transition, animation and scroll effect has to be excellent.

## Look
- Black #0A0A0A and white #FAFAFA, inverting as you scroll.
- ONE red accent (value defined once in the theme file). Red for glows and shapes, never for body text on black.
- Max two fonts, no default sans. All colours, fonts and shapes come from one theme file.
- The brief above wins over any generic design defaults from the frontend-design skill.

## Theme rules
- Marvel-inspired mood only. NEVER use Avengers/Marvel names, logos, characters, art or quotes.
- Use words like squad, mission, roster, briefing. Five original squads: Arts, Tech, Gaming, Business, Fun.
- Hero characters (if used) are original archetypes formed from particles, never existing characters.

## Stack
Next.js (App Router), Tailwind, GSAP + ScrollTrigger, Lenis, Three.js via React Three Fiber (+ drei). No other animation libraries without asking.

## Motion rules
- One shared motion config (easings, durations, staggers). Every animation uses it.
- DOM animation: transform, opacity, clip-path only. No scroll hijacking. Max two pinned sections.
- prefers-reduced-motion: simple fades. No heavy post-processing.
- Mobile: cap particles and pixel ratio, shorter distances, 2D fallback on low-end devices.
- Test at 360px and on a real phone. No hydration warnings, horizontal scroll or console errors.
- Use Context7 for current GSAP, Lenis, R3F and Next.js docs. Use Playwright to check work at 360px and 1280px, and Chrome DevTools for performance.

## Data and safety
- 15 programs live in /data/programs.js. Mark every unconfirmed detail (dates, fees, venues, rules) as TBA. Never invent facts.
- Preserve working routes, registration and any backend. Ask before major architecture changes.
- Validate all form input. No secrets in the repo.

## How to work
- Git checkpoint before each phase. Explain the plan before editing files.
- Never claim something is done unless you ran and tested it. Report: done / partial / not done.
- No destructive changes without explaining the consequences first.
- Never paste purchased or third-party component code as is. Adapt it to our motion config and palette.
