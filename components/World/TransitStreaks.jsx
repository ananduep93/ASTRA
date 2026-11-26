"use client";

/**
 * The transition between squads: during each ~40vh glide, a burst of streaks
 * rushes past the camera (one LineSegments draw call), strongest mid-glide,
 * while the background inverts from the centre. Laid out in the camera's own
 * space, so it always surrounds the view. Hidden (no draw call) outside glides.
 */
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { colors } from "@/lib/theme";
import { streaks as S } from "@/lib/motion";
import { scrollState } from "@/lib/scrollStore";
import { seededRandom } from "@/lib/textTargets";
import { toVh, warpAt } from "@/lib/journey";
import { worldUniforms, bgMaskGLSL } from "./worldUniforms";

function build(count) {
  const seg = new Float32Array(count * 2 * 4);
  const end = new Float32Array(count * 2);
  const rand = seededRandom(4040);
  for (let i = 0; i < count; i++) {
    const v = [rand(), rand(), rand(), rand() < S.redShare ? 1 : 0];
    for (let e = 0; e < 2; e++) {
      seg.set(v, (i * 2 + e) * 4);
      end[i * 2 + e] = e;
    }
  }
  return { seg, end, verts: count * 2 };
}

const vertexShader = /* glsl */ `
  attribute vec4 aSeg;   // angle, radius, phase, red
  attribute float aEnd;  // 0 = far end of the streak, 1 = near end
  uniform float uTime, uWarp, uLen, uDepth, uSpread, uSpeed, uPeak;
  varying float vAlpha;
  varying float vRed;

  void main() {
    float ang = aSeg.x * 6.2832;
    float r = mix(0.8, uSpread, aSeg.y);
    // Rushes toward the camera, wraps around at the far end.
    float z = -1.0 - (uDepth - mod(aSeg.z * uDepth + uTime * uSpeed, uDepth));
    z = min(z + aEnd * uLen * uWarp, -0.5);
    vec3 p = vec3(cos(ang) * r, sin(ang) * r, z);
    gl_Position = projectionMatrix * vec4(p, 1.0); // camera space: always around the view
    vAlpha = uWarp * uPeak * mix(1.0, 0.15, aEnd) * smoothstep(uDepth, uDepth * 0.6, -z);
    vRed = aSeg.w;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uLight;
  uniform vec3 uDark;
  uniform vec3 uRed;
  varying float vAlpha;
  varying float vRed;
  ${bgMaskGLSL}

  void main() {
    if (vAlpha < 0.01) discard;
    vec3 tone = mix(uLight, uDark, bgWhite(gl_FragCoord.xy));
    gl_FragColor = vec4(mix(tone, uRed, vRed), vAlpha);
    #include <colorspace_fragment>
  }
`;

export default function TransitStreaks({ count = 200 }) {
  const ref = useRef();
  const data = useMemo(() => build(count), [count]);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          ...worldUniforms,
          uTime: { value: 0 },
          uWarp: { value: 0 },
          uLen: { value: S.length },
          uDepth: { value: S.depth },
          uSpread: { value: S.spread },
          uSpeed: { value: S.speed },
          uPeak: { value: S.peak },
          uLight: { value: new THREE.Color(colors.white) },
          uDark: { value: new THREE.Color(colors.black) },
          uRed: { value: new THREE.Color(colors.red) },
        },
        transparent: true,
        depthWrite: false,
        depthTest: false,
      }),
    []
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    const lines = ref.current;
    if (!lines) return;
    const w = warpAt(toVh(scrollState.smooth));
    lines.visible = w > 0.001;
    if (!lines.visible) return;
    lines.material.uniforms.uWarp.value = w;
    lines.material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <lineSegments ref={ref} material={material} frustumCulled={false} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[new Float32Array(data.verts * 3), 3]} />
        <bufferAttribute attach="attributes-aSeg" args={[data.seg, 4]} />
        <bufferAttribute attach="attributes-aEnd" args={[data.end, 1]} />
      </bufferGeometry>
    </lineSegments>
  );
}
