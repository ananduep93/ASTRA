"use client";

/**
 * Each squad's ambient motion, ONE draw call for all five. Every point belongs
 * to a squad and moves in the vertex shader (time-based, so it is alive from
 * the first second, even before you scroll):
 *   0 Arts      flowing curved ribbons of points
 *   1 Tech      a strict grid with horizontal scan lines sweeping up
 *   2 Gaming    blocky pixel glitch bursts
 *   3 Business  rising bars and a climbing line
 *   4 Fun       confetti that falls, bounces and settles again
 * Points are laid out in the squad camera's own frame (x right, y up, z toward
 * the camera) behind the program shapes, so each layer fills that squad's view
 * whatever its camera angle. Only the squad(s) you are near are drawn.
 * Colours: opposite of the background behind each point, a few in the red accent.
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { colors } from "@/lib/theme";
import { hero, journey, identity as ID, ambient as AMB } from "@/lib/motion";
import { SQUADS } from "@/data/programs";
import { identities } from "@/data/story";
import { scrollState } from "@/lib/scrollStore";
import { seededRandom } from "@/lib/textTargets";
import { STOP_COUNT, STOP_VIEWS, toVh, ambientPresenceAt } from "@/lib/journey";
import { worldUniforms, bgMaskGLSL } from "./worldUniforms";

const HALF_FOV = THREE.MathUtils.degToRad(hero.camera.fov / 2);
const KIND = { ribbons: 0, grid: 1, glitch: 2, bars: 3, confetti: 4 };

/** Rotation from each squad camera's frame to the world (same as the shape plane's facing). */
const BASES = STOP_VIEWS.slice(0, STOP_COUNT).map(({ eye, target, roll }) => {
  const cam = new THREE.PerspectiveCamera();
  cam.position.set(...eye);
  cam.lookAt(...target);
  cam.rotateZ(roll);
  cam.updateMatrixWorld();
  return new THREE.Matrix3().setFromMatrix4(cam.matrixWorld);
});

function build(perSquad) {
  const total = perSquad * STOP_COUNT;
  const squad = new Float32Array(total);
  const kind = new Float32Array(total);
  const r = new Float32Array(total * 4);
  const rand = seededRandom(9090);
  for (let i = 0; i < total; i++) {
    const k = Math.floor(i / perSquad);
    squad[i] = k;
    kind[i] = KIND[identities[SQUADS[k]].ambient];
    for (let c = 0; c < 4; c++) r[i * 4 + c] = rand();
  }
  return { squad, kind, r, total };
}

const vertexShader = /* glsl */ `
  attribute float aSquad;   // 0..4: which squad's place and presence
  attribute float aKind;    // 0..4: which motion (from data/story.js identities)
  attribute vec4 aR;        // four random numbers per point

  uniform float uPresence[5];
  uniform vec3 uCentre[5];
  uniform mat3 uBasis[5];
  uniform float uSpeed[5];
  uniform float uAmount[5];
  uniform float uSquare[5];
  uniform float uTime, uScale, uMaxPx, uSize, uFogNear, uFogFar, uRedShare;

  varying float vAlpha;
  varying float vRed;
  varying float vSquare;

  float hash(float n) { return fract(sin(n) * 43758.5453); }

  void main() {
    int k = int(aSquad + 0.5);
    float pres = uPresence[k];
    if (pres < 0.001) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // off screen: costs nothing
      gl_PointSize = 0.0;
      vAlpha = 0.0;
      return;
    }
    int kind = int(aKind + 0.5);
    float t = uTime * uSpeed[k];
    float A = uAmount[k];
    vec3 p;
    float size = 1.0;
    float a = 1.0;
    float glow = 0.0;

    if (kind == 0) {
      // Ribbons: five curved bands of points flowing sideways.
      float band = floor(aR.x * 5.0);
      float u = fract(aR.y + t * 0.035 * (1.0 + band * 0.25));
      float x = mix(-10.0, 10.0, u);
      p = vec3(x,
               (band - 2.0) * 1.4 + sin(x * 0.45 + t * 0.7 + band * 1.7) * 1.1 * A + (aR.z - 0.5) * 0.35,
               -2.0 - band * 0.9 + sin(x * 0.3 + t * 0.4) * 0.6);
      size = 0.7 + aR.w * 0.7;
      a = 0.8;
    } else if (kind == 1) {
      // Tech: a strict floor grid in perspective (lines of points) with a scan sweeping
      // toward the camera, and horizontal scan lines rising behind the shapes.
      if (aR.w < 0.3) {
        float line = floor(aR.z * 3.0);
        float y = mod(t * 1.2 + line * 3.4, 10.0) - 5.0;
        p = vec3(mix(-10.0, 10.0, aR.x), y, -4.0);
        glow = 1.0;
        size = 0.8;
        a = 0.9;
      } else {
        float gx = (floor(aR.x * 25.0) - 12.0) * 0.8;
        float gz = 2.0 - floor(aR.y * 20.0) * 0.8;
        bool along = aR.z < 0.5;
        float x = along ? mix(-10.0, 10.0, fract(aR.y * 7.3)) : gx;
        float z = along ? gz : mix(2.0, -14.0, fract(aR.x * 5.7));
        p = vec3(x, -2.6, z);
        float scanZ = 2.0 - mod(t * 3.0, 16.0);
        glow = exp(-abs(z - scanZ) * 1.5);
        size = 0.7 + glow * 0.6;
        a = mix(0.55, 1.0, glow);
      }
    } else if (kind == 2) {
      // Glitch: blocks of pixels; every burst, a random few jump sideways and light up.
      vec2 cell = floor(aR.xy * vec2(14.0, 9.0));
      float burst = floor(t * 1.6);
      float h = hash(cell.x * 13.0 + cell.y * 71.0 + burst * 7.0);
      vec2 base = (cell - vec2(7.0, 4.5)) * 1.2;
      vec2 px = floor(aR.zw * 4.0) * 0.22; // a 4 x 4 pixel block per cell
      p = vec3(base + px, -3.0);
      float on = step(0.74, h);
      p.x += on * (hash(h * 9.0) - 0.5) * 2.6 * A;
      glow = on;
      size = 1.1 + on * 0.5;
      a = mix(0.22, 1.0, on);
    } else if (kind == 3) {
      if (aR.w < 0.3) {
        // Climbing line: drawn left to right, then again.
        float u = aR.x;
        float head = fract(t * 0.12) * 1.25;
        p = vec3(mix(-9.0, 9.0, u), -3.0 + u * 6.0 + sin(u * 10.0 + t * 0.5) * 0.35, -2.5);
        a = step(u, head);
        glow = smoothstep(head - 0.08, head, u);
        size = 0.9 + glow;
      } else {
        // Rising bars: ten columns that grow and settle, taller to the right.
        float b = floor(aR.x * 10.0);
        float h = (1.0 + b * 0.45) * (0.65 + 0.35 * sin(t * 0.9 + b * 0.8)) * A;
        p = vec3((b - 4.5) * 1.8 + (aR.z - 0.5) * 0.9, -3.5 + aR.y * h, -3.0);
        a = 0.7;
      }
    } else {
      // Confetti: falls with gravity, bounces off a floor, flutters.
      float ph = fract(aR.y + t * 0.16 * (0.6 + aR.z));
      float floorY = -3.2;
      float y = ph < 0.8
        ? mix(5.0, floorY, pow(ph / 0.8, 2.0))
        : floorY + sin((ph - 0.8) / 0.2 * 3.14159) * 1.1 * A;
      p = vec3((aR.x - 0.5) * 18.0 + sin(t * 0.8 + aR.w * 30.0) * 0.5, y, -1.0 - aR.z * 5.0);
      size = 0.6 + 0.9 * abs(sin(t * 3.0 + aR.x * 40.0)); // spinning flakes catch the light
    }

    vec3 world = uCentre[k] + uBasis[k] * p;
    vec4 mv = modelViewMatrix * vec4(world, 1.0);
    float dist = -mv.z;
    gl_PointSize = clamp(uSize * size * uScale / max(dist, 0.001), 1.0, uMaxPx);
    gl_Position = projectionMatrix * mv;
    float fog = smoothstep(0.3, 2.0, dist) * (1.0 - smoothstep(uFogNear, uFogFar, dist));
    vAlpha = pres * a * fog;
    vRed = max(step(1.0 - uRedShare, fract(aR.w * 13.7 + aR.x * 5.3)), glow * step(0.5, aR.z) * 0.8);
    vSquare = uSquare[k];
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uLight;
  uniform vec3 uDark;
  uniform vec3 uRed;
  varying float vAlpha;
  varying float vRed;
  varying float vSquare;
  ${bgMaskGLSL}

  void main() {
    vec2 c = abs(gl_PointCoord - 0.5);
    float d = mix(length(c), max(c.x, c.y), vSquare);
    float a = mix(smoothstep(0.5, 0.12, d), step(d, 0.42), vSquare) * vAlpha;
    if (a < 0.01) discard;
    vec3 tone = mix(uLight, uDark, bgWhite(gl_FragCoord.xy)); // opposite of the background
    gl_FragColor = vec4(mix(tone, uRed, vRed), a);
    #include <colorspace_fragment>
  }
`;

export default function SquadAmbient({ perSquad = 800 }) {
  const ref = useRef();
  const data = useMemo(() => build(perSquad), [perSquad]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          ...worldUniforms,
          uPresence: { value: new Array(STOP_COUNT).fill(0) },
          uCentre: { value: journey.centers.map((c) => new THREE.Vector3(...c)) },
          uBasis: { value: BASES },
          uSpeed: { value: SQUADS.map((sq) => ID[sq].ambient.speed) },
          uAmount: { value: SQUADS.map((sq) => ID[sq].ambient.amount) },
          uSquare: { value: SQUADS.map((sq) => (identities[sq].dots === "square" ? 1 : 0)) },
          uTime: { value: 0 },
          uScale: { value: 1 },
          uMaxPx: { value: 24 },
          uSize: { value: AMB.size },
          uRedShare: { value: AMB.redShare },
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
    let any = false;
    for (let i = 0; i < STOP_COUNT; i++) {
      const v = ambientPresenceAt(s, i);
      u.uPresence.value[i] = v;
      if (v > 0.001) any = true;
    }
    pts.visible = any; // nothing to draw between stops' layers: skip the draw call
    if (!any) return;
    u.uTime.value = state.clock.elapsedTime;
    u.uScale.value = (state.size.height * state.viewport.dpr * 0.5) / Math.tan(HALF_FOV);
    u.uMaxPx.value = 24 * state.viewport.dpr;
  });

  return (
    <points ref={ref} material={material} frustumCulled={false} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[new Float32Array(data.total * 3), 3]} />
        <bufferAttribute attach="attributes-aSquad" args={[data.squad, 1]} />
        <bufferAttribute attach="attributes-aKind" args={[data.kind, 1]} />
        <bufferAttribute attach="attributes-aR" args={[data.r, 4]} />
      </bufferGeometry>
    </points>
  );
}
