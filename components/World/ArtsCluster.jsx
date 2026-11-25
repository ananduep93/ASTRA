"use client";

/**
 * Arrival point: a small cluster of red-glow points standing for the Arts squad.
 * Placeholder shape for now. It gathers in and fades up during "arrive".
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { colors } from "@/lib/theme";
import { hero } from "@/lib/motion";
import { scrollState, rangeSmooth } from "@/lib/scrollStore";
import { seededRandom } from "@/lib/textTargets";

const HALF_FOV = THREE.MathUtils.degToRad(hero.camera.fov / 2);

function buildCluster(count) {
  const rand = seededRandom(404);
  const pos = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    // Denser in the middle: radius biased toward 0, slightly flattened.
    const r = hero.arts.radius * Math.pow(rand(), 1.8);
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(rand() * 2 - 1);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.8;
    pos[i * 3 + 2] = r * Math.cos(phi) * 0.6;
    size[i] = hero.arts.size * (0.4 + rand() * 0.8);
    seed[i] = rand();
  }
  return { pos, size, seed };
}

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  uniform float uScale;
  uniform float uReveal;
  uniform float uTime;
  varying float vAlpha;
  void main() {
    // Gather in from a looser cloud as it is revealed.
    vec3 p = position * mix(2.2, 1.0, uReveal);
    p += vec3(sin(uTime * 0.6 + aSeed * 30.0), cos(uTime * 0.5 + aSeed * 17.0), 0.0) * 0.02;
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = clamp(aSize * uScale / max(-mvPosition.z, 0.001), 1.0, 64.0);
    gl_Position = projectionMatrix * mvPosition;
    vAlpha = uReveal * smoothstep(0.0, 0.3, uReveal - aSeed * 0.5);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = smoothstep(0.2, 0.0, d);
    float halo = smoothstep(0.5, 0.05, d);
    float a = (core + halo * 0.35) * vAlpha; // bright core + soft glow
    if (a < 0.01) discard;
    gl_FragColor = vec4(uColor, min(a, 1.0));
    #include <colorspace_fragment>
  }
`;

export default function ArtsCluster({ count }) {
  const ref = useRef();
  const data = useMemo(() => buildCluster(count), [count]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uColor: { value: new THREE.Color(colors.red) },
          uScale: { value: 1 },
          uReveal: { value: 0 },
          uTime: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
      }),
    []
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state, delta) => {
    const cluster = ref.current;
    if (!cluster) return;
    const reveal = rangeSmooth(scrollState.smooth, hero.timeline.arrive);
    const u = cluster.material.uniforms;
    u.uReveal.value = reveal;
    u.uTime.value = state.clock.elapsedTime;
    u.uScale.value = (state.size.height * state.viewport.dpr * 0.5) / Math.tan(HALF_FOV);
    cluster.visible = reveal > 0.001; // skip drawing it until we get close
    cluster.rotation.y += hero.arts.spin * Math.min(delta, 0.1);
  });

  return (
    <points ref={ref} material={material} position={[0, 0, hero.arts.z]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[data.size, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[data.seed, 1]} />
      </bufferGeometry>
    </points>
  );
}
