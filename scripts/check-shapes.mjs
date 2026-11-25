// Fails (exit 1) unless every program has its own, unique shape.
// Runs on its own (npm run check:shapes) and before every build (prebuild).
//
// Checks, using the real data files:
//  1. every program in data/programs.js has an entry in PROGRAM_SHAPES
//  2. every entry points to a drawing that exists in SHAPES
//  3. no two programs use the same shape key
//  4. no two programs use identical path data under different keys
//  5. PROGRAM_SHAPES has no entries for programs that do not exist
import { programs } from "../data/programs.js";
import { SHAPES, PROGRAM_SHAPES } from "../data/shapes.js";

const problems = [];
const geometry = (shape) => JSON.stringify((shape.parts ?? [shape]).map((p) => [p.d, p.rule]));

const keyOwner = new Map();
const geometryOwner = new Map();
for (const p of programs) {
  const key = PROGRAM_SHAPES[p.id];
  if (!key) {
    problems.push(`"${p.name}" (${p.id}) has no shape`);
    continue;
  }
  const shape = SHAPES[key];
  if (!shape) {
    problems.push(`"${p.name}" points to shape "${key}", which does not exist`);
    continue;
  }
  if (keyOwner.has(key)) problems.push(`"${p.name}" and "${keyOwner.get(key)}" share the shape "${key}"`);
  keyOwner.set(key, p.name);
  const g = geometry(shape);
  if (geometryOwner.has(g) && geometryOwner.get(g) !== p.name) {
    problems.push(`"${p.name}" and "${geometryOwner.get(g)}" have identical shape drawings`);
  }
  geometryOwner.set(g, p.name);
}
const ids = new Set(programs.map((p) => p.id));
for (const id of Object.keys(PROGRAM_SHAPES)) if (!ids.has(id)) problems.push(`PROGRAM_SHAPES has "${id}", which is not a program`);

if (problems.length) {
  console.error(`check-shapes: FAILED\n - ${problems.join("\n - ")}`);
  process.exit(1);
}
console.log(`check-shapes: ok (${programs.length} programs, ${keyOwner.size} unique shapes)`);
