/**
 * Uniforms shared by every shader in the world (same objects, not copies), so
 * the background and the particles always agree on the inversion state.
 * WorldRig in Scene.jsx writes them once per frame.
 */
import * as THREE from "three";

export const worldUniforms = {
  uInvert: { value: 0 }, // 0 = black world, 1 = white world
  uResolution: { value: new THREE.Vector2(1, 1) }, // drawing buffer size in pixels
};

/**
 * GLSL: how "white" the background is at a given pixel. White opens from the
 * centre of the screen outward as uInvert goes 0 -> 1 (light at the end of
 * the flight), with a soft edge, so there is never a flat grey frame or a flash.
 */
export const bgMaskGLSL = /* glsl */ `
  uniform float uInvert;
  uniform vec2 uResolution;
  float bgMask(vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * uResolution) / uResolution.y;
    float r = mix(-0.35, 1.75, uInvert);
    return 1.0 - smoothstep(r - 0.35, r + 0.35, length(uv));
  }
`;
