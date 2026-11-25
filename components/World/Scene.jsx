"use client";

/**
 * The ONE fixed 3D canvas behind the whole site.
 *
 * Phase 1 test content: a field of small white points that drift slowly, and a
 * camera that flies forward as scroll progress goes 0 -> 1.
 *
 * Loop: the canvas uses frameloop="never" and is advanced from gsap.ticker,
 * so Lenis, GSAP and three.js all share one requestAnimationFrame loop.
 */
import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { colors } from "@/lib/theme";
import { cameraDamping, prefersReducedMotion } from "@/lib/motion";
import { scrollState } from "@/lib/scrollStore";
import { TIERS } from "@/lib/quality";

const CAMERA_START_Z = 6;

/** Drives R3F from gsap.ticker instead of R3F's own requestAnimationFrame. */
function TickerDriver() {
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    const tick = () => advance(performance.now());
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [advance]);
  return null;
}

function StarField({ count, depth, reducedMotion }) {
  const points = useRef();

  // Random positions in a long box in front of the camera (seeded, so stable).
  const positions = useMemo(() => {
    let seed = 20270;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rand() - 0.5) * 16;
      arr[i * 3 + 1] = (rand() - 0.5) * 12;
      arr[i * 3 + 2] = CAMERA_START_Z - rand() * (depth + 8);
    }
    return arr;
  }, [count, depth]);

  useFrame((state, delta) => {
    const cam = state.camera;
    // Camera flies forward with scroll; damped so it glides instead of jumps.
    const targetZ = CAMERA_START_Z - scrollState.progress * depth;
    cam.position.z = THREE.MathUtils.damp(cam.position.z, targetZ, cameraDamping, delta);

    if (!reducedMotion && points.current) {
      points.current.rotation.z += delta * 0.015; // slow drift
      points.current.position.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.15;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={colors.white}
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.9}
        depthWrite={false}
      />
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
        camera={{ position: [0, 0, CAMERA_START_Z], fov: 60, near: 0.1, far: 60 }}
        fallback={null}
      >
        <fog attach="fog" args={[colors.black, 2, 16]} />
        <TickerDriver />
        <StarField count={cfg.particles} depth={depth} reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
