"use client";

/**
 * The ONE fixed 3D canvas behind the whole site.
 *
 * Hero: stars assemble "ASTRA 2027", the camera flies through the letters and
 * arrives at Arts. Journey: the same camera glides along one spline through the
 * five squad clusters, the background alternating white / black.
 * Everything reads scrollState.smooth, the shared smoothed scroll value,
 * through the scroll map in lib/journey.js.
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
import { scrollState } from "@/lib/scrollStore";
import { TIERS } from "@/lib/quality";
import {
  toVh,
  toneAt,
  cameraAt,
  activeStopAt,
  focusAt,
  CAMERA_POINTS,
  TOTAL_SCROLL_VH,
  ROSTERS,
  programHoldVh,
  finaleProgress,
  finaleSharedProgress,
} from "@/lib/journey";
import { storyStatus } from "@/lib/storyStatus";
import HeroParticles from "./HeroParticles";
import SquadClusters from "./SquadClusters";
import ProgramField from "./ProgramField";
import { worldUniforms, bgMaskGLSL, heroStatus } from "./worldUniforms";

const BLACK = new THREE.Color(colors.black);
const WHITE = new THREE.Color(colors.white);

// One smooth path through every viewpoint (start, Arts, Tech, Gaming, Business, Fun).
const CAMERA_CURVE = new THREE.CatmullRomCurve3(
  CAMERA_POINTS.map((p) => new THREE.Vector3(...p)),
  false,
  "centripetal"
);

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

/** Camera along the spline and the background tone, both from the shared value. */
function WorldRig() {
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame((state) => {
    const s = toVh(scrollState.smooth);
    const cam = cameraAt(s);
    CAMERA_CURVE.getPoint(cam.t, state.camera.position);
    if (cam.look) look.set(cam.look[0], cam.look[1], cam.look[2]);
    else look.copy(state.camera.position).z -= 1; // hero: straight ahead
    state.camera.lookAt(look);

    const tone = toneAt(s);
    worldUniforms.uFromW.value = tone.fromW;
    worldUniforms.uToW.value = tone.toW;
    worldUniforms.uMix.value = tone.mix;
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
    gl_FragColor = vec4(mix(uBlack, uWhite, bgWhite(gl_FragCoord.xy)), 1.0);
    #include <colorspace_fragment>
  }
`;

/** Full-screen background; each new tone opens from the centre of the screen. */
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
    // Scroll map for tests: hold position (shared progress 0..1) of every program.
    window.__astraJourney = {
      totalVh: TOTAL_SCROLL_VH,
      holds: ROSTERS.map((r, i) =>
        r.map((p, j) => ({ id: p.id, squad: p.squad, progress: programHoldVh(i, j) / TOTAL_SCROLL_VH }))
      ),
      finaleAt: finaleSharedProgress, // finale progress f (0..1) -> shared progress
    };
    return () => {
      delete window.__astraRender;
      delete window.__astraJourney;
    };
  }, [gl, scene, camera]);
  useFrame(({ gl }) => {
    const s = toVh(scrollState.smooth);
    window.__astraDebug = {
      tier,
      particles: count,
      calls: gl.info.render.calls,
      points: gl.info.render.points,
      dpr: gl.getPixelRatio(),
      progress: scrollState.smooth,
      vh: s,
      stop: activeStopAt(s),
      focus: focusAt(s),
      intro: heroStatus.intro,
      alpha: heroStatus.alpha,
      introSkipped: heroStatus.skipped,
      transmission: storyStatus.transmission,
      finale: finaleProgress(s),
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
        camera={{ position: [0, 0, hero.camera.startZ], fov: hero.camera.fov, near: 0.1, far: 90 }}
        fallback={null}
      >
        <TickerDriver />
        <WorldRig />
        <Backdrop />
        <HeroParticles count={cfg.particles} />
        <SquadClusters ambient={cfg.ambient} haze={cfg.haze} />
        <ProgramField count={cfg.particles} />
        {debug && <DebugStats tier={tier} count={cfg.particles} />}
      </Canvas>
    </div>
  );
}
