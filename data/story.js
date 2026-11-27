/**
 * Every line of story copy on the site, in one place. Edit freely.
 *
 * EDITABLE = placeholder creative copy written for the mood; change it to
 * whatever the team wants. Nothing here is an event fact: dates, venues,
 * fees and rules stay "TBA" until the organisers confirm them.
 */
/* Opening: types in under the ASTRA 2027 headline once the stars have formed it. */
export const transmission = {
  line: "Signal detected. Five squads needed.", // EDITABLE
};

/* The programs section (right after the star-iris). */
export const programsCopy = {
  label: "Mission files", // EDITABLE
  // Big kinetic headline: one array entry per line. The count comes from data/programs.js.
  headline: (count) => [`${count} missions.`, "Pick yours."], // EDITABLE
  // One short line under the title. Facts only: the college, the kind of fest, the year.
  subline: "Inter-college arts and tech fest, Don Bosco College, Mampetta, 2027.", // EDITABLE
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
  programs: "Programs",
  finale: "Finale / Register",
};

/* HUD status text (top right). */
export const hudStatus = {
  searching: "Signal: searching", // before the opening line has played
  detected: "Signal: detected", // after it
  programs: "Mission files", // in the programs section
  inbound: "All squads: inbound", // finale, while the dots gather
  online: "All squads: online", // finale, once the logo has formed
};

/* The finale after the programs. */
export const finale = {
  line: "Five squads. One sky.", // EDITABLE
  cta: "Registration opens soon", // stays disabled until the real form (Phase 7)
};
