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

/*
 * Briefing: right after the screen turns white, before the first squad.
 * Date and venue stay TBA until the organisers confirm them. The program and
 * squad counts are NOT typed here: they are counted from data/programs.js.
 */
export const briefingCopy = {
  label: "Mission briefing", // EDITABLE
  // Big kinetic headline: one array entry per line.
  headline: ["One sky.", "Every campus.", "Five squads."], // EDITABLE
  // What ASTRA is (2-3 lines). EDITABLE placeholder; only the college and the arts + tech fest are facts.
  about:
    "ASTRA is the inter-college arts and tech fest of Don Bosco College, Mampetta. " +
    "Students from campuses across the region form squads and take on missions in arts, tech, gaming, business and fun.",
  college: "Don Bosco College, Mampetta",
  year: "2027",
  factsLabel: "Mission facts", // EDITABLE
  facts: {
    date: { label: "Date", value: TBA },
    venue: { label: "Venue", value: TBA },
    programs: { label: "Programs" }, // value = number of programs in data/programs.js
    squads: { label: "Squads" }, // value = number of squads in data/programs.js
  },
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

/**
 * Each squad's scene identity (what the stop LOOKS like). The numbers that
 * tune it (camera angle, dot density, sizes, motion speeds) live in
 * lib/motion.js under `identity`.
 *   tone     background: "black" | "nearBlack" | "white" | "offWhite" (lib/theme.js).
 *            Neighbours alternate light/dark so every move between squads inverts.
 *   ambient  the motion around the shapes, visible from the first second:
 *            "ribbons" | "grid" | "glitch" | "bars" | "confetti"
 *   dots     "round" or "square" (pixel-like) dots for this squad
 */
export const identities = {
  Arts: { tone: "offWhite", ambient: "ribbons", dots: "round" },
  Tech: { tone: "black", ambient: "grid", dots: "round" },
  Gaming: { tone: "white", ambient: "glitch", dots: "square" },
  Business: { tone: "nearBlack", ambient: "bars", dots: "round" },
  Fun: { tone: "offWhite", ambient: "confetti", dots: "round" },
};

/* Menu labels. Squad items use the squad names from data/programs.js. */
export const menu = {
  open: "Open menu",
  close: "Close menu",
  title: "Navigate the story",
  home: "Home",
  finale: "Finale / Register",
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
  briefing: "Mission briefing", // during the briefing
  inbound: "All squads: inbound", // finale, while the squads travel in
  online: "All squads: online", // finale, once the logo has formed
};

/* The finale after the Fun stop. */
export const finale = {
  line: "Five squads. One sky.", // EDITABLE
  cta: "Registration opens soon", // stays disabled until the real form (Phase 7)
};
