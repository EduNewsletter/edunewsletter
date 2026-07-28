#!/usr/bin/env node
import fs from 'node:fs/promises';
import { validateAutomationReleaseJob } from './lib/automation-release.mjs';

const file = process.argv[2];
if (!file) {
  console.error('Verwendung: node scripts/validate-automation-release.mjs <release-job.json>');
  process.exit(2);
}

let job;
try {
  job = JSON.parse(await fs.readFile(file, 'utf8'));
} catch (error) {
  console.error(`Release-Job kann nicht gelesen werden: ${error.message}`);
  process.exit(2);
}

const errors = validateAutomationReleaseJob(job);
if (errors.length > 0) {
  console.error('Release-Job ist ungültig:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Release-Job entspricht dem n8n- und Publishing-Vertrag.');
