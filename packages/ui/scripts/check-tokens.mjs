#!/usr/bin/env node
/**
 * Chequeo de tokens del sistema de diseño v2 (change design-system-v2-foundation).
 *
 * 1. `src/tokens/semantic.ts` tiene los mismos valores que las variables `--color-*`
 *    de `.docs/design/system/tokens.css`, en claro y en oscuro.
 * 2. Toda variable `var(--…)` que usa `apps/web/src` o `packages/ui/src` está definida
 *    (por `cssVariables.ts`, por un CSS de web o por `next/font`).
 *
 * Uso: `pnpm --filter @helu/ui check:tokens` (sale con código 1 si algo no coincide).
 * Lee los archivos como texto: no ejecuta TypeScript.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pkg = join(here, "..");
const repo = join(pkg, "..", "..");
const read = (p) => readFileSync(p, "utf8");
const problems = [];

// ── 1. semantic.ts vs tokens.css ────────────────────────────────────────────
const css = read(join(repo, ".docs/design/system/tokens.css"));
const cssLight = {};
const cssDark = {};
for (const block of css.split(/\n(?=:root|\[data-theme)/)) {
  const target = block.startsWith("[data-theme") ? cssDark : cssLight;
  for (const [, key, value] of block.matchAll(/--color-([a-z0-9-]+):\s*([^;]+);/g)) {
    target[key] = value.trim();
  }
}

const semantic = read(join(pkg, "src/tokens/semantic.ts"));
const pairs = (src) =>
  Object.fromEntries([...src.matchAll(/'([a-z0-9-]+)':\s*'([^']+)'/g)].map((m) => [m[1], m[2]]));
const lightSrc = semantic.slice(semantic.indexOf("semanticLight"), semantic.indexOf("export type SemanticKey"));
const darkSrc = semantic.slice(semantic.indexOf("export const semanticDark"));
const tsLight = pairs(lightSrc);
const tsDark = { ...tsLight, ...pairs(darkSrc) };
const cssDarkFull = { ...cssLight, ...cssDark };

const compare = (mode, expected, actual) => {
  for (const key of new Set([...Object.keys(expected), ...Object.keys(actual)])) {
    if (expected[key] !== actual[key]) {
      problems.push(`[${mode}] --color-${key}: tokens.css=${expected[key] ?? "—"} · semantic.ts=${actual[key] ?? "—"}`);
    }
  }
};
compare("claro", cssLight, tsLight);
compare("oscuro", cssDarkFull, tsDark);

// ── 2. variables CSS usadas y no definidas ─────────────────────────────────
const walk = (dir, exts, out = []) => {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".") || / 2\.[a-z]+$/.test(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, exts, out);
    else if (exts.some((e) => name.endsWith(e))) out.push(p);
  }
  return out;
};

const sources = [
  ...walk(join(repo, "apps/web/src"), [".css", ".tsx", ".ts"]),
  ...walk(join(pkg, "src"), [".tsx", ".ts"]),
];
const used = new Map();
for (const file of sources) {
  for (const [, name] of read(file).matchAll(/var\((--[a-zA-Z0-9-]+)/g)) {
    if (!used.has(name)) used.set(name, relative(repo, file));
  }
}

const defined = new Set(["--font-inter", "--font-nunito"]); // next/font (apps/web/src/app/layout.tsx)
for (const [, name] of read(join(pkg, "src/tokens/cssVariables.ts")).matchAll(/^\s*(--[a-zA-Z0-9-]+):/gm)) defined.add(name);
for (const key of Object.keys(tsLight)) defined.add(`--color-${key}`);
for (const file of walk(join(repo, "apps/web/src"), [".css"])) {
  for (const [, name] of read(file).matchAll(/^\s*(--[a-zA-Z0-9-]+):/gm)) defined.add(name);
}

// Conocidas y ajenas a este chequeo: variables de la plantilla de Next que no se usan en la app.
const ignored = new Set(["--font-geist-sans", "--font-geist-mono"]);
for (const [name, file] of used) {
  if (!defined.has(name) && !ignored.has(name)) problems.push(`[web] ${name} se usa en ${file} y no está definida`);
}

// ── Resultado ───────────────────────────────────────────────────────────────
const summary = `claro ${Object.keys(tsLight).length} · oscuro ${Object.keys(pairs(darkSrc)).length} · variables usadas ${used.size}`;
if (problems.length) {
  console.error(`check-tokens: ${problems.length} problema(s) (${summary})`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`check-tokens: OK (${summary})`);
