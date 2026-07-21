import fs from 'node:fs/promises';
import path from 'node:path';

const EXCLUDED_DIRECTORIES = new Set(['.git', 'node_modules', 'rendered']);
const SENSITIVE_FILENAMES = [
  /^\.env(?!\.example$)/i,
  /(?:^|[-_.])(secret|secrets|credentials)(?:[-_.]|$)/i,
  /\.(?:pem|p12|pfx|key)$/i,
];

const CONTENT_RULES = [
  ['privater Schlüssel', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ['Ghost Admin API Key', /\b[a-f0-9]{24}:[a-f0-9]{64}\b/gi],
  ['JWT oder Zugriffstoken', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g],
  ['GitHub Token', /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{30,}\b/g],
  ['Slack Token', /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g],
  ['AWS Access Key', /\bAKIA[A-Z0-9]{16}\b/g],
  ['Zugangsdaten in URL', /\b[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:[^\s/@]+@[^\s]+/gi],
  ['E-Mail-Adresse', /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi],
  ['mögliche Privatanschrift', /\b\d{5}\s+[A-ZÄÖÜ][\p{L}.'’-]+(?:[ -][A-ZÄÖÜ]?[\p{L}.'’-]+)*\b/gu],
];

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && EXCLUDED_DIRECTORIES.has(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(target));
    if (entry.isFile()) files.push(target);
  }
  return files;
}

function lineNumber(content, offset) {
  return content.slice(0, offset).split('\n').length;
}

function looksLikeAllowedPlaceholder(value) {
  return value === ''
    || value === '...'
    || /^<[^>]+>$/.test(value)
    || /^(?:replace|example|your|dummy|placeholder)[-_]/i.test(value);
}

export async function scanRepository(root) {
  const findings = [];
  const files = await walk(root);

  for (const file of files) {
    const relative = path.relative(root, file);
    const basename = path.basename(file);
    if (SENSITIVE_FILENAMES.some((pattern) => pattern.test(basename))) {
      findings.push({ file: relative, line: 1, rule: 'sensitiver Dateiname' });
    }

    const buffer = await fs.readFile(file);
    if (buffer.includes(0)) continue;
    const content = buffer.toString('utf8');

    for (const [rule, pattern] of CONTENT_RULES) {
      pattern.lastIndex = 0;
      for (const match of content.matchAll(pattern)) {
        findings.push({ file: relative, line: lineNumber(content, match.index), rule });
      }
    }

    if (/^\.env(?:\.|$)/i.test(basename)) {
      for (const [index, line] of content.split('\n').entries()) {
        const match = line.match(/^\s*[A-Z][A-Z0-9_]*\s*=\s*(.*?)\s*$/);
        if (!match) continue;
        const value = match[1].replace(/^['"]|['"]$/g, '');
        if (!looksLikeAllowedPlaceholder(value) && !/^https:\/\/edunewsletter\.de\/?$/.test(value)) {
          findings.push({ file: relative, line: index + 1, rule: 'nicht offensichtlicher Wert in Environment-Datei' });
        }
      }
    }
  }

  return findings;
}
