"use client";

/**
 * The ONE fixed 3D canvas behind the whole site.
 *
 * Phase 1 test content: a field of small round white points with a barely
 * visible idle drift, and a camera that flies forward as scroll progress goes
 * 0 -> 1, settling smoothly (damped) when scrolling stops.
 *
 * Loop: the canvas uses frameloop="never" and is advanced from gsap.ticker,
 * so Lenis, GSAP and three.js all share one requestAnimationFrame loop.
 */
import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { colors } from "@/lib/theme";
import { world, prefersReducedMotion } from "@/lib/motion";
import { scrollState } from "@/lib/scrollStore";
import { TIERS } from "@/lib/quality";

const CAMERA_START_Z = 6;
const CAMERA_FOV = 60;

/** Drives R3F from gsap.ticker instead of R3F's own requestAnimationFrame. */
function TickerDriver() {
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    // With frameloop="never", R3F expects the timestamp in SECONDS.
    // gsap.ticker already passes seconds, so hand it straight through.
    const tick = (time) => advance(time);
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [advance]);
  return null;
}

// Round, soft-edged points with per-point size. Size shrinks with distance
// (size attenuation) and fades into the scene fog.
const vertexShader = /* glsl */ `
  attribute float aSize;
  uniform float uScale;
  #include <fog_pars_vertex>
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(aSize * uScale / -mvPosition.z, 1.0, 10.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  #include <fog_pars_fragment>
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.15, d); // soft round dot
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(uColor, alpha * uOpacity);
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

/**
 * Positions in a long box in front of the camera, plus a size per point.
 * Seeded random, so the field is identical on every load.
 */
function makeField(count, depth) {
  let seed = 20270;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (rand() - 0.5) * 16;
    positions[i * 3 + 1] = (rand() - 0.5) * 12;
    positions[i * 3 + 2] = CAMERA_START_Z - rand() * (depth + 8);
    // Most points tiny; about 1 in 25 noticeably bigger.
    sizes[i] = rand() > 0.96 ? 0.05 + rand() * 0.03 : 0.015 + rand() * 0.015;
  }
  return { positions, sizes };
}

function StarField({ count, depth, reducedMotion }) {
  const points = useRef();
  const twist = useRef(0);
  const drift = useRef(0);

  const { positions, sizes } = useMemo(() => makeField(count, depth), [count, depth]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: THREE.UniformsUtils.merge([
          THREE.UniformsLib.fog,
          {
            uColor: { value: new THREE.Color(colors.white) },
            uOpacity: { value: 0.9 },
            uScale: { value: 1 },
          },
        ]),
        transparent: true,
        depthWrite: false,
        fog: true,
      }),
    []
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, world.maxDelta);
    const { camera, size, viewport } = state;
    const field = points.current;
    if (!field) return;

    // Pixels per world unit at distance 1, for size attenuation.
    field.material.uniforms.uScale.value =
      (size.height * viewport.dpr * 0.5) / Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));

    // Camera: target comes only from the shared scroll value; damping makes it
    // glide there and settle smoothly once scrolling stops.
    const targetZ = CAMERA_START_Z - scrollState.progress * depth;
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, world.cameraDamping, delta);

    // Field turn: a little from scroll (damped) plus an almost invisible idle drift.
    twist.current = THREE.MathUtils.damp(
      twist.current,
      scrollState.progress * world.scrollTwist,
      world.twistDamping,
      delta
    );
    if (!reducedMotion) drift.current += world.idleDrift * delta;

    field.rotation.z = twist.current + drift.current;
    field.position.y = reducedMotion
      ? 0
      : Math.sin(state.clock.elapsedTime * world.idleBobSpeed) * world.idleBobAmplitude;
  });

  return (
    <points ref={points} material={material}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
    </points>
  );
}

export default function Scene({ tier = "high" }) {
  const cfg = TIERS[tier] ?? TIERS.mid;
  const reducedMotion = prefersReducedMotion();
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const depth = isMobile ? cfg.depth * 0.7 : cfg.depth; // shorter trip on phones

  return (
    <div
      aria-hidden="true"
      data-world="canvas"
      data-tier={tier}
      className="pointer-events-none fixed inset-0 z-0"
    >
      <Canvas
        frameloop="never"
        dpr={cfg.dpr}
        gl={{ antialias: cfg.antialias, powerPreference: "high-performance", alpha: true }}
        camera={{ position: [0, 0, CAMERA_START_Z], fov: CAMERA_FOV, near: 0.1, far: 60 }}
        fallback={null}
      >
        <fog attach="fog" args={[colors.black, 2, 16]} />
        <TickerDriver />
        <StarField count={cfg.particles} depth={depth} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
