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

/* The programs section (after the briefing). */
export const programsCopy = {
  label: "Mission files", // EDITABLE
  // Big kinetic headline: one array entry per line. The count comes from data/programs.js.
  headline: (count) => [`${count} missions.`, "Pick yours."], // EDITABLE
  filterLabel: "Filter by squad",
  all: "All",
  open: "Open mission file", // screen-reader hint on each card
};

/* The program detail (a card expanded to full screen). Details stay TBA in data/programs.js. */
export const detailCopy = {
  label: "Mission file",
  fields: [
    { key: "date", label: "Date" },
    { key: "venue", label: "Venue" },
    { key: "fee", label: "Fee" },
    { key: "rules", label: "Rules" },
  ],
  register: "Register",
  registerSoon: "Opens soon",
  close: "Close mission file",
  prev: "Previous mission",
  next: "Next mission",
  swipeHint: "Swipe or use the arrows for the next mission", // EDITABLE
};

/* Menu labels. */
export const menu = {
  open: "Open menu",
  close: "Close menu",
  title: "Navigate the story",
  home: "Home",
  briefing: "Briefing",
  programs: "Programs",
  finale: "Finale / Register",
};

/* HUD status text (top right). */
export const hudStatus = {
  searching: "Signal: searching", // before the opening line has played
  detected: "Signal: detected", // after it
  briefing: "Mission briefing", // during the briefing
  programs: "Mission files", // in the programs section
  inbound: "All squads: inbound", // finale, while the dots gather
  online: "All squads: online", // finale, once the logo has formed
};

/* The finale after the programs. */
export const finale = {
  line: "Five squads. One sky.", // EDITABLE
  cta: "Registration opens soon", // stays disabled until the real form (Phase 7)
};
