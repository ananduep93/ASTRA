/**
 * Tiny store for the program detail panel: which program is open (or null),
 * and which button opened it (so focus can return there on close).
 * Roster buttons call openProgram(); ProgramDialog subscribes.
 */
let openId = null;
let trigger = null;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());

export const programDialogStore = {
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  getSnapshot: () => openId,
  getServerSnapshot: () => null,
  trigger: () => trigger,
};

export function openProgram(id, fromEl) {
  trigger = fromEl ?? null;
  openId = id;
  emit();
}

export function clearProgram() {
  openId = null;
  emit();
}
