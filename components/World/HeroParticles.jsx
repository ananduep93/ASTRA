"use client";

/**
 * The hero: one THREE.Points whose every particle knows where it starts
 * (scattered star), where it ends (a pixel of "ASTRA 2027"), a random seed and
 * a size. ALL movement happens in the vertex shader, driven by a few uniforms
 * computed from the shared smoothed scroll value. No per-particle JavaScript
 * runs per frame.
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { colors } from "@/lib/theme";
import { hero } from "@/lib/motion";
import { scrollState, rangeLinear, rangeSmooth, snapSmooth } from "@/lib/scrollStore";
import { waitForFont, sampleWords, fillTargets, seededRandom } from "@/lib/textTargets";
import { worldUniforms, bgMaskGLSL, heroStatus } from "./worldUniforms";
import { heroProgress, toVh } from "@/lib/journey";
import { storyStatus } from "@/lib/storyStatus";

const WHITE = new THREE.Color(colors.white);
const BLACK = new THREE.Color(colors.black);
const { particles: P, camera: CAM } = hero;
const HALF_FOV = THREE.MathUtils.degToRad(CAM.fov / 2);

const isAmbient = (i) => i % P.ambientEvery === 0;
const isRed = (i) => !isAmbient(i) && i % P.redEvery === 3;

/** World units per screen pixel on the letter plane (z = 0) at the start camera. */
const worldPerPx = () => (2 * CAM.startZ * Math.tan(HALF_FOV)) / window.innerHeight;

/** Scattered star positions filling the start view, from near to far. */
function fillScatter(out, aspect) {
  const rand = seededRandom(2027);
  const n = out.length / 3;
  for (let i = 0; i < n; i++) {
    // Distance in front of the start camera, biased far so the opening sky is calm.
    const dist = hero.scatter.near + Math.pow(rand(), 0.6) * (hero.scatter.far - hero.scatter.near);
    const halfH = dist * Math.tan(HALF_FOV) * 1.15;
    out[i * 3] = (rand() * 2 - 1) * halfH * aspect;
    out[i * 3 + 1] = (rand() * 2 - 1) * halfH;
    out[i * 3 + 2] = CAM.startZ - dist;
  }
}

/** All per-particle data. Targets start equal to scatter until the font is sampled. */
function buildParticles(count) {
  const scatter = new Float32Array(count * 3);
  fillScatter(scatter, window.innerWidth / window.innerHeight);
  const target = scatter.slice();
  const seed = new Float32Array(count);
  const size = new Float32Array(count);
  const kind = new Float32Array(count); // 0 letter, 1 red letter, 2 background star
  const rand = seededRandom(31);
  for (let i = 0; i < count; i++) {
    seed[i] = rand();
    const r = rand();
    if (isAmbient(i)) size[i] = P.starSize * (r > 0.96 ? 2 : 0.7 + r * 0.6);
    else if (isRed(i)) size[i] = P.redSize;
    else size[i] = P.size * (0.8 + r * 0.4);
    kind[i] = isAmbient(i) ? 2 : isRed(i) ? 1 : 0;
  }
  return { scatter, target, seed, size, kind };
}

const vertexShader = /* glsl */ `
  attribute vec3 aScatter;
  attribute vec3 aTarget;
  attribute float aSeed;
  attribute float aSize;
  attribute float aKind;    // 0 letter, 1 red letter, 2 background star

  uniform float uTime;
  uniform float uFogNear, uFogFar;
  uniform float uScatterSize, uScatterAlpha;
  uniform float uAlpha;     // global fade-in once the letter shapes are ready
  uniform float uForm;      // 0..1 assembled (time-based intro, or finished by scrolling)
  uniform float uShimmer;   // 0..1 hold shimmer strength
  uniform float uStream;    // 0..1 through the "stream" range
  uniform float uScale;     // pixels per world unit at distance 1
  uniform float uMaxPx;
  uniform float uStagger, uCurl, uSwirl;
  uniform float uDriftAmp, uDriftSpeed, uShimmerAmp, uShimmerSpeed;
  uniform float uSpread, uDepth;

  varying float vAlpha;
  varying float vRed;

  float easeInOutCubic(float t) {
    return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0;
  }

  void main() {
    // 1. Gather: each particle leaves at its own moment (stagger by seed).
    float local = clamp((uForm - aSeed * uStagger) / (1.0 - uStagger), 0.0, 1.0);
    float e = easeInOutCubic(local);

    // Spiral in: rotate the "still to travel" vector as it shrinks.
    vec3 away = aScatter - aTarget;
    float ang = (1.0 - e) * uSwirl * (aSeed - 0.5) * 2.0;
    float c = cos(ang), s = sin(ang);
    away.xy = vec2(c * away.x - s * away.y, s * away.x + c * away.y);
    vec3 pos = aTarget + away * (1.0 - e);

    // Curl: a sideways bow that peaks mid-flight, so paths curve, not line up.
    vec3 bow = normalize(vec3(sin(aSeed * 91.7), cos(aSeed * 47.3), sin(aSeed * 23.1) * 0.6) + 1e-4);
    pos += bow * sin(3.14159265 * e) * uCurl * (0.4 + aSeed);

    // Idle: scattered stars float (almost invisible), letters shimmer during the hold.
    float t = uTime;
    pos += vec3(sin(t * uDriftSpeed + aSeed * 6.2832), cos(t * uDriftSpeed * 0.8 + aSeed * 12.566), 0.0)
           * uDriftAmp * (1.0 - e);
    pos += vec3(sin(t * uShimmerSpeed + aSeed * 40.0), cos(t * uShimmerSpeed * 0.8 + aSeed * 23.0), 0.0)
           * uShimmerAmp * e * uShimmer;

    // 2. Stream: letters dissolve outward and rush toward / past the camera.
    float st = clamp((uStream - aSeed * 0.3) / 0.7, 0.0, 1.0);
    st *= st;
    vec2 radial = normalize(aTarget.xy + vec2(aSeed - 0.5, fract(aSeed * 7.13) - 0.5) * 0.4 + 1e-4);
    pos.xy += radial * st * uSpread * (0.5 + aSeed);
    pos.z += st * uDepth * (0.4 + aSeed);

    // Letter particles stay small and dim while scattered, so the opening sky is calm.
    float isLetter = 1.0 - step(1.5, aKind);
    float grow = mix(1.0, mix(uScatterSize, 1.0, e), isLetter);
    float glow = mix(1.0, mix(uScatterAlpha, 1.0, e), isLetter);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    float dist = -mvPosition.z;
    gl_PointSize = clamp(aSize * grow * uScale / max(dist, 0.001), 1.0, uMaxPx);
    gl_Position = projectionMatrix * mvPosition;

    float twinkle = 1.0 - uShimmer * e * 0.25 * (0.5 + 0.5 * sin(t * 2.3 + aSeed * 60.0));
    float nearFade = smoothstep(0.3, 2.0, dist);                // fade points right at the lens
    float farFade = 1.0 - smoothstep(uFogNear, uFogFar, dist);  // fog: fade out, works on any background
    vAlpha = nearFade * farFade * twinkle * glow * uAlpha;
    vRed = step(0.5, aKind) * (1.0 - step(1.5, aKind));
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uLight;
  uniform vec3 uDark;
  uniform vec3 uRedColor;
  uniform float uRedMix;
  varying float vAlpha;
  varying float vRed;
  ${bgMaskGLSL}

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.12, d) * vAlpha; // soft round dot
    if (a < 0.01) discard;
    // Always the opposite of the background right behind this dot.
    vec3 col = mix(uLight, uDark, bgWhite(gl_FragCoord.xy));
    col = mix(col, uRedColor, vRed * uRedMix);
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
  }
`;

export default function HeroParticles({ count }) {
  const points = useRef();
  const data = useMemo(() => buildParticles(count), [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          ...worldUniforms, // shared objects: inversion + resolution
          uTime: { value: 0 },
          uForm: { value: 0 },
          uShimmer: { value: 0 },
          uStream: { value: 0 },
          uScale: { value: 1 },
          uMaxPx: { value: P.maxPointPx },
          uStagger: { value: hero.path.stagger },
          uCurl: { value: hero.path.curl },
          uSwirl: { value: hero.path.swirl },
          uDriftAmp: { value: hero.idle.driftAmp },
          uDriftSpeed: { value: hero.idle.driftSpeed },
          uShimmerAmp: { value: hero.idle.shimmerAmp },
          uShimmerSpeed: { value: hero.idle.shimmerSpeed },
          uSpread: { value: hero.stream.spread },
          uDepth: { value: hero.stream.depth },
          uFogNear: { value: hero.fog.near },
          uFogFar: { value: hero.fog.far },
          uScatterSize: { value: hero.scatter.letterSize },
          uScatterAlpha: { value: hero.scatter.letterAlpha },
          uLight: { value: WHITE },
          uDark: { value: BLACK },
          uRedColor: { value: new THREE.Color(colors.red) },
          uRedMix: { value: 0 },
          uAlpha: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
      }),
    []
  );
  useEffect(() => () => material.dispose(), [material]);

  // Intro state. "waiting" until the letter shapes are sampled, then the frame
  // loop starts the time-based assemble (or skips it if reloaded mid-page).
  const intro = useRef({ phase: "waiting", start: 0, skip: false });

  // Sample the headline into letter positions; again after a resize.
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.world = "live"; // DOM: headline is visually hidden, scroll room is added
    let cancelled = false;
    let timer;
    let lastW = window.innerWidth;
    let lastH = window.innerHeight;

    async function resample() {
      const words = [...document.querySelectorAll("[data-hero-word]")];
      if (!words.length) return;
      await waitForFont(words[0]);
      // Wait one ticker frame so the layout change above has been applied.
      await new Promise((resolve) => gsap.ticker.add(resolve, true));
      if (cancelled || !points.current) return;
      const sample = sampleWords(words);
      if (!sample) return;
      const geo = points.current.geometry;
      const scatter = geo.attributes.aScatter.array;
      const target = geo.attributes.aTarget.array;
      fillScatter(scatter, window.innerWidth / window.innerHeight);
      target.set(scatter); // ambient stars keep target = scatter
      fillTargets(target, sample, worldPerPx(), seededRandom(11), isAmbient);
      geo.attributes.aScatter.needsUpdate = true;
      geo.attributes.aTarget.needsUpdate = true;
      if (intro.current.phase === "waiting") intro.current.phase = "sampled"; // first time only
    }

    resample();
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Phones resize a little when the address bar hides: ignore that.
      if (w === lastW && Math.abs(h - lastH) < 150) return;
      lastW = w;
      lastH = h;
      clearTimeout(timer);
      timer = setTimeout(resample, hero.resampleDebounceMs);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
      delete html.dataset.world;
    };
  }, []);

  useFrame((state) => {
    const field = points.current;
    if (!field) return;
    const u = field.material.uniforms;
    const p = heroProgress(toVh(scrollState.smooth)); // hero runs until the camera reaches Arts
    const tl = hero.timeline;
    const now = state.clock.elapsedTime;
    const it = intro.current;

    // Start the intro on the first frame after the letters are sampled.
    if (it.phase === "sampled") {
      it.phase = "running";
      it.start = now;
      // Reloaded while already scrolled down: skip the assemble, just fade in.
      it.skip = scrollState.progress > hero.intro.skipAbove;
      if (it.skip) snapSmooth(); // show the exact state for this position, no glide
    }
    const running = it.phase === "running";
    const elapsed = running ? now - it.start : 0;
    const timeIntro = it.skip ? 1 : Math.min(1, elapsed / hero.intro.duration);
    // Scrolling through the hold also finishes the assemble, so it is never left half-built.
    const form = running ? Math.max(timeIntro, rangeLinear(p, tl.hold)) : 0;

    u.uAlpha.value = running ? Math.min(1, elapsed / (it.skip ? hero.intro.skipFadeIn : hero.intro.fadeIn)) : 0;
    u.uTime.value = now;
    u.uForm.value = form;
    u.uShimmer.value = rangeSmooth(form, hero.intro.shimmerIn) * (1 - rangeSmooth(p, tl.shimmerOut));
    u.uRedMix.value = rangeSmooth(form, hero.intro.redIn);
    u.uStream.value = rangeLinear(p, tl.stream);
    heroStatus.intro = form;
    heroStatus.alpha = u.uAlpha.value;
    heroStatus.skipped = it.skip;
    // For the DOM story beats (opening transmission, HUD): no three.js needed there.
    storyStatus.heroForm = form;
    storyStatus.heroRunning = running;
    storyStatus.heroSkipped = it.skip;
    u.uScale.value = (state.size.height * state.viewport.dpr * 0.5) / Math.tan(HALF_FOV);
    u.uMaxPx.value = P.maxPointPx * state.viewport.dpr;
  });

  return (
    <points ref={points} material={material} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.target, 3]} />
        <bufferAttribute attach="attributes-aScatter" args={[data.scatter, 3]} />
        <bufferAttribute attach="attributes-aTarget" args={[data.target, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[data.seed, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[data.size, 1]} />
        <bufferAttribute attach="attributes-aKind" args={[data.kind, 1]} />
      </bufferGeometry>
    </points>
  );
}
