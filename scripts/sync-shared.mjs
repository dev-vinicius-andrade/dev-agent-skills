// Copies shared/ sources into each skill's references/ folder, as listed in shared/manifest.json.
// Skills stay self-contained (zip upload, copy into another agent) while shared rules have one source.
//
//   node scripts/sync-shared.mjs          write copies, delete stale generated copies
//   node scripts/sync-shared.mjs --check  exit 1 when any copy is missing, stale or edited by hand

import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const sharedRoot = join(repoRoot, 'shared');
const bannerPrefix = '<!-- GENERATED from shared/';

const toLf = (text) => text.replace(/\r\n/g, '\n');

const banner = (source) =>
  `${bannerPrefix}${source} by scripts/sync-shared.mjs. Edit the source, then re-run the script. -->\n\n`;

const readManifest = () => JSON.parse(readFileSync(join(sharedRoot, 'manifest.json'), 'utf8')).skills;

const expectedCopies = (manifest) =>
  Object.entries(manifest).flatMap(([skillPath, sources]) =>
    sources.map((source) => ({
      target: join(repoRoot, skillPath, 'references', basename(source)),
      content: banner(source) + toLf(readFileSync(join(sharedRoot, source), 'utf8')),
    })),
  );

const isGenerated = (file) => toLf(readFileSync(file, 'utf8')).startsWith(bannerPrefix);

const generatedFilesOf = (skillPath) => {
  const referencesDir = join(repoRoot, skillPath, 'references');
  if (!existsSync(referencesDir)) return [];
  return readdirSync(referencesDir)
    .map((name) => join(referencesDir, name))
    .filter(isGenerated);
};

const staleCopies = (manifest, copies) => {
  const expectedTargets = new Set(copies.map((copy) => copy.target));
  return Object.keys(manifest)
    .flatMap(generatedFilesOf)
    .filter((file) => !expectedTargets.has(file));
};

const isOutOfDate = (copy) => !existsSync(copy.target) || toLf(readFileSync(copy.target, 'utf8')) !== copy.content;

const writeCopy = (copy) => {
  mkdirSync(dirname(copy.target), { recursive: true });
  writeFileSync(copy.target, copy.content);
};

export function syncProblems() {
  const manifest = readManifest();
  const copies = expectedCopies(manifest);
  const outOfDate = copies.filter(isOutOfDate).map((copy) => `out of date: ${relative(repoRoot, copy.target)}`);
  const stale = staleCopies(manifest, copies).map((file) => `stale copy: ${relative(repoRoot, file)}`);
  return [...outOfDate, ...stale];
}

function sync() {
  const manifest = readManifest();
  const copies = expectedCopies(manifest);
  copies.filter(isOutOfDate).forEach(writeCopy);
  staleCopies(manifest, copies).forEach(unlinkSync);
  console.log(`synced ${copies.length} shared copies`);
}

function check() {
  const problems = syncProblems();
  problems.forEach((problem) => console.error(problem));
  if (problems.length > 0) process.exit(1);
  console.log('shared copies up to date');
}

const samePath = (left, right) => resolve(left).toLowerCase() === resolve(right).toLowerCase();
if (process.argv[1] && samePath(fileURLToPath(import.meta.url), process.argv[1])) {
  process.argv.includes('--check') ? check() : sync();
}
