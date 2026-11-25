"use client";

/**
 * Background for the squad journey, in ONE draw call:
 *  - background stars along the whole route
 *  - a loose haze around each squad's stop that gathers as the camera
 *    approaches and glows red only at the squad you are at
 * The program shapes themselves are drawn by ProgramField.
 * Everything takes the opposite tone of the background behind it.
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { colors } from "@/lib/theme";
import { hero, journey } from "@/lib/motion";
import { scrollState } from "@/lib/scrollStore";
import { seededRandom } from "@/lib/textTargets";
import { STOP_COUNT, toVh, clusterRevealAt, clusterGlowAt } from "@/lib/journey";
import { worldUniforms, bgMaskGLSL } from "./worldUniforms";

const CL = journey.cluster;
const HALF_FOV = THREE.MathUtils.degToRad(hero.camera.fov / 2);
const NO_SQUAD = STOP_COUNT;

function build(ambient, hazePer) {
  const total = ambient + STOP_COUNT * hazePer;
  const pos = new Float32Array(total * 3);
  const size = new Float32Array(total);
  const seed = new Float32Array(total);
  const cluster = new Float32Array(total);
  const rand = seededRandom(5150);
  const g = () => (rand() + rand() + rand() - 1.5) / 1.5; // soft, centre-weighted
  const A = journey.ambient;
  let k = 0;
  for (let i = 0; i < ambient; i++, k++) {
    pos.set([(rand() * 2 - 1) * A.spreadX, (rand() * 2 - 1) * A.spreadY, A.nearZ + rand() * (A.farZ - A.nearZ)], k * 3);
    size[k] = hero.particles.starSize * (0.7 + rand() * 0.6);
    seed[k] = rand();
    cluster[k] = NO_SQUAD;
  }
  journey.centers.forEach(([cx, cy, cz], c) => {
    for (let h = 0; h < hazePer; h++, k++) {
      pos.set([cx + g() * CL.hazeRadius * 1.4, cy + g() * CL.hazeRadius, cz + g() * CL.hazeRadius * 0.6], k * 3);
      size[k] = CL.hazeSize * (0.7 + rand() * 0.6);
      seed[k] = rand();
      cluster[k] = c;
    }
  });
  return { pos, size, seed, cluster };
}

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  attribute float aCluster; // squad 0..4, 5 = background star

  uniform float uReveal[5];
  uniform float uGlow[5];
  uniform vec3 uCentre[5];
  uniform float uScale, uMaxPx, uTime, uDrift, uFogNear, uFogFar;

  varying float vAlpha;
  varying float vGlow;

  void main() {
    int ci = int(aCluster + 0.5);
    float reveal = 1.0;
    float glow = 0.0;
    vec3 p = position;
    if (ci < 5) {
      reveal = uReveal[ci];
      glow = uGlow[ci];
      p = uCentre[ci] + (position - uCentre[ci]) * mix(2.2, 1.0, reveal); // gather in
      p += vec3(sin(uTime * 0.5 + aSeed * 30.0), cos(uTime * 0.4 + aSeed * 17.0), 0.0) * uDrift;
    }
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    float dist = -mvPosition.z;
    gl_PointSize = clamp(aSize * uScale / max(dist, 0.001), 1.0, uMaxPx);
    gl_Position = projectionMatrix * mvPosition;
    float nearFade = smoothstep(0.3, 2.0, dist);
    float farFade = 1.0 - smoothstep(uFogNear, uFogFar, dist);
    vAlpha = nearFade * farFade * (ci < 5 ? reveal * 0.55 : 1.0);
    vGlow = glow;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uLight;
  uniform vec3 uDark;
  uniform vec3 uRed;
  varying float vAlpha;
  varying float vGlow;
  ${bgMaskGLSL}

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.12, d) * vAlpha;
    if (a < 0.01) discard;
    vec3 tone = mix(uLight, uDark, bgWhite(gl_FragCoord.xy)); // opposite of the background
    gl_FragColor = vec4(mix(tone, uRed, vGlow), a);
    #include <colorspace_fragment>
  }
`;

export default function SquadClusters({ ambient = 1200, haze = 120 }) {
  const ref = useRef();
  const data = useMemo(() => build(ambient, haze), [ambient, haze]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          ...worldUniforms,
          uReveal: { value: new Array(STOP_COUNT).fill(0) },
          uGlow: { value: new Array(STOP_COUNT).fill(0) },
          uCentre: { value: journey.centers.map((c) => new THREE.Vector3(...c)) },
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
    []
  );
  useEffect(() => () => material.dispose(), [material]);

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
        <bufferAttribute attach="attributes-aCluster" args={[data.cluster, 1]} />
      </bufferGeometry>
    </points>
  );
}
