import { readdir, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '../..');
const shipsDir = resolve(root, 'ships');

const forbidden = [
  { name: 'oai_citation', re: /oai_citation/gi },
  { name: 'ChatGPT cite marker', re: /cite/g },
  { name: 'ChatGPT file citation marker', re: /filecite/g },
  { name: 'raw turn reference', re: /turn\d+(?:search|news|fetch|view)\d+/g }
];

const files = (await readdir(shipsDir))
  .filter(name => name.endsWith('.html'))
  .sort();

const problems = [];
for (const name of files) {
  const path = resolve(shipsDir, name);
  const html = await readFile(path, 'utf8');
  for (const rule of forbidden) {
    const matches = [...html.matchAll(rule.re)];
    for (const match of matches) {
      const line = html.slice(0, match.index).split('\n').length;
      problems.push({ file: `ships/${name}`, line, type: rule.name, match: match[0] });
    }
  }
}

if (problems.length) {
  console.error('Inline citation artifacts found in ship guides:');
  for (const problem of problems) {
    console.error(`- ${problem.file}:${problem.line} [${problem.type}] ${problem.match}`);
  }
  process.exit(1);
}

console.log(`Inline citation audit passed: ${files.length} ship-guide HTML files checked.`);
