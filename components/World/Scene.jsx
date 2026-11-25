"use client";

/**
 * The ONE fixed 3D canvas behind the whole site.
 *
 * Phase 2: the hero. Stars gather into "ASTRA 2027", hold, the camera flies
 * through the letters (background inverts to white) and arrives at Arts.
 * Everything reads scrollState.smooth, the shared smoothed scroll value.
 *
 * Loop: frameloop="never" and advanced from gsap.ticker, so Lenis, GSAP and
 * three.js share one requestAnimationFrame loop. Paused while the tab is hidden.
 */
import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { colors } from "@/lib/theme";
import { hero } from "@/lib/motion";
import { scrollState, rangeLinear, rangeSmooth } from "@/lib/scrollStore";
import { TIERS } from "@/lib/quality";
import HeroParticles from "./HeroParticles";
import ArtsCluster from "./ArtsCluster";
import { worldUniforms, bgMaskGLSL, heroStatus } from "./worldUniforms";

const BLACK = new THREE.Color(colors.black);
const WHITE = new THREE.Color(colors.white);
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Drives R3F from gsap.ticker instead of R3F's own requestAnimationFrame. */
function TickerDriver() {
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    // With frameloop="never", R3F expects the timestamp in SECONDS (gsap gives seconds).
    const tick = (time) => {
      if (document.hidden) return; // pause rendering when the tab is hidden
      advance(time);
    };
    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, [advance]);
  return null;
}

/** Camera path and the black -> white inversion, both from the shared value. */
function WorldRig() {
  useFrame((state) => {
    const p = scrollState.smooth;
    const tl = hero.timeline;
    const e = easeInOutCubic(rangeLinear(p, tl.camera));
    state.camera.position.z = hero.camera.startZ + (hero.camera.endZ - hero.camera.startZ) * e;

    worldUniforms.uInvert.value = rangeSmooth(p, tl.invert);
    state.gl.getDrawingBufferSize(worldUniforms.uResolution.value);
  });
  return null;
}

const backdropVertex = /* glsl */ `
  void main() { gl_Position = vec4(position.xy, 0.0, 1.0); } // full-screen, ignores the camera
`;
const backdropFragment = /* glsl */ `
  uniform vec3 uBlack;
  uniform vec3 uWhite;
  ${bgMaskGLSL}
  void main() {
    gl_FragColor = vec4(mix(uBlack, uWhite, bgMask(gl_FragCoord.xy)), 1.0);
    #include <colorspace_fragment>
  }
`;

/** Full-screen background: black, opening to white from the centre during the flight. */
function Backdrop() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: backdropVertex,
        fragmentShader: backdropFragment,
        uniforms: { ...worldUniforms, uBlack: { value: BLACK }, uWhite: { value: WHITE } },
        depthTest: false,
        depthWrite: false,
      }),
    []
  );
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh material={material} renderOrder={-1} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

/**
 * Only with ?debug=1: exposes draw calls etc. on window.__astraDebug, and the
 * renderer on window.__astraRender so tests can time a real render.
 */
function DebugStats({ tier, count }) {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    window.__astraRender = { gl, scene, camera };
    return () => delete window.__astraRender;
  }, [gl, scene, camera]);
  useFrame(({ gl }) => {
    window.__astraDebug = {
      tier,
      particles: count,
      calls: gl.info.render.calls,
      points: gl.info.render.points,
      dpr: gl.getPixelRatio(),
      progress: scrollState.smooth,
      intro: heroStatus.intro,
      alpha: heroStatus.alpha,
      introSkipped: heroStatus.skipped,
    };
  });
  return null;
}

export default function Scene({ tier = "high", debug = false }) {
  const cfg = TIERS[tier] ?? TIERS.mid;
  const wrap = useRef(null);

  return (
    <div
      ref={wrap}
      aria-hidden="true"
      data-world="canvas"
      data-tier={tier}
      className="pointer-events-none fixed inset-0 z-0"
      // Fade the canvas in once it exists, so a reload mid-page never pops.
      style={{ opacity: 0, transition: "opacity var(--astra-dur-fast) var(--astra-ease-out)" }}
    >
      <Canvas
        onCreated={() => {
          if (wrap.current) wrap.current.style.opacity = "1";
        }}
        frameloop="never"
        dpr={cfg.dpr}
        gl={{ antialias: cfg.antialias, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, hero.camera.startZ], fov: hero.camera.fov, near: 0.1, far: 80 }}
        fallback={null}
      >
        <TickerDriver />
        <WorldRig />
        <Backdrop />
        <HeroParticles count={cfg.particles} />
        <ArtsCluster count={cfg.arts} />
        {debug && <DebugStats tier={tier} count={cfg.particles} />}
      </Canvas>
    </div>
  );
}
