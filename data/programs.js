/**
 * The 15 ASTRA 2027 programs.
 *
 * Only names and squads are confirmed. Every other detail is "TBA" until the
 * organisers confirm it. Never fill these in with guesses.
 */

export const TBA = "TBA";

export const SQUADS = ["Arts", "Tech", "Gaming", "Business", "Fun"];

const program = (id, name, squad) => ({
  id,
  name,
  squad,
  date: TBA,
  venue: TBA,
  fee: TBA,
  rules: TBA,
});

export const programs = [
  program("photography", "Photography", "Arts"),
  program("face-painting", "Face Painting", "Arts"),
  program("theme-dance", "Theme Dance", "Arts"),
  program("fashion-show-group", "Fashion Show Group", "Arts"),
  program("fashion-show-single", "Fashion Show Single", "Arts"),
  program("reel-making", "Reel Making", "Arts"),
  program("rj-hunt", "RJ Hunt", "Fun"),
  program("logo-design", "Logo Design", "Tech"),
  program("coding-competition", "Coding Competition", "Tech"),
  program("e-sports", "E-Sports (BGMI, E-Football)", "Gaming"),
  program("mini-militia", "Mini Militia", "Gaming"),
  program("best-manager", "Best Manager", "Business"),
  program("business-quiz", "Business Quiz", "Business"),
  program("corporate-walk", "Corporate Walk", "Business"),
  program("scavenger-hunt", "Scavenger Hunt", "Fun"),
];

export const programsBySquad = (squad) => programs.filter((p) => p.squad === squad);

export default programs;
