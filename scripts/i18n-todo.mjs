/** Prints every string that still needs an English entry, one per line. */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const D = "src/data";
const read = (f) => JSON.parse(readFileSync(join(D, f), "utf8"));
const dict = read("translations.json");

function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return files(p);
    return /\.tsx?$/.test(e.name) && !e.name.includes(".test.") ? [p] : [];
  });
}

const ui = new Set();
for (const f of files("src")) {
  for (const m of readFileSync(f, "utf8").matchAll(/\bt\(\s*"((?:[^"\\]|\\.)*)"/g)) {
    ui.add(m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"'));
  }
}

const content = new Set();
const add = (v) => { if (typeof v === "string" && v.trim().length > 1) content.add(v); };
const all = (v) => Array.isArray(v) && v.forEach(add);

for (const u of Object.values(read("l0-units.json"))) {
  add(u.org); add(u.role); add(u.sub); add(u.tag);
  if (u.cat === "vc") { add(u.name); all(u.depts); }
  for (const k of ["tasks","outputs","gives","receives","flow","steps","links"]) all(u[k]);
}
const lay = read("l0-layout.json");
all(lay.VC_LINKS);
for (const k of ["CATS","RAS_LBL","RAS_DESC"]) Object.values(lay[k]).forEach(add);
for (const r of lay.EXT_L) add(r[1]);
for (const r of lay.EXT_R) { add(r[1]); add(r[2]); }
for (const g of Object.values(read("l0-unit-groups.json"))) { add(g.n); add(g.sub); }
for (const g of Object.values(read("l1-groups.json"))) { add(g.n); add(g.l0); }
for (const l of Object.values(read("l1-lanes.json"))) { add(l.n); add(l.t); }
const inv = read("l0-stage-involvement.json");
for (const rows of Object.values(inv.vc)) for (const r of rows) add(r[2]);
for (const lanes of Object.values(inv.pc)) for (const rows of lanes) for (const r of rows) add(r[2]);
for (const p of read("l1-processes.json")) {
  for (const k of ["l0","owner","purpose","ref","note"]) add(p[k]);
  all(p.kpi);
  for (const s of p.steps) {
    for (const k of ["t","d","o"]) add(s[k]);
    for (const n of s.n ?? []) if (Array.isArray(n)) add(n[1]);
  }
}

for (const proc of Object.values(read("l2-procedures.json"))) {
  add(proc.n); add(proc.purpose); add(proc.scope);
  for (const [term, meaning] of proc.defs) { add(term); add(meaning); }
  for (const [, duty] of proc.resp) add(duty);
  for (const line of proc.wi) { add(line.t); add(line.o); }
  all(proc.records); all(proc.refs);
}

const which = process.argv[2] ?? "all";
const pool = which === "ui" ? [...ui] : which === "content" ? [...content] : [...ui, ...content];
const missing = [...new Set(pool)].filter((s) => !(s in dict));

if (process.argv.includes("--count")) {
  console.log(`ui=${[...ui].filter(s=>!(s in dict)).length} content=${[...content].filter(s=>!(s in dict)).length} total=${missing.length}`);
} else {
  const from = Number(process.argv[3] ?? 0), to = Number(process.argv[4] ?? missing.length);
  writeFileSync("/dev/stdout", JSON.stringify(missing.slice(from, to), null, 1) + "\n");
}

/* `--orphans` lists dictionary entries nothing references any more. */
if (process.argv.includes("--orphans")) {
  const live = new Set([...ui, ...content]);
  const orphans = Object.keys(dict).filter((k) => !live.has(k));
  console.log(JSON.stringify(orphans, null, 1));
  console.log(`orphans=${orphans.length}`);
}
