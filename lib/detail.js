/**
 * The program detail, shared without React state (like lib/scrollStore.js):
 *  - the programs grid asks to open a program (openDetail -> an event the
 *    detail view listens to)
 *  - the detail view tells the canvas which shape to form, where, and when
 *    (detailState, read every frame by components/World/ProgramField.jsx).
 * No three.js in here.
 */
export const DETAIL_EVENT = "astra:detail";

/** Ask the detail view to open `programId`, browsing `list` (ids in the current filter). */
export function openDetail(programId, list, returnTo) {
  window.dispatchEvent(new CustomEvent(DETAIL_EVENT, { detail: { programId, list, returnTo } }));
}

/**
 * What the canvas shows for the detail:
 *  open       the detail is on screen (the canvas is raised above the page)
 *  programId  the program whose shape forms
 *  squad      its squad (signature, accent colour, dot style)
 *  rect       screen rectangle the shape fills (the detail's art area)
 *  version    bumps on every change, so the canvas knows to re-sample
 *  switching  true when moving to the next / previous program (morph from the last shape)
 */
export const detailState = { open: false, programId: null, squad: null, rect: null, version: 0, switching: false };

export function showDetailShape({ programId, squad, rect, switching }) {
  Object.assign(detailState, { open: true, programId, squad, rect, switching: !!switching });
  detailState.version += 1;
}

export function hideDetailShape() {
  detailState.open = false;
  detailState.version += 1;
}
