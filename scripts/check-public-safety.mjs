#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { scanRepository } from './lib/public-safety.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const findings = await scanRepository(root);

if (findings.length > 0) {
  console.error('Public-Safety-Check fehlgeschlagen:');
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} (${finding.rule})`);
  }
  process.exit(1);
}

console.log('Public-Safety-Check erfolgreich: keine erkannten Geheimnisse oder privaten Kontaktdaten.');
