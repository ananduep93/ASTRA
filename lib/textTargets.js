/**
 * Turns the real DOM headline into particle target positions.
 *
 * It draws each word of the <h1> onto a hidden canvas at exactly the place the
 * browser laid it out (same font, size and line breaks, so phones get the
 * two-line ASTRA / 2027 version automatically), reads back which pixels are
 * lit, and converts those screen pixels to 3D points on the z = 0 plane.
 * Browser-only.
 */

/** Wait until the headline's web font is really loaded (not the fallback). */
export async function waitForFont(el) {
  const cs = getComputedStyle(el);
  try {
    await document.fonts.load(`${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, el.textContent);
  } catch {
    /* fall through: document.fonts.ready below still waits for pending loads */
  }
  await document.fonts.ready;
}

/**
 * Lit pixels of the headline words, in screen pixels.
 * Returns { lit: Int32Array of pixel indices, width, scale } or null.
 */
export function sampleWords(words) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  // Sample at roughly 720px wide whatever the screen: enough detail, fast.
  const scale = Math.min(2, Math.max(0.5, 720 / W));
  const cw = Math.ceil(W * scale);
  const ch = Math.ceil(H * scale);

  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  for (const word of words) {
    const cs = getComputedStyle(word);
    const r = word.getBoundingClientRect();
    ctx.font = `${cs.fontWeight} ${parseFloat(cs.fontSize) * scale}px ${cs.fontFamily}`;
    const m = ctx.measureText(word.textContent);
    // An inline element's box starts at the font's ascent above the baseline.
    ctx.fillText(word.textContent, r.left * scale, r.top * scale + m.fontBoundingBoxAscent);
  }

  const data = ctx.getImageData(0, 0, cw, ch).data;
  let count = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 128) count++;
  if (!count) return null;
  const lit = new Int32Array(count);
  for (let i = 3, n = 0; i < data.length; i += 4) if (data[i] > 128) lit[n++] = (i - 3) >> 2;
  return { lit, width: cw, scale };
}

/**
 * Lit pixels of an SVG path (100 x 100 grid) drawn into a screen rectangle,
 * keeping its aspect ratio, with `padding` (share of the box) left empty.
 * Same output format as sampleWords, so fillTargets works on it unchanged.
 */
export function sampleShape(shape, rect, padding = 0.06, bold = 0) {
  // Only the shape's own square is drawn and read back (not the whole screen): a small
  // canvas, so sampling never stalls a frame. Pixels are mapped back to the screen by ox / oy.
  const size = Math.min(rect.width, rect.height) * (1 - padding * 2);
  const x = rect.left + (rect.width - size) / 2;
  const y = rect.top + (rect.height - size) / 2;
  const scale = Math.min(2, Math.max(0.5, 360 / Math.max(1, size)));
  const pad = Math.ceil((bold / 100) * size * scale) + 2;
  const cw = Math.ceil(size * scale) + pad * 2;
  const ch = cw;
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.setTransform((size / 100) * scale, 0, 0, (size / 100) * scale, pad, pad);
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = bold; // the same boldening as the printed cards (lib/halftone.js)
  ctx.lineJoin = "round";
  // A shape is one path, or several parts filled one after another (their union).
  for (const part of shape.parts ?? [shape]) {
    const path = new Path2D(part.d);
    ctx.fill(path, part.rule === "evenodd" ? "evenodd" : "nonzero");
    if (bold > 0) ctx.stroke(path);
  }

  const data = ctx.getImageData(0, 0, cw, ch).data;
  let count = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 128) count++;
  if (!count) return null;
  const lit = new Int32Array(count);
  for (let i = 3, n = 0; i < data.length; i += 4) if (data[i] > 128) lit[n++] = (i - 3) >> 2;
  return { lit, width: cw, scale, ox: x - pad / scale, oy: y - pad / scale };
}

/**
 * Lit (non-transparent) pixels of an image drawn into a screen rectangle,
 * keeping its aspect ratio ("contain"), with `padding` (share of the box) left
 * empty. Used for the ASTRA logo in the finale. Same output as sampleWords.
 */
export function sampleImage(img, rect, padding = 0) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const scale = Math.min(2, Math.max(0.5, 720 / W));
  const cw = Math.ceil(W * scale);
  const ch = Math.ceil(H * scale);
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  const k = Math.min(rect.width / img.naturalWidth, rect.height / img.naturalHeight) * (1 - padding * 2);
  const w = img.naturalWidth * k;
  const h = img.naturalHeight * k;
  const x = rect.left + (rect.width - w) / 2;
  const y = rect.top + (rect.height - h) / 2;
  ctx.drawImage(img, x * scale, y * scale, w * scale, h * scale);

  const data = ctx.getImageData(0, 0, cw, ch).data;
  let count = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 128) count++;
  if (!count) return null;
  const lit = new Int32Array(count);
  for (let i = 3, n = 0; i < data.length; i += 4) if (data[i] > 128) lit[n++] = (i - 3) >> 2;
  return { lit, width: cw, scale };
}

/**
 * Fill `out` (xyz per particle) with points on the letters.
 * `worldPerPx` converts screen pixels to world units on the z = 0 plane.
 * `skip(i)` returns true for particles that should NOT be letters.
 */
export function fillTargets(out, sample, worldPerPx, rand, skip) {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const { lit, width, scale, ox = 0, oy = 0 } = sample; // ox / oy: where the sampled canvas sits on screen
  const n = out.length / 3;
  for (let i = 0; i < n; i++) {
    if (skip(i)) continue;
    const idx = lit[Math.floor(rand() * lit.length)];
    const px = ox + ((idx % width) + rand()) / scale;
    const py = oy + (Math.floor(idx / width) + rand()) / scale;
    out[i * 3] = (px - W / 2) * worldPerPx;
    out[i * 3 + 1] = -(py - H / 2) * worldPerPx;
    out[i * 3 + 2] = (rand() - 0.5) * 0.12; // a hint of depth
  }
}

/** Small seeded random generator: same numbers on every load. */
export function seededRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
