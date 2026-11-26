"use client";

/**
 * The program reveal: ONE point cloud (one draw call) that sits at the
 * current squad's stop and morphs from program shape to program shape as the
 * visitor scrolls. Same technique as the ASTRA headline: shapes are drawn on a
 * hidden canvas and sampled into target points; the vertex shader moves every
 * dot between two targets.
 *
 * Each squad moves its dots with its own "signature" (lib/motion.js):
 *   Arts curling ink, Tech grid snap + scan line, Gaming pixel glitch,
 *   Business rise like bars, Fun confetti burst.
 *
 * Shapes are sampled into the screen area of the DOM ".program-shape" frame,
 * so they never overlap the program text, at any screen size.
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { colors, brand } from "@/lib/theme";
import { hero, journey, finale as FIN } from "@/lib/motion";
import { scrollState } from "@/lib/scrollStore";
import { SQUADS } from "@/data/programs";
import { SHAPES, shapeFor } from "@/data/shapes";
import { EMBLEMS } from "@/data/emblems";
import { sampleShape, sampleImage, fillTargets, seededRandom } from "@/lib/textTargets";
import {
  ROSTERS,
  STOP_COUNT,
  toVh,
  stopIndexAt,
  fieldPresenceAt,
  morphAt,
  screenToLocal,
  finaleAt,
} from "@/lib/journey";
import { worldUniforms, bgMaskGLSL } from "./worldUniforms";

const F = journey.field;
const HALF_FOV = THREE.MathUtils.degToRad(hero.camera.fov / 2);
const CLOUD = "__cloud";
const FINALE = STOP_COUNT; // "stop" index used for the finale
const finaleKey = (k) => `__finale_${k}`; // "cloud" | "emblems" | "logo"

/** The logo image whose transparency the finale samples (loaded once). */
let logoPromise = null;
const loadLogo = () =>
  (logoPromise ??= new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = brand.sample;
  }));

/**
 * Finale targets, sampled from the DOM boxes in components/Story/Finale.jsx:
 * dots are split into five equal groups (one per squad); each group starts as
 * a loose cloud on its slot, then forms its squad's emblem there; then every
 * dot goes to a point of the logo.
 */
function sampleFinale(count, logoImg) {
  const slots = [...document.querySelectorAll(".finale-slot")];
  const logoEl = document.querySelector(".finale-logo");
  if (slots.length !== STOP_COUNT || !logoEl || !logoImg) return null;
  const wpp = localPerPx();
  const per = Math.ceil(count / STOP_COUNT);
  const group = (i) => Math.floor(i / per);
  const cloud = new Float32Array(count * 3);
  const emblems = new Float32Array(count * 3);
  const rand = seededRandom(4242);
  const g = () => (rand() + rand() + rand() - 1.5) / 1.5;

  slots.forEach((slot, k) => {
    const r = slot.getBoundingClientRect();
    const sample = sampleShape(EMBLEMS[SQUADS[k]], r, 0.04);
    if (sample) fillTargets(emblems, sample, wpp, seededRandom(70 + k), (i) => group(i) !== k);
    const [cx, cy] = screenToLocal(r.left + r.width / 2, r.top + r.height / 2, hero.camera.fov);
    const rad = r.width * wpp * FIN.cloudRadius;
    for (let i = k * per; i < Math.min(count, (k + 1) * per); i++) {
      cloud[i * 3] = cx + g() * rad;
      cloud[i * 3 + 1] = cy + g() * rad;
      cloud[i * 3 + 2] = g() * rad * 0.5;
    }
  });
  for (let i = 0; i < count; i++) emblems[i * 3 + 2] *= 0.6;

  const logo = new Float32Array(count * 3);
  const ls = sampleImage(logoImg, logoEl.getBoundingClientRect(), 0);
  if (!ls) return null;
  fillTargets(logo, ls, wpp, seededRandom(2027), () => false);
  for (let i = 0; i < count; i++) logo[i * 3 + 2] *= 0.5;
  return { [finaleKey("cloud")]: cloud, [finaleKey("emblems")]: emblems, [finaleKey("logo")]: logo };
}

/** World units per screen pixel on a stop's cluster plane (its hold camera). */
const localPerPx = () => (2 * journey.viewDistance * Math.tan(HALF_FOV)) / window.innerHeight;

/** Loose cloud centred on the shape frame: where shapes gather from and disperse to. */
function cloudPoints(count, centre) {
  const rand = seededRandom(808);
  const g = () => (rand() + rand() + rand() - 1.5) / 1.5;
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    out[i * 3] = centre[0] + g() * F.cloudRadius * 1.3;
    out[i * 3 + 1] = centre[1] + g() * F.cloudRadius;
    out[i * 3 + 2] = g() * F.cloudRadius * 0.5;
  }
  return out;
}

/**
 * Sample every shape used by any program into `count` local points.
 * Returns { byKey: {shapeKey: Float32Array}, frame: {...local frame info} }.
 */
function sampleAllShapes(count) {
  const frameEl = document.querySelector(".squad-stop .program-shape");
  if (!frameEl) return null;
  const r = frameEl.getBoundingClientRect();
  if (!r.width || !r.height) return null;
  const wpp = localPerPx();
  const keys = [...new Set(ROSTERS.flat().map(shapeFor))];
  const byKey = {};
  keys.forEach((key, k) => {
    const sample = sampleShape(SHAPES[key], r, F.framePadding);
    const out = new Float32Array(count * 3);
    if (sample) fillTargets(out, sample, wpp, seededRandom(31 + k), () => false);
    for (let i = 0; i < count; i++) out[i * 3 + 2] *= 0.6; // nearly flat, a hint of depth
    byKey[key] = out;
  });
  const [cx, cy] = screenToLocal(r.left + r.width / 2, r.top + r.height / 2, hero.camera.fov);
  const halfW = (r.width / 2) * wpp;
  const bottom = screenToLocal(0, r.bottom - r.height * F.framePadding, hero.camera.fov)[1];
  byKey[CLOUD] = cloudPoints(count, [cx, cy]);
  return { byKey, frame: { cx, cy, halfW, bottom } };
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
  attribute float aRed;

  uniform float uMorph;     // 0..1 from shape "from" to shape "to"
  uniform float uTime;
  uniform float uAlpha;
  uniform float uScale, uMaxPx, uSize, uStagger;
  uniform int uSig;         // 0 Arts, 1 Tech, 2 Gaming, 3 Business, 4 Fun
  uniform vec4 uSigParams;

  varying float vAlpha;
  varying float vRed;
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
      // Arts: curling, ink-like flow.
      float bump = sin(3.14159 * st);
      p = mix(aFrom, aTo, easeInOut(st));
      float a = aSeed * 6.2832 + st * P.y;
      p += vec3(sin(a + p.y * 2.0), cos(a * 1.3 + p.x * 2.0), sin(a * 0.7) * 0.3) * P.x * bump;
    }

    // Barely-there life while a shape holds (time-based).
    p += vec3(sin(uTime * 1.3 + aSeed * 40.0), cos(uTime * 1.1 + aSeed * 23.0), 0.0) * 0.006;

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    float dist = -mvPosition.z;
    gl_PointSize = clamp(uSize * (1.0 + boost * 0.8) * uScale / max(dist, 0.001), 1.0, uMaxPx);
    gl_Position = projectionMatrix * mvPosition;
    vAlpha = uAlpha * smoothstep(0.3, 2.0, dist) * mix(0.9, 1.0, boost);
    vRed = aRed;
    vBoost = boost;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uLight;
  uniform vec3 uDark;
  uniform vec3 uRed;
  varying float vAlpha;
  varying float vRed;
  varying float vBoost;
  ${bgMaskGLSL}

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.12, d) * vAlpha;
    if (a < 0.01) discard;
    vec3 col = mix(uLight, uDark, bgWhite(gl_FragCoord.xy)); // opposite of the background
    col = mix(col, uRed, vRed);
    gl_FragColor = vec4(col, min(1.0, a * (1.0 + vBoost)));
    #include <colorspace_fragment>
  }
`;

export default function ProgramField({ count }) {
  const ref = useRef();
  const shapes = useRef(null); // { byKey, frame }
  const current = useRef({ stop: -2, from: null, to: null });

  const data = useMemo(() => {
    const from = new Float32Array(count * 3);
    const to = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const red = new Float32Array(count);
    const rand = seededRandom(1515);
    for (let i = 0; i < count; i++) {
      seed[i] = rand();
      red[i] = i % F.redEvery === 7 ? 1 : 0;
    }
    return { from, to, seed, red };
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
          uLight: { value: new THREE.Color(colors.white) },
          uDark: { value: new THREE.Color(colors.black) },
          uRed: { value: new THREE.Color(colors.red) },
        },
        transparent: true,
        depthWrite: false,
      }),
    []
  );
  useEffect(() => () => material.dispose(), [material]);

  // Sample all shapes once the layout is ready, and again after a real resize.
  useEffect(() => {
    let timer;
    let lastW = window.innerWidth;
    let lastH = window.innerHeight;
    let cancelled = false;
    const run = () => {
      const result = sampleAllShapes(count);
      if (!result) return;
      shapes.current = result;
      current.current = { stop: -2, from: null, to: null }; // force the buffers to refresh
      // The finale needs the logo image: add its targets once it has loaded.
      loadLogo().then((img) => {
        if (cancelled || shapes.current !== result) return;
        const fin = sampleFinale(count, img);
        if (!fin) return;
        Object.assign(result.byKey, fin);
        result.finale = true;
        current.current = { stop: -2, from: null, to: null };
      });
    };
    const first = requestIdleCallbackSafe(run);
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

  useFrame((state) => {
    const pts = ref.current;
    const sh = shapes.current;
    if (!pts) return;
    const u = pts.material.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uScale.value = (state.size.height * state.viewport.dpr * 0.5) / Math.tan(HALF_FOV);
    u.uMaxPx.value = 24 * state.viewport.dpr;

    const s = toVh(scrollState.smooth);

    // Finale: the same dots, now at the finale spot: five clouds -> five emblems -> the logo.
    const fin = finaleAt(s);
    if (fin) {
      if (!sh?.finale) {
        u.uAlpha.value = 0;
        pts.visible = false;
        return;
      }
      u.uAlpha.value = fin.presence;
      pts.visible = fin.presence > 0.001;
      const fromKey = finaleKey(fin.morph.from);
      const toKey = finaleKey(fin.morph.to);
      const c = current.current;
      if (c.stop !== FINALE) {
        pts.position.set(...FIN.center);
        u.uSig.value = 0; // the curling path (Arts signature maths), with the finale's own settings
        u.uSize.value = FIN.size;
        u.uStagger.value = FIN.stagger;
      }
      if (c.stop !== FINALE || c.from !== fromKey || c.to !== toKey) {
        const geo = pts.geometry;
        geo.attributes.aFrom.array.set(sh.byKey[fromKey]);
        geo.attributes.aTo.array.set(sh.byKey[toKey]);
        geo.attributes.aFrom.needsUpdate = true;
        geo.attributes.aTo.needsUpdate = true;
        const [curl, swirl] = fin.morph.to === "logo" ? FIN.mergePath : FIN.emblemPath;
        u.uSigParams.value.set(curl, swirl, 0, 0);
        current.current = { stop: FINALE, from: fromKey, to: toKey };
      }
      u.uMorph.value = fin.morph.t;
      return;
    }

    const i = stopIndexAt(s);
    if (i < 0 || !sh) {
      u.uAlpha.value = 0;
      return;
    }
    const presence = fieldPresenceAt(s, i);
    u.uAlpha.value = presence;
    pts.visible = presence > 0.001;
    if (!pts.visible) return;

    const m = morphAt(s, i);
    const keyOf = (j) => (j < 0 ? CLOUD : shapeFor(ROSTERS[i][j]));
    const fromKey = keyOf(m.from);
    const toKey = keyOf(m.to);
    const c = current.current;
    if (c.stop !== i) {
      const [x, y, z] = journey.centers[i];
      pts.position.set(x, y, z);
      u.uSize.value = F.size; // back from the finale's settings
      u.uStagger.value = F.stagger;
      u.uSig.value = Math.min(i, STOP_COUNT - 1);
      u.uSigParams.value.fromArray(signatureParams(SQUADS[i], sh.frame));
    }
    if (c.stop !== i || c.from !== fromKey || c.to !== toKey) {
      // New pair of shapes: copy their points into the two GPU buffers.
      const geo = pts.geometry;
      geo.attributes.aFrom.array.set(sh.byKey[fromKey]);
      geo.attributes.aTo.array.set(sh.byKey[toKey]);
      geo.attributes.aFrom.needsUpdate = true;
      geo.attributes.aTo.needsUpdate = true;
      current.current = { stop: i, from: fromKey, to: toKey };
    }
    u.uMorph.value = m.t;
  });

  return (
    <points ref={ref} material={material} frustumCulled={false} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.from, 3]} />
        <bufferAttribute attach="attributes-aFrom" args={[data.from, 3]} />
        <bufferAttribute attach="attributes-aTo" args={[data.to, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[data.seed, 1]} />
        <bufferAttribute attach="attributes-aRed" args={[data.red, 1]} />
      </bufferGeometry>
    </points>
  );
}

/** Run `fn` after fonts and layout are ready (one ticker frame later); returns a cancel function. */
function requestIdleCallbackSafe(fn) {
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
