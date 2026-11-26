/**
 * Every line of story copy on the site, in one place. Edit freely.
 *
 * EDITABLE = placeholder creative copy written for the mood; change it to
 * whatever the team wants. Nothing here is an event fact: dates, venues,
 * fees and rules stay "TBA" until the organisers confirm them.
 */
import { TBA } from "./programs.js"; // ".js" so scripts/check-shapes.mjs can load it in plain Node

/* Opening: types in under the ASTRA 2027 headline once the stars have formed it. */
export const transmission = {
  line: "Signal detected. Five squads needed.", // EDITABLE
};

/* One dossier per squad. Keys must match SQUADS in data/programs.js. */
export const dossiers = {
  Arts: {
    codename: "Canvas", // EDITABLE
    mission: "Make the ordinary worth a second look.", // EDITABLE
  },
  Tech: {
    codename: "Circuit", // EDITABLE
    mission: "Build it, test it, ship it before time runs out.", // EDITABLE
  },
  Gaming: {
    codename: "Respawn", // EDITABLE
    mission: "Read the map. Hold the line. Outplay the room.", // EDITABLE
  },
  Business: {
    codename: "Ledger", // EDITABLE
    mission: "Lead the room and make every call count.", // EDITABLE
  },
  Fun: {
    codename: "Confetti", // EDITABLE
    mission: "Follow the clues and keep the energy loud.", // EDITABLE
  },
};

/** Status line shown on each dossier and in the HUD, e.g. "SQUAD ARTS: ONLINE". */
export const squadStatus = (squad) => `Squad ${squad}: online`;

/** Shown under each squad's mission until the organisers publish a briefing. */
export const briefing = `Briefing: ${TBA}`;

/** Label above each program, e.g. "Mission file 03 / 15". */
export const missionFileLabel = "Mission file";

/* HUD status text (top right) outside the squad stops. */
export const hudStatus = {
  searching: "Signal: searching", // before the opening line has played
  detected: "Signal: detected", // after it
  inbound: "All squads: inbound", // finale, while the squads travel in
  online: "All squads: online", // finale, once the logo has formed
};

/* The finale after the Fun stop. */
export const finale = {
  line: "Five squads. One sky.", // EDITABLE
  cta: "Registration opens soon", // stays disabled until the real form (Phase 7)
};
