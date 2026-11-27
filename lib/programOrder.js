/**
 * The order programs are shown in: grouped by squad (Arts, Tech, Gaming,
 * Business, Fun), one rail per squad, so the numbers "01 / 15" run straight
 * down the page. Derived from data/programs.js (never edited here).
 */
import { programs, SQUADS, programsBySquad } from "@/data/programs";

/** All programs, squad by squad. */
export const ORDERED = SQUADS.flatMap((squad) => programsBySquad(squad));

/** Display number (1..15) of a program id. */
export const numberOf = (id) => ORDERED.findIndex((p) => p.id === id) + 1;

/** Ids of the programs in the same squad as `id`, in rail order (the detail's prev / next). */
export function squadIdsOf(id) {
  const program = programs.find((p) => p.id === id);
  return program ? programsBySquad(program.squad).map((p) => p.id) : [];
}

export const TOTAL = programs.length;
