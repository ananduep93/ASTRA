"use client";

/**
 * The ONE fixed 3D canvas behind the whole site.
 *
 * Hero: stars assemble "ASTRA 2027", the camera flies through the letters, the
 * star-iris turns the world white for the briefing. The camera rests while the
 * programs section (a normal page section) is read, then glides to the finale.
 * The shape dots form the finale logo, and a program's shape in its detail view.
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
import { colors, brand } from "@/lib/theme";
import { hero, journey } from "@/lib/motion";
import { scrollState, getLenis, tripActive, snapSmooth } from "@/lib/scrollStore";
import { TIERS } from "@/lib/quality";
import {
  toVh,
  toProgress,
  toneAt,
  cameraAt,
  partAt,
  CAMERA_POINTS,
  totalVh,
  HERO_END,
  finaleProgress,
  finaleSharedProgress,
  briefingSharedProgress,
} from "@/lib/journey";
import { storyStatus } from "@/lib/storyStatus";
import { detailState } from "@/lib/detail";
import HeroParticles from "./HeroParticles";
import ProgramField from "./ProgramField";
import { worldUniforms, bgMaskGLSL, heroStatus } from "./worldUniforms";

const BLACK = new THREE.Color(colors.black);
const WHITE = new THREE.Color(colors.white);

// One smooth path: start, the end of the hero flight, the finale.
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
  const dir = useMemo(() => new THREE.Vector3(), []);
  const ahead = useMemo(() => new THREE.Vector3(0, 0, -1), []);
  useFrame((state) => {
    const s = toVh(scrollState.smooth);
    const cam = cameraAt(s);
    const pos = state.camera.position;
    CAMERA_CURVE.getPoint(cam.t, pos);
    // Direction: straight ahead (hero flight) blended into "look at the target" by cam.aim.
    dir.set(cam.look[0], cam.look[1], cam.look[2]).sub(pos).normalize();
    if (cam.aim < 1) dir.lerp(ahead, 1 - cam.aim).normalize();
    look.copy(pos).add(dir);
    state.camera.lookAt(look);

    const tone = toneAt(s);
    worldUniforms.uFromW.value = tone.fromW;
    worldUniforms.uToW.value = tone.toW;
    worldUniforms.uMix.value = tone.mix;
    // Star-iris only once its mask has loaded (until then the plain circle is used).
    worldUniforms.uIris.value = tone.iris && worldUniforms.uIrisTex.value ? 1 : 0;
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
  uniform vec3 uRed;
  ${bgMaskGLSL}
  void main() {
    vec3 col = mix(uBlack, uWhite, bgWhite(gl_FragCoord.xy));
    col = mix(col, uRed, irisAccent(gl_FragCoord.xy)); // star-iris edge glow + shockwave (hero only)
    gl_FragColor = vec4(col, 1.0);
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
        uniforms: { ...worldUniforms, uBlack: { value: BLACK }, uWhite: { value: WHITE }, uRed: { value: new THREE.Color(colors.red) } },
        depthTest: false,
        depthWrite: false,
      }),
    []
  );
  useEffect(() => () => material.dispose(), [material]);

  // The star-iris mask (soft logo silhouette). Shared by every shader through worldUniforms.
  useEffect(() => {
    let tex;
    new THREE.TextureLoader().load(brand.iris, (t) => {
      tex = t;
      t.colorSpace = THREE.NoColorSpace; // a mask, not a colour
      t.minFilter = THREE.LinearFilter;
      t.generateMipmaps = false;
      worldUniforms.uIrisTex.value = t;
    });
    return () => {
      worldUniforms.uIrisTex.value = null;
      tex?.dispose();
    };
  }, []);

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
    // Scroll map for tests.
    window.__astraJourney = {
      totalVh,
      programsAt: () => toProgress(HERO_END + 100), // the programs section filling the screen
      finaleAt: finaleSharedProgress, // finale progress f (0..1) -> shared progress
      lenisStopped: () => getLenis()?.isStopped ?? null,
      tripActive,
      briefingAt: briefingSharedProgress, // briefing progress f (0..1) -> shared progress
      heroAt: (h) => toProgress(h * journey.heroVh), // hero progress (before the briefing) -> shared
      // Tests only: scroll there AND set the scene there at once (skips the guided pace).
      jump: (p) => {
        const y = p * (document.documentElement.scrollHeight - window.innerHeight);
        const lenis = getLenis();
        if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
        else window.scrollTo(0, y);
        requestAnimationFrame(() => requestAnimationFrame(snapSmooth));
      },
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
      progress: scrollState.smooth, // scene progress (paced)
      scroll: scrollState.progress, // real scroll position
      vh: s,
      part: partAt(s),
      detail: detailState.open ? detailState.programId : null,
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
        <ProgramField count={cfg.particles} />
        {debug && <DebugStats tier={tier} count={cfg.particles} />}
      </Canvas>
    </div>
  );
}
