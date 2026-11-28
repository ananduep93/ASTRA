"use client";

/**
 * The shape dots: ONE point cloud (one draw call) for two jobs.
 *
 *  - FINALE (scroll-driven): dots scattered across the view gather into the
 *    ASTRA logo (sampled from the logo's transparency, same sampler as the
 *    headline).
 *  - PROGRAM DETAIL (time-driven, lib/detail.js): when a program card is
 *    expanded, the dots start EXACTLY on the card's printed halftone dots
 *    (lib/halftone.js), burst a little outward, then converge into the shape
 *    in front of the camera, with the squad's signature (lib/motion.js):
 *      Arts curling ink, Tech grid snap + scan line, Gaming pixel glitch
 *      (square dots), Business rise like bars, Fun confetti burst.
 *    Next / previous: a short turbulence melting straight into the next shape
 *    (from wherever the dots are, so rapid presses never jump). Close: the
 *    dots fall back onto the card's printed dots. Only `detailCount` dots
 *    are drawn for a detail (tier). One shape at a time, never one canvas per card.
 *
 * Shapes are drawn on a hidden canvas and sampled into target points; the
 * vertex shader moves every dot between two targets.
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { colors, brand, squadAccent } from "@/lib/theme";
import { hero, journey, finale as FIN, detail as DET } from "@/lib/motion";
import { scrollState } from "@/lib/scrollStore";
import { programs, SQUADS } from "@/data/programs";
import { SHAPES, shapeFor } from "@/data/shapes";
import { sampleShape, sampleImage, fillTargets, seededRandom } from "@/lib/textTargets";
import { toVh, screenToLocal, finaleAt } from "@/lib/journey";
import { detailState } from "@/lib/detail";
import { HALFTONE } from "@/lib/halftone";
import { worldUniforms, bgMaskGLSL } from "./worldUniforms";

const F = journey.field;
const HALF_FOV = THREE.MathUtils.degToRad(hero.camera.fov / 2);
const SQUARE_DOTS = ["Gaming"]; // pixel-like dots for this squad's detail
const RED = new THREE.Color(colors.red);

/** World units per screen pixel on a plane journey.viewDistance in front of the camera. */
const localPerPx = () => (2 * journey.viewDistance * Math.tan(HALF_FOV)) / window.innerHeight;

/** The logo image whose transparency the finale samples (loaded once). */
let logoPromise = null;
const loadLogo = () =>
  (logoPromise ??= new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = brand.sample;
  }));

/** Finale targets: scattered across the view, and the logo in the DOM ".finale-logo" box. */
function sampleFinale(count, logoImg) {
  const logoEl = document.querySelector(".finale-logo");
  if (!logoEl || !logoImg) return null;
  const wpp = localPerPx();
  const halfW = (window.innerWidth / 2) * wpp * FIN.scatter;
  const halfH = (window.innerHeight / 2) * wpp * FIN.scatter;
  const rand = seededRandom(4242);
  const scatter = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    scatter[i * 3] = (rand() * 2 - 1) * halfW;
    scatter[i * 3 + 1] = (rand() * 2 - 1) * halfH;
    scatter[i * 3 + 2] = (rand() - 0.5) * 1.5;
  }
  const logo = new Float32Array(count * 3);
  const ls = sampleImage(logoImg, logoEl.getBoundingClientRect(), 0);
  if (!ls) return null;
  fillTargets(logo, ls, wpp, seededRandom(2027), () => false);
  for (let i = 0; i < count; i++) logo[i * 3 + 2] *= 0.5;
  return { scatter, logo };
}

/**
 * Detail targets for one program inside `rect` (screen px), plus the frame info the
 * signatures need. Only the first `n` dots (the ones a detail draws) are filled.
 */
function sampleDetail(count, program, rect, n = count) {
  const wpp = localPerPx();
  const out = new Float32Array(count * 3);
  const sample = sampleShape(SHAPES[shapeFor(program)], rect, F.framePadding, HALFTONE.bold);
  if (sample) fillTargets(out.subarray(0, n * 3), sample, wpp, seededRandom(31 + programs.indexOf(program)), () => false);
  for (let i = 0; i < n; i++) out[i * 3 + 2] *= 0.6; // nearly flat, a hint of depth
  const [cx, cy] = screenToLocal(rect.left + rect.width / 2, rect.top + rect.height / 2, hero.camera.fov);
  const halfW = (rect.width / 2) * wpp;
  const bottom = screenToLocal(0, rect.bottom - rect.height * F.framePadding, hero.camera.fov)[1];
  return { points: out, frame: { cx, cy, halfW, bottom } };
}

/**
 * sampleDetail, remembered per program, box and screen size (the result is only read,
 * never written). Sampling draws the shape and reads its pixels back, 10-30ms on a slow
 * phone, so it is done ahead (detailState.warm) and reused on every later open.
 */
const sampleCache = new Map();
function sampleDetailCached(count, program, rect, n) {
  const r = (v) => Math.round(v);
  const key = `${program.id}|${count}|${n}|${r(rect.left)},${r(rect.top)},${r(rect.width)},${r(rect.height)}|${window.innerWidth}x${window.innerHeight}`;
  let hit = sampleCache.get(key);
  if (!hit) {
    if (sampleCache.size > 40) sampleCache.clear();
    hit = sampleDetail(count, program, rect, n);
    sampleCache.set(key, hit);
  }
  return hit;
}

/** A loose cloud around (cx, cy): where a detail shape gathers from. */
function cloudPoints(count, cx, cy) {
  const rand = seededRandom(808);
  const g = () => (rand() + rand() + rand() - 1.5) / 1.5;
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    out[i * 3] = cx + g() * F.cloudRadius * 1.6;
    out[i * 3 + 1] = cy + g() * F.cloudRadius * 1.2;
    out[i * 3 + 2] = g() * F.cloudRadius * 0.5;
  }
  return out;
}

/**
 * Put the first `n` dots on printed halftone dots ({ xy: screen px, r: radius px }):
 * every printed dot gets its share, spread inside its disc. Screen px -> plane units
 * like fillTargets (the plane faces the camera, its centre at the screen's centre).
 */
function fillHalftone(out, n, halftone, wpp, rand) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const { xy, r } = halftone;
  const dots = xy.length / 2;
  if (!dots) return;
  for (let i = 0; i < n; i++) {
    const k = (i % dots) * 2;
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * r * 0.8;
    out[i * 3] = (xy[k] + Math.cos(a) * d - W / 2) * wpp;
    out[i * 3 + 1] = -(xy[k + 1] + Math.sin(a) * d - H / 2) * wpp;
    out[i * 3 + 2] = 0;
  }
}

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Turbulence level of a switch at morph progress m (same curve as the shader). */
const turbCurve = (m) => Math.sin(Math.PI * Math.min(1, Math.max(0, m / 0.45)));

/**
 * Where the first `n` dots are now (CPU estimate of the shader's default path), so an
 * interrupted morph (rapid next / previous, close) starts from there instead of jumping.
 */
function currentPoints(d, seed, n, m) {
  const out = new Float32Array(d.to.length);
  out.set(d.to);
  for (let i = 0; i < n; i++) {
    const st = Math.min(1, Math.max(0, (m - seed[i] * d.stagger) / (1 - d.stagger)));
    const e = easeInOut(st);
    for (let c = 0; c < 3; c++) out[i * 3 + c] = d.from[i * 3 + c] + (d.to[i * 3 + c] - d.from[i * 3 + c]) * e;
  }
  return out;
}

/** Shader parameters for each squad's signature, packed as vec4. */
function signatureParams(squad, frame) {
  const s = journey.signatures[squad];
  switch (squad) {
    case "Arts":
      return [s.curl, s.swirl, 0, 0];
    case "Tech":
      return [0, s.grid, frame.halfW, frame.cx];
    case "Gaming":
      return [s.jitter, s.pixel, s.steps, 0];
    case "Business":
      return [frame.cx, frame.bottom, frame.halfW, s.stagger];
    default:
      return [s.burst, s.fall, 0, 0]; // Fun
  }
}

const vertexShader = /* glsl */ `
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute float aSeed;

  uniform float uMorph;     // 0..1 from shape "from" to shape "to"
  uniform float uTime;
  uniform float uAlpha;
  uniform float uScale, uMaxPx, uSize, uStagger;
  uniform int uSig;         // 0 Arts, 1 Tech, 2 Gaming, 3 Business, 4 Fun
  uniform vec4 uSigParams;
  uniform float uAccentShare; // share of dots in the accent colour
  uniform float uBurst;       // open: dots first fly this far outward from uCenter (world units)
  uniform vec2 uCenter;
  uniform float uTurb;        // switch: turbulence amplitude (world units)
  uniform float uTurbStart;   // turbulence already there when this morph began (an interrupted switch)

  varying float vAlpha;
  varying float vAccent;
  varying float vBoost;

  float easeInOut(float t) { return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0; }
  float hash(float n) { return fract(sin(n) * 43758.5453); }

  void main() {
    vec4 P = uSigParams;
    // Default: each dot leaves at its own moment (stagger by seed).
    float st = clamp((uMorph - aSeed * uStagger) / (1.0 - uStagger), 0.0, 1.0);
    float boost = 0.0;
    vec3 p;

    if (uSig == 1) {
      // Tech: a scan line sweeps left to right; dots move as it passes, snapping to a grid mid-flight.
      float across = clamp((aTo.x - P.w) / max(P.z, 0.001) * 0.5 + 0.5, 0.0, 1.0);
      st = clamp(uMorph * 1.6 - across * 0.6, 0.0, 1.0);
      float bump = sin(3.14159 * st);
      p = mix(aFrom, aTo, easeInOut(st));
      vec3 q = floor(p / P.y + 0.5) * P.y;
      p = mix(p, q, bump);
      float scanX = P.w + mix(-P.z * 1.2, P.z * 1.2, uMorph);
      boost = exp(-abs(p.x - scanX) * 5.0) * sin(3.14159 * uMorph);
    } else if (uSig == 2) {
      // Gaming: progress moves in blocky steps; dots jitter and snap to a coarse pixel grid.
      float steps = P.z;
      float qs = floor(st * steps) / steps;
      float bump = sin(3.14159 * st);
      p = mix(aFrom, aTo, easeInOut(qs));
      vec2 j = vec2(hash(aSeed * 13.0 + floor(st * steps)), hash(aSeed * 7.0 + floor(st * steps))) - 0.5;
      p.xy += j * P.x * bump;
      p.xy = mix(p.xy, floor(p.xy / P.y + 0.5) * P.y, step(0.05, bump));
    } else if (uSig == 3) {
      // Business: drop to a baseline, then rise into place like bars, left to right.
      float across = clamp((aTo.x - P.x) / max(P.z, 0.001) * 0.5 + 0.5, 0.0, 1.0);
      st = clamp(uMorph * (1.0 + P.w) - across * P.w, 0.0, 1.0);
      vec3 mid = vec3(aTo.x, P.y, aTo.z);
      p = st < 0.5 ? mix(aFrom, mid, easeInOut(st * 2.0)) : mix(mid, aTo, easeInOut(st * 2.0 - 1.0));
    } else if (uSig == 4) {
      // Fun: confetti bursts outward, falls, flutters and settles.
      float bump = sin(3.14159 * st);
      p = mix(aFrom, aTo, easeInOut(st));
      vec2 dir = normalize(vec2(hash(aSeed * 3.1) - 0.5, hash(aSeed * 5.7) - 0.5) + 1e-4);
      p.xy += dir * P.x * bump * (0.4 + aSeed);
      p.y -= P.y * bump * st;
      p.x += sin(st * 12.0 + aSeed * 20.0) * 0.06 * bump;
    } else {
      // Arts (and the finale, with its own settings): curling, ink-like flow.
      float bump = sin(3.14159 * st);
      p = mix(aFrom, aTo, easeInOut(st));
      float a = aSeed * 6.2832 + st * P.y;
      p += vec3(sin(a + p.y * 2.0), cos(a * 1.3 + p.x * 2.0), sin(a * 0.7) * 0.3) * P.x * bump;
    }

    // Open: a slight outward burst first (zero at the start: the dots begin exactly on the print).
    float bm = clamp(uMorph / 0.55, 0.0, 1.0);
    vec2 outward = aFrom.xy - uCenter;
    float ol = length(outward);
    p.xy += (ol > 1e-4 ? outward / ol : vec2(0.0)) * uBurst * sin(3.14159 * bm) * (0.6 + 0.8 * aSeed);

    // Switch: a short turbulence that melts into the next shape (continues an interrupted one).
    float tb = max(sin(3.14159 * clamp(uMorph / 0.45, 0.0, 1.0)), uTurbStart * (1.0 - smoothstep(0.0, 0.45, uMorph)));
    p += vec3(
      sin(aSeed * 91.0 + uTime * 6.0 + p.y * 3.0),
      cos(aSeed * 57.0 + uTime * 5.0 + p.x * 3.0),
      sin(aSeed * 23.0 + uTime * 4.0) * 0.5
    ) * uTurb * tb;

    // Barely-there life while a shape holds (time-based).
    p += vec3(sin(uTime * 1.3 + aSeed * 40.0), cos(uTime * 1.1 + aSeed * 23.0), 0.0) * 0.006;

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    float dist = -mvPosition.z;
    gl_PointSize = clamp(uSize * (1.0 + boost * 0.8) * uScale / max(dist, 0.001), 1.0, uMaxPx);
    gl_Position = projectionMatrix * mvPosition;
    vAlpha = uAlpha * smoothstep(0.3, 2.0, dist) * mix(0.9, 1.0, boost);
    vAccent = step(fract(aSeed * 91.71), uAccentShare);
    vBoost = boost;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uLight;
  uniform vec3 uDark;
  uniform vec3 uAccent;
  uniform float uSquare;    // 1 = square, pixel-like dots
  uniform float uGlow;      // 0 = plain dot; > 0 = a smaller core with a faint soft halo (detail, additive)
  varying float vAlpha;
  varying float vAccent;
  varying float vBoost;
  ${bgMaskGLSL}

  void main() {
    vec2 c = abs(gl_PointCoord - 0.5);
    float d = mix(length(c), max(c.x, c.y), uSquare);
    float dotA = uGlow > 0.0
      ? smoothstep(0.34, 0.1, d) + uGlow * (1.0 - smoothstep(0.0, 0.5, d)) * 0.5
      : smoothstep(0.5, 0.12, d);
    float a = mix(dotA, step(d, 0.42), uSquare) * vAlpha;
    if (a < 0.01) discard;
    vec3 col = mix(uLight, uDark, bgWhite(gl_FragCoord.xy)); // opposite of the background
    col = mix(col, uAccent, vAccent);
    gl_FragColor = vec4(col, min(1.0, a * (1.0 + vBoost)));
    #include <colorspace_fragment>
  }
`;

/** The soft squad-colour glow behind a detail shape: one additive quad, a radial falloff. */
const glowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const glowFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAlpha;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float a = (1.0 - smoothstep(0.0, 1.0, d)) * uAlpha;
    gl_FragColor = vec4(uColor * a, a);
    #include <colorspace_fragment>
  }
`;

export default function ProgramField({ count, detailCount = count }) {
  const glow = useRef();
  const glowMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: glowVertex,
        fragmentShader: glowFragment,
        uniforms: { uColor: { value: new THREE.Color(colors.red) }, uAlpha: { value: 0 } },
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );
  useEffect(() => () => glowMaterial.dispose(), [glowMaterial]);
  const ref = useRef();
  const finale = useRef(null); // { scatter, logo } once sampled
  const mode = useRef(null); // "finale" | "detail" | null: which targets are in the buffers
  // The detail's morph: from / to buffers, timing, and how it fades.
  const det = useRef({ version: -1, active: false, phase: null, from: null, to: null, start: 0, duration: 1, stagger: F.stagger, alpha: 0, t: null, turb: 0 });
  const nDetail = Math.min(count, detailCount);

  const data = useMemo(() => {
    const from = new Float32Array(count * 3);
    const to = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const rand = seededRandom(1515);
    for (let i = 0; i < count; i++) seed[i] = rand();
    return { from, to, seed };
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          ...worldUniforms,
          uMorph: { value: 0 },
          uTime: { value: 0 },
          uAlpha: { value: 0 },
          uScale: { value: 1 },
          uMaxPx: { value: 24 },
          uSize: { value: F.size },
          uStagger: { value: F.stagger },
          uSig: { value: 0 },
          uSigParams: { value: new THREE.Vector4() },
          uAccentShare: { value: FIN.redShare },
          uBurst: { value: 0 },
          uCenter: { value: new THREE.Vector2() },
          uTurb: { value: 0 },
          uTurbStart: { value: 0 },

          uSquare: { value: 0 },
          uGlow: { value: 0 },
          uLight: { value: new THREE.Color(colors.white) },
          uDark: { value: new THREE.Color(colors.black) },
          uAccent: { value: RED.clone() },
        },
        transparent: true,
        depthWrite: false,
      }),
    []
  );
  useEffect(() => () => material.dispose(), [material]);

  // Sample the finale targets once the layout and the logo are ready, and again after a real resize.
  useEffect(() => {
    let timer;
    let lastW = window.innerWidth;
    let lastH = window.innerHeight;
    let cancelled = false;
    const run = () =>
      loadLogo().then((img) => {
        if (cancelled) return;
        const fin = sampleFinale(count, img);
        if (!fin) return;
        finale.current = fin;
        if (mode.current === "finale") mode.current = null; // refill the buffers
      });
    const first = afterFonts(run);
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w === lastW && Math.abs(h - lastH) < 150) return; // phone address bar: ignore
      lastW = w;
      lastH = h;
      clearTimeout(timer);
      timer = setTimeout(run, hero.resampleDebounceMs);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      first();
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [count]);

  const fill = (pts, from, to) => {
    const geo = pts.geometry;
    geo.attributes.aFrom.array.set(from);
    geo.attributes.aTo.array.set(to);
    geo.attributes.aFrom.needsUpdate = true;
    geo.attributes.aTo.needsUpdate = true;
  };

  useFrame((state) => {
    const pts = ref.current;
    if (!pts) return;
    const u = pts.material.uniforms;
    const now = state.clock.elapsedTime;
    u.uTime.value = now;
    u.uScale.value = (state.size.height * state.viewport.dpr * 0.5) / Math.tan(HALF_FOV);
    u.uMaxPx.value = 24 * state.viewport.dpr;

    /* ---- program detail: time-driven, in front of wherever the camera is ---- */
    if (detailState.warm) {
      // Prepare the next shape in a quiet frame (while the card grows), so the take-over frame is light.
      const { programId, rect } = detailState.warm;
      detailState.warm = null;
      const program = programs.find((p) => p.id === programId);
      if (program && rect) sampleDetailCached(count, program, rect, nDetail);
    }
    const d = det.current;
    if (detailState.open || d.active) {
      if (d.version !== detailState.version) {
        d.version = detailState.version;
        const phase = detailState.phase;
        if (!detailState.open) {
          // Hidden: at once (the printed card took over), or fading (nothing to land on).
          d.phase = phase === "fade" ? "fade" : null;
          if (phase !== "fade") {
            d.active = false;
            d.alpha = 0;
            d.from = null; // nothing of this program is reused by the next open
            d.to = null;
            d.turb = 0;
          }
        } else {
          const n = nDetail;
          const wpp = localPerPx();
          const m = Math.min(1, (now - d.start) / d.duration);
          // Where the dots are right now (if a detail morph is on screen): interrupted moves start there.
          const current = d.active && mode.current === "detail" && d.to ? currentPoints(d, data.seed, n, m) : null;
          const turbNow = current && d.phase === "switch" ? Math.max(turbCurve(m), d.turb * (1 - Math.min(1, m / 0.45))) : 0;
          if (phase === "open" || phase === "cloud" || !current) {
            // The plane sits journey.viewDistance in front of the camera, facing it square-on.
            const cam = state.camera;
            pts.quaternion.copy(cam.quaternion);
            pts.position.copy(cam.position).add(new THREE.Vector3(0, 0, -journey.viewDistance).applyQuaternion(cam.quaternion));
          }
          let from;
          let to;
          const sig = detailState.squad;
          u.uBurst.value = 0;
          u.uTurb.value = 0;
          u.uTurbStart.value = 0;
          d.turb = 0;
          if (phase === "close") {
            // Close: from wherever they are back onto the card's printed dots (a plain fall).
            to = new Float32Array(count * 3);
            fillHalftone(to, n, detailState.to, wpp, seededRandom(77));
            from = current ?? to;
            d.duration = DET.collapseDots;
            d.stagger = 0.15;
            u.uSigParams.value.set(0, 0, 0, 0);
          } else {
            const program = programs.find((p) => p.id === detailState.programId);
            const next = sampleDetailCached(count, program, detailState.rect, n);
            to = next.points;
            u.uCenter.value.set(next.frame.cx, next.frame.cy);
            if (glow.current) {
              glow.current.position.set(next.frame.cx, next.frame.cy, -0.2);
              glow.current.scale.setScalar(next.frame.halfW * 3.2);
              glow.current.material.uniforms.uColor.value.set(squadAccent(detailState.squad));
            }
            u.uSigParams.value.fromArray(signatureParams(detailState.squad, next.frame));
            d.stagger = F.stagger;
            if (phase === "open" && detailState.from) {
              // A fresh buffer every open: nothing of a previous program can survive.
              from = new Float32Array(count * 3);
              fillHalftone(from, n, detailState.from, wpp, seededRandom(55));
              u.uBurst.value = DET.burst;
              d.duration = DET.form;
            } else if (phase === "switch" && current) {
              from = current;
              u.uTurb.value = DET.turbulence;
              u.uTurbStart.value = turbNow;
              d.turb = turbNow;
              d.duration = DET.switchForm;
            } else {
              from = cloudPoints(count, next.frame.cx, next.frame.cy);
              d.duration = DET.form * 2;
            }
          }
          fill(pts, from, to);
          Object.assign(d, { active: true, phase, from, to, start: now });
          detailState.fresh = d.version; // every buffer now belongs to this change
          if (phase !== "cloud") d.alpha = 1; // the dots replace the printed dots in the same frame
          mode.current = "detail";
          pts.geometry.setDrawRange(0, n);
          const plain = phase === "close"; // the fall back onto the print has no signature
          u.uSig.value = plain ? 0 : SQUADS.indexOf(sig);
          u.uSquare.value = !plain && SQUARE_DOTS.includes(sig) ? 1 : 0;
          u.uAccent.value.set(squadAccent(detailState.squad));
          u.uAccentShare.value = DET.accentShare;
          u.uStagger.value = d.stagger;
          // On the black detail: additive blending and a faint halo (overlapping dots glow a little).
          u.uGlow.value = DET.halo;
          pts.material.blending = THREE.AdditiveBlending;
          u.uSize.value = F.size;
        }
      }
      // Alpha: 1 while shown (cloud: eases in; fade: eases out), time-based.
      const dt = Math.min(0.1, now - (d.t ?? now));
      d.t = now;
      if (d.phase === "cloud") d.alpha += (1 - d.alpha) * (1 - Math.exp(-10 * dt));
      else if (d.phase === "fade") {
        d.alpha += (0 - d.alpha) * (1 - Math.exp(-12 * dt));
        if (d.alpha < 0.01) {
          d.alpha = 0;
          d.active = false;
          d.phase = null;
        }
      }
      u.uAlpha.value = d.alpha;
      u.uMorph.value = Math.min(1, (now - d.start) / d.duration);
      pts.visible = d.alpha > 0.001;
      if (glow.current) {
        const formed = d.phase === "close" ? 1 - u.uMorph.value : Math.min(1, u.uMorph.value * 1.5);
        const gu = glow.current.material.uniforms;
        gu.uAlpha.value = DET.glow * d.alpha * (d.phase === "switch" ? 1 : formed);
        glow.current.visible = pts.visible && gu.uAlpha.value > 0.002;
      }
      detailState.shown = d.version; // this change is in the frame being drawn now
      if (d.active) return;
      if (glow.current) glow.current.visible = false;
      pts.geometry.setDrawRange(0, Infinity);
      mode.current = null; // the finale refills its buffers when it is next needed
    } else if (glow.current?.visible && state.clock.elapsedTime > 1) {
      glow.current.visible = false; // its shader has compiled by now (drawn at zero strength)
    }

    /* ---- finale: scroll-driven, scattered dots gather into the logo ---- */
    const fin = finaleAt(toVh(scrollState.smooth));
    if (!fin || !finale.current) {
      u.uAlpha.value = 0;
      pts.visible = false;
      return;
    }
    if (mode.current !== "finale") {
      fill(pts, finale.current.scatter, finale.current.logo);
      pts.geometry.setDrawRange(0, Infinity);
      u.uBurst.value = 0;
      u.uTurb.value = 0;
      u.uTurbStart.value = 0;
      pts.position.set(...FIN.center);
      pts.quaternion.identity(); // the finale camera looks straight down -z at the logo
      u.uSig.value = 0; // the curling path, with the finale's own settings
      u.uSigParams.value.set(FIN.mergePath[0], FIN.mergePath[1], 0, 0);
      u.uSquare.value = 0;
      u.uGlow.value = 0;
      pts.material.blending = THREE.NormalBlending;
      u.uAccent.value.copy(RED);
      u.uAccentShare.value = FIN.redShare;
      u.uSize.value = FIN.size;
      u.uStagger.value = FIN.stagger;
      mode.current = "finale";
    }
    u.uAlpha.value = fin.presence;
    u.uMorph.value = fin.t;
    pts.visible = fin.presence > 0.001;
  });

  return (
    <points ref={ref} material={material} frustumCulled={false} visible={false}>
      {/* Behind the shape (drawn first): the soft squad-colour glow of a program detail. */}
      {/* Visible (at zero strength) for the first frames only, so its shader compiles at load, not on the first open. */}
      <mesh ref={glow} material={glowMaterial} visible renderOrder={-1} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.from, 3]} />
        <bufferAttribute attach="attributes-aFrom" args={[data.from, 3]} />
        <bufferAttribute attach="attributes-aTo" args={[data.to, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[data.seed, 1]} />
      </bufferGeometry>
    </points>
  );
}

/** Run `fn` after fonts and layout are ready (one ticker frame later); returns a cancel function. */
function afterFonts(fn) {
  let cancelled = false;
  document.fonts.ready.then(() => {
    gsap.ticker.add(() => {
      if (!cancelled) fn();
    }, true); // once: no extra requestAnimationFrame loop
  });
  return () => {
    cancelled = true;
  };
}
