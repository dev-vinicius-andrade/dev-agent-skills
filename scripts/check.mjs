// Validates the marketplace before a commit. Exit 1 on any error; warnings do not fail.
//
//   node scripts/check.mjs
//
// Checks: marketplace.json is valid and points at real skills, every skill is registered and listed in README,
// SKILL.md frontmatter follows AGENTS.md, relative links resolve, shared copies are in sync, and no word from the
// optional, git-ignored `.leakwords` file (one word per line: names of the projects skills were born in) appears.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { repoRoot, syncProblems } from './sync-shared.mjs';

const allowedFrontmatterKeys = new Set(['name', 'description', 'license', 'allowed-tools', 'metadata']);
const skillNamePattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const maxSkillLines = 200;

const errors = [];
const warnings = [];

const read = (path) => readFileSync(join(repoRoot, path), 'utf8').replace(/\r\n/g, '\n');
const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);
const isDirectory = (path) => statSync(path).isDirectory();

const listDirectories = (path) =>
  existsSync(path) ? readdirSync(path).filter((name) => isDirectory(join(path, name))) : [];

const listMarkdownFiles = (directory) =>
  readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (isDirectory(path)) return listMarkdownFiles(path);
    return path.endsWith('.md') ? [path] : [];
  });

const discoverSkills = () =>
  listDirectories(join(repoRoot, 'skills')).flatMap((action) =>
    listDirectories(join(repoRoot, 'skills', action)).map((stack) => ({
      action,
      stack,
      path: `skills/${action}/${stack}`,
    })),
  );

function parseFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;
  const keys = [...match[1].matchAll(/^([A-Za-z][\w-]*):/gm)].map((keyMatch) => keyMatch[1]);
  const name = match[1].match(/^name:\s*(.+)$/m)?.[1].trim();
  const description = match[1]
    .split(/^description:\s*>?-?\s*$/m)[1]
    ?.split(/^[A-Za-z][\w-]*:/m)[0]
    .replace(/\s+/g, ' ')
    .trim() ?? match[1].match(/^description:\s*(.+)$/m)?.[1].trim();
  return { keys, name, description };
}

function checkMarketplace(skills) {
  let marketplace;
  try {
    marketplace = JSON.parse(read('.claude-plugin/marketplace.json'));
  } catch (error) {
    errors.push(`marketplace.json is not valid JSON: ${error.message}`);
    return;
  }
  const registered = marketplace.plugins.flatMap((plugin) =>
    (plugin.skills ?? []).map((skillPath) => ({ plugin: plugin.name, skillPath: skillPath.replace(/^\.\//, '') })),
  );
  registered
    .filter((entry) => !existsSync(join(repoRoot, entry.skillPath, 'SKILL.md')))
    .forEach((entry) => errors.push(`marketplace: ${entry.plugin} lists missing skill ${entry.skillPath}`));
  registered
    .filter((entry) => entry.skillPath.split('/')[1] !== entry.plugin)
    .forEach((entry) => errors.push(`marketplace: ${entry.skillPath} is registered under plugin ${entry.plugin}`));
  skills
    .filter((skill) => !registered.some((entry) => entry.skillPath === skill.path))
    .forEach((skill) => errors.push(`marketplace: ${skill.path} is not registered`));
}

function checkSkill(skill) {
  const skillFile = `${skill.path}/SKILL.md`;
  if (!existsSync(join(repoRoot, skillFile))) {
    errors.push(`${skill.path}: missing SKILL.md`);
    return;
  }
  const text = read(skillFile);
  const frontmatter = parseFrontmatter(text);
  if (!frontmatter) {
    errors.push(`${skillFile}: missing frontmatter`);
    return;
  }
  frontmatter.keys
    .filter((key) => !allowedFrontmatterKeys.has(key))
    .forEach((key) => errors.push(`${skillFile}: frontmatter key '${key}' is not allowed`));
  if (frontmatter.name !== skill.stack) errors.push(`${skillFile}: name '${frontmatter.name}' != folder '${skill.stack}'`);
  if (!skillNamePattern.test(frontmatter.name ?? '')) errors.push(`${skillFile}: invalid name '${frontmatter.name}'`);
  const expectedOpening = `${capitalize(skill.action)} guideline for`;
  if (!frontmatter.description?.startsWith(expectedOpening)) errors.push(`${skillFile}: description must start with "${expectedOpening}"`);
  if (!frontmatter.description?.includes(`(invoked as ${skill.action}:${skill.stack})`)) errors.push(`${skillFile}: description must say "(invoked as ${skill.action}:${skill.stack})"`);
  const lineCount = text.split('\n').length;
  if (lineCount > maxSkillLines) warnings.push(`${skillFile}: ${lineCount} lines (aim for <= ${maxSkillLines}; move detail to references/)`);
}

function checkReadme(skills) {
  const readme = read('README.md');
  skills
    .filter((skill) => !readme.includes(`\`${skill.action}:${skill.stack}\``))
    .forEach((skill) => errors.push(`README.md: no row for ${skill.action}:${skill.stack}`));
}

const isExternalLink = (target) => /^(https?:|mailto:|#)/.test(target);

function checkLinks(file) {
  const text = readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '');
  [...text.matchAll(/\]\(([^)\s]+)\)/g)]
    .map((match) => match[1].split('#')[0])
    .filter((target) => target && !isExternalLink(target))
    .filter((target) => !existsSync(resolve(dirname(file), target)))
    .forEach((target) => errors.push(`${relative(repoRoot, file)}: broken link ${target}`));
}

function checkLeakWords() {
  const leakFile = join(repoRoot, '.leakwords');
  if (!existsSync(leakFile)) return;
  const words = readFileSync(leakFile, 'utf8').split(/\r?\n/).map((word) => word.trim()).filter(Boolean);
  const files = ['skills', 'shared', 'template'].flatMap((folder) => listMarkdownFiles(join(repoRoot, folder)));
  const scanned = [...files, join(repoRoot, 'README.md'), join(repoRoot, 'AGENTS.md')];
  scanned.forEach((file) => {
    const text = readFileSync(file, 'utf8');
    words
      .filter((word) => new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text))
      .forEach((word) => errors.push(`${relative(repoRoot, file)}: contains leak word '${word}'`));
  });
}

const skills = discoverSkills();
checkMarketplace(skills);
skills.forEach(checkSkill);
checkReadme(skills);
listMarkdownFiles(join(repoRoot, 'skills')).forEach(checkLinks);
['README.md', 'AGENTS.md'].map((file) => join(repoRoot, file)).forEach(checkLinks);
syncProblems().forEach((problem) => errors.push(`shared: ${problem} (run node scripts/sync-shared.mjs)`));
checkLeakWords();

warnings.forEach((warning) => console.warn(`warn  ${warning}`));
errors.forEach((error) => console.error(`error ${error}`));
console.log(`${skills.length} skills, ${errors.length} errors, ${warnings.length} warnings`);
if (errors.length > 0) process.exit(1);
