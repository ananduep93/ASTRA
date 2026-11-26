/**
 * Uniforms shared by every shader in the world (same objects, not copies), so
 * the background and the particles always agree on the inversion state.
 * WorldRig in Scene.jsx writes them once per frame.
 */
import * as THREE from "three";
import { iris } from "@/lib/motion";
import { brand } from "@/lib/theme";

export const worldUniforms = {
  uFromW: { value: 0 }, // background whiteness before the current change (0 black, 1 white)
  uToW: { value: 0 }, // ...and after it
  uMix: { value: 0 }, // 0..1: how far the new tone has opened from the centre
  uResolution: { value: new THREE.Vector2(1, 1) }, // drawing buffer size in pixels
  // Star-iris (the hero's change only): 1 = open through the logo silhouette instead of a circle.
  uIris: { value: 0 },
  uIrisTex: { value: null }, // public/brand/astra-iris.png, loaded by Scene.jsx
  uIrisAspect: { value: brand.irisSize[0] / brand.irisSize[1] },
};

/** Read-only snapshot of the hero state, for ?debug=1 tests. */
export const heroStatus = { intro: 0, alpha: 0, skipped: false };

const f = (n) => n.toFixed(4);

/**
 * GLSL: how "white" the background is at a given pixel (0 black, 1 white).
 * Each tone change opens the new tone from the centre of the screen outward
 * as uMix goes 0 -> 1, with a soft edge, so there is never a flat grey frame
 * or a flash. During the hero's change (uIris = 1) it opens through the ASTRA
 * logo's silhouette: a small star that grows until it fills the screen, with
 * a circle growing behind it to fill the logo's inner gaps. Dots use it to
 * always take the opposite tone. Fragment shaders only (it samples a texture).
 */
export const bgMaskGLSL = /* glsl */ `
  uniform float uFromW;
  uniform float uToW;
  uniform float uMix;
  uniform vec2 uResolution;
  uniform float uIris;
  uniform sampler2D uIrisTex;
  uniform float uIrisAspect;

  // Centred screen coords, in screen heights (y up).
  vec2 screenUv(vec2 fragCoord) { return (fragCoord - 0.5 * uResolution) / uResolution.y; }

  // Logo height in screen heights at this point of the change.
  float irisScale() { return mix(${f(iris.startScale)}, ${f(iris.endScale)}, pow(uMix, ${f(iris.growPower)})); }

  // Soft logo mask value (0..1) at a screen position; 0 outside the logo image.
  // Blends from the logo silhouette (red) to the gap-closed silhouette (green) late in the change.
  float irisLevel(vec2 uv) {
    float s = irisScale();
    vec2 tc = vec2(uv.x / (s * uIrisAspect), uv.y / s) + 0.5;
    if (tc.x < 0.0 || tc.x > 1.0 || tc.y < 0.0 || tc.y > 1.0) return 0.0;
    vec2 m = texture2D(uIrisTex, tc).rg;
    return mix(m.r, m.g, smoothstep(${f(iris.fill[0])}, ${f(iris.fill[1])}, uMix));
  }

  float irisOpen(vec2 uv) {
    // Crisp, anti-aliased silhouette at any scale: the soft mask acts like a distance field,
    // cut at 0.5 with an edge about one screen pixel wide.
    float a = irisLevel(uv);
    float w = max(fwidth(a) * 1.2, 1e-4);
    float star = smoothstep(0.5 - w, 0.5 + w, a);
    return max(star, step(0.999, uMix));
  }

  float bgWhite(vec2 fragCoord) {
    vec2 uv = screenUv(fragCoord);
    float m;
    if (uIris > 0.5) {
      m = irisOpen(uv);
    } else {
      float r = mix(-0.35, 1.75, uMix);
      m = 1.0 - smoothstep(r - 0.35, r + 0.35, length(uv));
    }
    return mix(uFromW, uToW, m);
  }

  // Background only: the thin red edge glow along the star's outline and one shockwave ring.
  float irisAccent(vec2 fragCoord) {
    if (uIris < 0.5) return 0.0;
    vec2 uv = screenUv(fragCoord);
    float a = irisLevel(uv);
    // A thin line on the aperture edge, the same few pixels wide at any scale (screen-space derivative).
    float edgePx = abs(a - 0.5) / max(fwidth(a), 1e-4);
    float line = 1.0 - smoothstep(0.0, ${f(iris.glowPx)}, edgePx);
    float glow = line * ${f(iris.glow)} * sin(3.14159 * min(1.0, uMix / ${f(iris.glowFade)}));
    float t = clamp((uMix - ${f(iris.ring[0])}) / ${f(iris.ring[1] - iris.ring[0])}, 0.0, 1.0);
    float rr = t * ${f(iris.ringReach)};
    float ring = exp(-pow((length(uv) - rr) / ${f(iris.ringWidth)}, 2.0)) * (1.0 - t) * step(0.001, t) * ${f(iris.ringStrength)};
    return clamp(max(glow, ring), 0.0, 1.0);
  }
`;
