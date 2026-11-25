"use client";

/**
 * All five squad clusters in ONE draw call:
 *  - kind 0: background stars along the route
 *  - kind 1: a program star for each of the 15 programs, placed exactly where
 *            that program's button dot is in the DOM roster (seen from the
 *            stop's hold camera), so star and label line up
 *  - kind 2: dust swarming around each program star
 *  - kind 3: haze around the whole roster
 * Only the cluster of the squad you are at glows red. Everything else takes
 * the opposite tone of the background behind it.
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { colors } from "@/lib/theme";
import { hero, journey } from "@/lib/motion";
import { scrollState } from "@/lib/scrollStore";
import { programs, SQUADS } from "@/data/programs";
import { seededRandom, waitForFont } from "@/lib/textTargets";
import { STOP_COUNT, toVh, clusterRevealAt, clusterGlowAt, screenToStopWorld } from "@/lib/journey";
import { worldUniforms, bgMaskGLSL } from "./worldUniforms";

const CL = journey.cluster;
const HALF_FOV = THREE.MathUtils.degToRad(hero.camera.fov / 2);
const AMBIENT_CLUSTER = STOP_COUNT; // "no squad"

// Programs grouped by squad, in data order (the DOM roster uses the same order).
const ROSTERS = SQUADS.map((squad) => programs.filter((p) => p.squad === squad));
const STAR_COUNT = ROSTERS.reduce((n, r) => n + r.length, 0);

function layoutCounts(ambient, dustPerStar, haze) {
  const dust = STAR_COUNT * dustPerStar;
  const hazeTotal = STOP_COUNT * haze;
  return { ambient, stars: STAR_COUNT, dust, haze: hazeTotal, total: ambient + STAR_COUNT + dust + hazeTotal };
}

/**
 * Write every position. `stars[i][j]` is the world position of program j of
 * squad i (from the DOM), or null before sampling (then a loose placeholder).
 * Returns the roster centre of each squad (for gather + haze).
 */
function fillPositions(pos, counts, dustPerStar, hazePer, stars) {
  const rand = seededRandom(5150);
  const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5; // soft, centre-weighted
  const centres = [];
  let k = 0;

  // Background stars along the route.
  const A = journey.ambient;
  for (let i = 0; i < counts.ambient; i++, k++) {
    pos[k * 3] = (rand() * 2 - 1) * A.spreadX;
    pos[k * 3 + 1] = (rand() * 2 - 1) * A.spreadY;
    pos[k * 3 + 2] = A.nearZ + rand() * (A.farZ - A.nearZ);
  }

  // Program stars.
  const starPos = [];
  ROSTERS.forEach((roster, i) => {
    const [cx, cy, cz] = journey.centers[i];
    const list = [];
    roster.forEach((_, j) => {
      const p = stars?.[i]?.[j] ?? [cx + gauss() * 1.2, cy + gauss() * 0.8, cz];
      list.push(p);
      pos[k * 3] = p[0];
      pos[k * 3 + 1] = p[1];
      pos[k * 3 + 2] = p[2];
      k++;
    });
    starPos.push(list);
    const n = list.length;
    centres.push(list.reduce((c, p) => [c[0] + p[0] / n, c[1] + p[1] / n, c[2] + p[2] / n], [0, 0, 0]));
  });

  // Dust around each program star.
  starPos.forEach((list) =>
    list.forEach((p) => {
      for (let d = 0; d < dustPerStar; d++, k++) {
        pos[k * 3] = p[0] + gauss() * CL.swarmRadius;
        pos[k * 3 + 1] = p[1] + gauss() * CL.swarmRadius;
        pos[k * 3 + 2] = p[2] + gauss() * CL.swarmRadius;
      }
    })
  );

  // Haze around each roster.
  centres.forEach((c) => {
    for (let h = 0; h < hazePer; h++, k++) {
      pos[k * 3] = c[0] + gauss() * CL.hazeRadius * 1.4;
      pos[k * 3 + 1] = c[1] + gauss() * CL.hazeRadius;
      pos[k * 3 + 2] = c[2] + gauss() * CL.hazeRadius * 0.6;
    }
  });
  return centres;
}

function buildAttributes(counts, dustPerStar, hazePer) {
  const pos = new Float32Array(counts.total * 3);
  const size = new Float32Array(counts.total);
  const seed = new Float32Array(counts.total);
  const kind = new Float32Array(counts.total);
  const cluster = new Float32Array(counts.total);
  const centres = fillPositions(pos, counts, dustPerStar, hazePer, null);
  const rand = seededRandom(99);
  let k = 0;
  const put = (n, kd, sz, cl) => {
    for (let i = 0; i < n; i++, k++) {
      kind[k] = kd;
      size[k] = sz * (0.7 + rand() * 0.6);
      seed[k] = rand();
      cluster[k] = typeof cl === "function" ? cl(i) : cl;
    }
  };
  put(counts.ambient, 0, hero.particles.starSize, AMBIENT_CLUSTER);
  const starCluster = ROSTERS.flatMap((r, i) => r.map(() => i));
  put(counts.stars, 1, CL.starSize, (i) => starCluster[i]);
  put(counts.dust, 2, CL.dustSize, (i) => starCluster[Math.floor(i / dustPerStar)]);
  put(counts.haze, 3, CL.hazeSize, (i) => Math.floor(i / hazePer));
  for (let i = counts.ambient; i < counts.ambient + counts.stars; i++) size[i] = CL.starSize; // stars uniform
  return { pos, size, seed, kind, cluster, centres };
}

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  attribute float aKind;     // 0 background star, 1 program star, 2 dust, 3 haze
  attribute float aCluster;  // squad 0..4, 5 = none

  uniform float uReveal[5];
  uniform float uGlow[5];
  uniform vec3 uCentre[5];
  uniform float uScale, uMaxPx, uTime, uDrift, uFogNear, uFogFar;

  varying float vAlpha;
  varying float vGlow;
  varying float vKind;

  void main() {
    int ci = int(aCluster + 0.5);
    float reveal = 1.0;
    float glow = 0.0;
    vec3 p = position;
    if (ci < 5) {
      reveal = uReveal[ci];
      glow = uGlow[ci];
      // Gather in from a looser cloud as the camera approaches.
      p = uCentre[ci] + (position - uCentre[ci]) * mix(2.2, 1.0, reveal);
    }
    // Dust and haze float a tiny amount (time-based); program stars stay exactly put.
    float floaty = step(1.5, aKind);
    p += vec3(sin(uTime * 0.5 + aSeed * 30.0), cos(uTime * 0.4 + aSeed * 17.0), 0.0) * uDrift * floaty;

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    float dist = -mvPosition.z;
    float s = aSize * (aKind > 0.5 && aKind < 1.5 ? 1.0 + 0.3 * glow : 1.0);
    gl_PointSize = clamp(s * uScale / max(dist, 0.001), 1.0, uMaxPx);
    gl_Position = projectionMatrix * mvPosition;

    float nearFade = smoothstep(0.3, 2.0, dist);
    float farFade = 1.0 - smoothstep(uFogNear, uFogFar, dist);
    float kindAlpha = aKind > 2.5 ? 0.5 : (aKind > 1.5 ? 0.75 : 1.0);
    vAlpha = nearFade * farFade * (ci < 5 ? reveal : 1.0) * kindAlpha;
    vGlow = glow;
    vKind = aKind;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uLight;
  uniform vec3 uDark;
  uniform vec3 uRed;
  varying float vAlpha;
  varying float vGlow;
  varying float vKind;
  ${bgMaskGLSL}

  void main() {
    float d = length(gl_PointCoord - 0.5);
    vec3 tone = mix(uLight, uDark, bgWhite(gl_FragCoord.xy)); // opposite of the background
    vec3 col;
    float a;
    if (vKind > 0.5 && vKind < 1.5) {
      // Program star: crisp core in the contrast tone, red glow ring when its squad is active.
      float core = smoothstep(0.24, 0.16, d);
      float halo = smoothstep(0.5, 0.18, d) * vGlow;
      a = max(core, halo * 0.55);
      col = mix(uRed, tone, core);
    } else {
      a = smoothstep(0.5, 0.12, d);
      col = vKind > 1.5 ? mix(tone, uRed, vGlow) : tone; // dust + haze turn red with their squad
    }
    a *= vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
  }
`;

export default function SquadClusters({ ambient = 1200, dustPerStar = 18, haze = 120 }) {
  const ref = useRef();
  const counts = useMemo(() => layoutCounts(ambient, dustPerStar, haze), [ambient, dustPerStar, haze]);
  const data = useMemo(() => buildAttributes(counts, dustPerStar, haze), [counts, dustPerStar, haze]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          ...worldUniforms,
          uReveal: { value: new Array(STOP_COUNT).fill(0) },
          uGlow: { value: new Array(STOP_COUNT).fill(0) },
          uCentre: { value: data.centres.map((c) => new THREE.Vector3(...c)) },
          uScale: { value: 1 },
          uMaxPx: { value: 48 },
          uTime: { value: 0 },
          uDrift: { value: CL.drift },
          uFogNear: { value: hero.fog.near },
          uFogFar: { value: hero.fog.far },
          uLight: { value: new THREE.Color(colors.white) },
          uDark: { value: new THREE.Color(colors.black) },
          uRed: { value: new THREE.Color(colors.red) },
        },
        transparent: true,
        depthWrite: false,
      }),
    [data]
  );
  useEffect(() => () => material.dispose(), [material]);

  // Place each program star where its DOM roster dot is; again after a resize.
  useEffect(() => {
    let cancelled = false;
    let timer;
    let lastW = window.innerWidth;
    let lastH = window.innerHeight;

    async function sample() {
      const first = document.querySelector(".squad-stop [data-star]");
      if (!first) return;
      await waitForFont(first);
      await new Promise((resolve) => gsap.ticker.add(resolve, true)); // layout settled
      if (cancelled || !ref.current) return;
      const stars = ROSTERS.map((roster, i) => {
        const dots = document.querySelectorAll(`.squad-stop[data-stop="${i}"] [data-star]`);
        return roster.map((_, j) => {
          const dot = dots[j];
          if (!dot) return null;
          const r = dot.getBoundingClientRect();
          return screenToStopWorld(i, r.left + r.width / 2, r.top + r.height / 2, hero.camera.fov);
        });
      });
      const geo = ref.current.geometry;
      const centres = fillPositions(geo.attributes.position.array, counts, dustPerStar, haze, stars);
      geo.attributes.position.needsUpdate = true;
      const u = ref.current.material.uniforms.uCentre.value;
      centres.forEach((c, i) => u[i].set(c[0], c[1], c[2]));
    }

    sample();
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (w === lastW && Math.abs(h - lastH) < 150) return; // ignore phone address-bar resizes
      lastW = w;
      lastH = h;
      clearTimeout(timer);
      timer = setTimeout(sample, hero.resampleDebounceMs);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [counts, dustPerStar, haze]);

  useFrame((state) => {
    const pts = ref.current;
    if (!pts) return;
    const u = pts.material.uniforms;
    const s = toVh(scrollState.smooth);
    for (let i = 0; i < STOP_COUNT; i++) {
      u.uReveal.value[i] = clusterRevealAt(s, i);
      u.uGlow.value[i] = clusterGlowAt(s, i);
    }
    u.uTime.value = state.clock.elapsedTime;
    u.uScale.value = (state.size.height * state.viewport.dpr * 0.5) / Math.tan(HALF_FOV);
    u.uMaxPx.value = 48 * state.viewport.dpr;
  });

  return (
    <points ref={ref} material={material} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[data.size, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[data.seed, 1]} />
        <bufferAttribute attach="attributes-aKind" args={[data.kind, 1]} />
        <bufferAttribute attach="attributes-aCluster" args={[data.cluster, 1]} />
      </bufferGeometry>
    </points>
  );
}
