// Fails if any local asset/anchor referenced from index.html or styles.css is missing.
import { readFileSync, existsSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const css = readFileSync("styles.css", "utf8");
const errors = [];

const refs = new Set();
for (const m of html.matchAll(/\s(?:src|href)="([^"]+)"/g)) refs.add(m[1]);
for (const m of html.matchAll(/srcset="([^"]+)"/g))
  m[1].split(",").forEach((s) => refs.add(s.trim().split(/\s+/)[0]));
for (const m of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) refs.add(m[1]);

const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

for (const ref of refs) {
  if (/^(https?:|mailto:|tel:|data:)/.test(ref)) continue;
  if (ref.startsWith("#")) {
    if (ref.length > 1 && !ids.has(ref.slice(1))) errors.push(`missing anchor ${ref}`);
    continue;
  }
  if (ref.startsWith("/")) {
    errors.push(`absolute path breaks under the GitHub Pages subfolder: ${ref}`);
    continue;
  }
  const path = decodeURI(ref.split(/[?#]/)[0]).replace(/^\.\//, "");
  if (!existsSync(path)) errors.push(`missing file ${ref}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`OK: ${refs.size} references checked`);
