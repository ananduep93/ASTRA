/**
 * Opens the program detail sheet from anywhere (a panel tap) without React
 * state: a tiny event, the same pattern as a dialog service.
 * `returnTo` is the element that gets focus back when the sheet closes.
 */
export const SHEET_EVENT = "astra:sheet";

export function openSheet(programId, returnTo) {
  window.dispatchEvent(new CustomEvent(SHEET_EVENT, { detail: { programId, returnTo } }));
}
