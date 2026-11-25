/**
 * Uniforms shared by every shader in the world (same objects, not copies), so
 * the background and the particles always agree on the inversion state.
 * WorldRig in Scene.jsx writes them once per frame.
 */
import * as THREE from "three";

export const worldUniforms = {
  uFromW: { value: 0 }, // background whiteness before the current change (0 black, 1 white)
  uToW: { value: 0 }, // ...and after it
  uMix: { value: 0 }, // 0..1: how far the new tone has opened from the centre
  uResolution: { value: new THREE.Vector2(1, 1) }, // drawing buffer size in pixels
};

/** Read-only snapshot of the hero state, for ?debug=1 tests. */
export const heroStatus = { intro: 0, alpha: 0, skipped: false };

/**
 * GLSL: how "white" the background is at a given pixel (0 black, 1 white).
 * Each tone change opens the new tone from the centre of the screen outward
 * as uMix goes 0 -> 1, with a soft edge, so there is never a flat grey frame
 * or a flash. Dots use it to always take the opposite tone.
 */
export const bgMaskGLSL = /* glsl */ `
  uniform float uFromW;
  uniform float uToW;
  uniform float uMix;
  uniform vec2 uResolution;
  float bgWhite(vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * uResolution) / uResolution.y;
    float r = mix(-0.35, 1.75, uMix);
    float m = 1.0 - smoothstep(r - 0.35, r + 0.35, length(uv));
    return mix(uFromW, uToW, m);
  }
`;
