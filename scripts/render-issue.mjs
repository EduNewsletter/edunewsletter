#!/usr/bin/env node
import fs from 'node:fs/promises';
import { readIssue, renderHtml, renderMarkdown } from './lib/newsletter.mjs';

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

const file = process.argv[2];
const htmlFile = option('--html');
const markdownFile = option('--markdown');

if (!file || (!htmlFile && !markdownFile)) {
  console.error('Verwendung: node scripts/render-issue.mjs <issue.json> [--html <datei>] [--markdown <datei>]');
  process.exit(2);
}

try {
  const issue = await readIssue(file);
  if (htmlFile) {
    await fs.writeFile(htmlFile, `${await renderHtml(issue)}\n`, 'utf8');
    console.log(`Ghost-HTML geschrieben: ${htmlFile}`);
  }
  if (markdownFile) {
    await fs.writeFile(markdownFile, renderMarkdown(issue), 'utf8');
    console.log(`Markdown geschrieben: ${markdownFile}`);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
