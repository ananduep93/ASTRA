/**
 * The program detail, shared without React state (like lib/scrollStore.js):
 *  - a card asks to open a program (openDetail -> an event the detail view listens to)
 *  - the detail view tells the canvas which shape to form, where, from where
 *    and when (detailState, read every frame by components/World/ProgramField.jsx).
 * No three.js in here.
 */
export const DETAIL_EVENT = "astra:detail";

/**
 * open    the detail view is on screen (opening, open or closing): the rails pause
 * lifted  the canvas is above the page: it draws no backdrop (transparent), so the
 *         card surface under it and the page around it show through
 */
export const detailUi = { open: false, lifted: false };

/** Ask the detail view to open `programId`, browsing `list` (ids of its squad). */
export function openDetail(programId, list, returnTo) {
  window.dispatchEvent(new CustomEvent(DETAIL_EVENT, { detail: { programId, list, returnTo } }));
}

/**
 * What the canvas shows for the detail:
 *  open       the dots are on screen (the canvas is raised above the page)
 *  phase      "open"   the dots start ON the printed halftone dots `from` (screen px),
 *                      burst a little, then converge into the shape
 *             "cloud"  no card to start from (opened from a link): they gather from a soft cloud
 *             "switch" from wherever they are, through turbulence, into the next shape
 *             "close"  from wherever they are back onto the card's printed dots `to`
 *  programId  the program whose shape forms; squad = its signature and accent
 *  rect       screen rectangle the shape fills (the detail's art area)
 *  from       { xy: Float32Array of screen px, r: dot radius px } halftone dots, or null
 *  to         { xy, r } the card's printed dots the dots land on (close), or null
 *  version    bumps on every change, so the canvas knows to re-sample
 *  shown      the canvas sets this to `version` once that change is on screen
 *  fresh      the canvas sets this to `version` after refilling every buffer for it (tests)
 *  warm       { programId, rect }: sample this shape now (cached), ahead of showDetailShape,
 *             so the frame where the dots take over has less to do; the canvas clears it
 */
export const detailState = {
  open: false,
  phase: null,
  programId: null,
  squad: null,
  rect: null,
  from: null,
  to: null,
  version: 0,
  shown: -1,
  fresh: -1,
  warm: null,
};

/** Ask the canvas to prepare `programId`'s shape for `rect` in a quiet frame (cached). */
export function warmDetailShape(programId, rect) {
  detailState.warm = { programId, rect };
}

/** Form `programId`'s shape: phase "open", "cloud" or "switch". */
export function showDetailShape({ programId, squad, rect, phase, from = null }) {
  Object.assign(detailState, { open: true, phase, programId, squad, rect, from, to: null });
  detailState.version += 1;
}

/** Close: the dots fall back onto the card's printed dots `to` (screen px), then hideDetailShape(). */
export function collapseDetailShape(to) {
  Object.assign(detailState, { phase: "close", to });
  detailState.version += 1;
}

/**
 * Hide the dots: at once (the printed card has taken over), or with `fade` (closing
 * without a card to land on).
 */
export function hideDetailShape({ fade = false } = {}) {
  detailState.open = false;
  detailState.phase = fade ? "fade" : null;
  detailState.version += 1;
}
