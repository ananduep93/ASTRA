/**
 * Every line of copy in the issue, in one place. Edit freely.
 *
 * EDITABLE = placeholder creative copy written for the comic mood. Nothing
 * here is an event fact: dates, venues, fees and rules stay "TBA" until the
 * organisers confirm them. Sound words are invented.
 */
import { TBA } from "./programs.js";

export const cover = {
  masthead: "ASTRA",
  issue: "#2027",
  strap: "Inter-college arts & tech fest", // fact: what ASTRA is
  college: "Don Bosco College, Mampetta", // fact
  tagline: "Signal detected", // EDITABLE
  sound: "BZZT!", // EDITABLE, invented sound word
  inset: "Inside: five squads", // EDITABLE, the small panel the reader zooms into
};

/* The opening page: four panels. `art` picks a drawing in components/Issue/Art.jsx. */
export const opening = [
  { art: "radar", caption: "Somewhere above Mampetta. 00:01.", sound: "BEEP", from: "left" }, // EDITABLE
  { art: "screen", caption: "The receiver wakes up.", bubble: "Signal detected.", from: "right" }, // EDITABLE
  { art: "burst", caption: "The message is short.", shout: "Five squads needed.", from: "top" }, // EDITABLE
  { art: "roster", caption: "Chapter 1 begins.", from: "bottom" }, // EDITABLE; lists the squads from data
];

/* Chapters. Only Arts is built in Phase B1. */
export const chapters = {
  Arts: {
    number: 1,
    sound: "SPLASH!", // EDITABLE
    caption: "Chapter 1. The squad that makes the ordinary worth a second look.", // EDITABLE
    filesLabel: "Mission files", // EDITABLE
    next: "To be continued: Chapter 2, Tech.", // EDITABLE
  },
};

/* The detail sheet of a program. */
export const sheet = {
  label: "Mission file",
  fields: [
    { key: "date", label: "Date" },
    { key: "venue", label: "Venue" },
    { key: "fee", label: "Fee" },
    { key: "rules", label: "Rules" },
  ],
  register: "Register (opens soon)",
  close: "Close",
  tapHint: "Tap a panel for its mission file", // EDITABLE
};

/* Menu. Chapters not built yet are listed but disabled. */
export const menu = {
  open: "Open menu",
  close: "Close menu",
  title: "Contents",
  cover: "Cover",
  opening: "Opening page",
  soon: "Coming soon",
};

export { TBA };
