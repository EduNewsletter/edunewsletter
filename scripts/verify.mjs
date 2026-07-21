#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ROOT, ghostDraftPayload, readIssue, renderHtml, renderMarkdown, validateIssue } from './lib/newsletter.mjs';
import { scanRepository } from './lib/public-safety.mjs';

const schema = JSON.parse(await fs.readFile(path.join(ROOT, 'schemas', 'newsletter-issue.schema.json'), 'utf8'));
assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema', 'Schema muss Draft 2020-12 verwenden');

for (const name of ['edu-example.json', 'material-example.json']) {
  const issue = await readIssue(path.join(ROOT, 'examples', name));
  assert.deepEqual(validateIssue(issue), [], `${name} muss valide sein`);
  const html = await renderHtml(issue);
  const markdown = renderMarkdown(issue);
  const draft = ghostDraftPayload(issue, html);
  assert.ok(html.includes(issue.intro), `${name}: Intro fehlt im HTML`);
  assert.ok(html.includes('Hier könnte deine Nachricht'), `${name}: Sponsorplatz fehlt`);
  assert.ok(html.includes(issue.closing), `${name}: Abschlusstext fehlt`);
  assert.ok(html.includes('https://edunewsletter.de/quellen/'), `${name}: Quellenlink fehlt`);
  assert.ok(!html.includes('{{'), `${name}: Template enthält offene Platzhalter`);
  assert.ok(markdown.startsWith(`# ${issue.title}`), `${name}: Markdown-Titel fehlt`);
  assert.equal(draft.status, 'draft', `${name}: Publisher darf nur Entwürfe erzeugen`);
  assert.equal(draft.email_subject, issue.subject, `${name}: E-Mail-Betreff fehlt im Ghost-Entwurf`);
  assert.equal(draft.email_only, false, `${name}: Ausgabe soll Website und E-Mail unterstützen`);
}

const duplicate = await readIssue(path.join(ROOT, 'examples', 'edu-example.json'));
duplicate.entries.push({ ...duplicate.entries[0] });
assert.ok(validateIssue(duplicate).some((error) => error.includes('doppelt')), 'Doppelte URLs müssen abgewiesen werden');

const sorted = await readIssue(path.join(ROOT, 'examples', 'edu-example.json'));
sorted.entries.push({
  ...sorted.entries[0],
  title: 'Älterer Beitrag',
  url: 'https://example.org/aelterer-beitrag',
  publishedAt: '2026-07-01',
});
const sortedHtml = await renderHtml(sorted);
assert.ok(
  sortedHtml.indexOf('Beispiel für eine Bildungsnachricht') < sortedHtml.indexOf('Älterer Beitrag'),
  'Artikel innerhalb einer Kategorie müssen nach Datum absteigend sortiert sein',
);

assert.deepEqual(await scanRepository(ROOT), [], 'Repository darf keine erkannten sensiblen Informationen enthalten');

console.log('Verifikation erfolgreich: Schema-Regeln, beide Rendererprofile und Draft-Schutz funktionieren.');
