#!/usr/bin/env node
import { readIssue, validateIssue } from './lib/newsletter.mjs';

const file = process.argv[2];
if (!file) {
  console.error('Verwendung: node scripts/validate-issue.mjs <issue.json>');
  process.exit(2);
}

try {
  const issue = await readIssue(file);
  const errors = validateIssue(issue);
  if (errors.length > 0) {
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(`${file}: gültige ${issue.newsletter}-Ausgabe mit ${issue.entries.length} Eintrag/Einträgen.`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
