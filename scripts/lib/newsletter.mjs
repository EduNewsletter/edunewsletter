import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const PROFILES = {
  edu: {
    label: 'EduNewsletter',
    internalTag: '#newsletter-edu',
    sections: [
      ['news', 'News und Entwicklungen'],
      ['studies', 'Fachartikel und Studien'],
      ['blogs', 'Blogs und Praxisimpulse'],
      ['short', 'Kurz notiert'],
    ],
    cta: 'Originalbeitrag lesen',
  },
  material: {
    label: 'MaterialNewsletter',
    internalTag: '#newsletter-material',
    sections: [
      ['teaching-material', 'Unterrichtsmaterialien'],
      ['oer', 'Open Educational Resources'],
      ['tools', 'Digitale Werkzeuge'],
      ['collections', 'Materialsammlungen'],
    ],
    cta: 'Material öffnen',
  },
};

function isDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function requiredString(errors, object, field, location, minimum = 1) {
  if (typeof object?.[field] !== 'string' || object[field].trim().length < minimum) {
    errors.push(`${location}.${field} muss ein nicht-leerer Text sein.`);
  }
}

export async function readIssue(file) {
  const source = await fs.readFile(file, 'utf8');
  try {
    return JSON.parse(source);
  } catch (error) {
    throw new Error(`Ungültiges JSON in ${file}: ${error.message}`);
  }
}

export function validateIssue(issue) {
  const errors = [];
  const profile = PROFILES[issue?.newsletter];

  if (issue?.schemaVersion !== 1) errors.push('schemaVersion muss 1 sein.');
  if (!profile) errors.push('newsletter muss "edu" oder "material" sein.');
  if (!Number.isInteger(issue?.issueNumber) || issue.issueNumber < 1) {
    errors.push('issueNumber muss eine positive Ganzzahl sein.');
  }
  requiredString(errors, issue, 'title', 'issue');
  requiredString(errors, issue, 'subject', 'issue');
  requiredString(errors, issue, 'intro', 'issue');
  requiredString(errors, issue, 'closing', 'issue');
  if (!isDate(issue?.publicationDate)) errors.push('publicationDate muss YYYY-MM-DD verwenden.');
  if (issue?.slug !== undefined && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(issue.slug)) {
    errors.push('slug darf nur Kleinbuchstaben, Zahlen und einzelne Bindestriche enthalten.');
  }
  if (!Array.isArray(issue?.entries) || issue.entries.length === 0) {
    errors.push('entries muss mindestens einen Eintrag enthalten.');
  }

  const seenUrls = new Set();
  for (const [index, entry] of (issue?.entries ?? []).entries()) {
    const location = `entries[${index}]`;
    requiredString(errors, entry, 'title', location);
    requiredString(errors, entry, 'source', location);
    requiredString(errors, entry, 'summary', location, 30);
    requiredString(errors, entry, 'relevance', location, 10);
    if (!isHttpsUrl(entry?.url)) errors.push(`${location}.url muss eine gültige HTTPS-URL sein.`);
    if (seenUrls.has(entry?.url)) errors.push(`${location}.url ist innerhalb der Ausgabe doppelt.`);
    seenUrls.add(entry?.url);
    if (!isDate(entry?.publishedAt)) errors.push(`${location}.publishedAt muss YYYY-MM-DD verwenden.`);
    if (!Array.isArray(entry?.tags)) errors.push(`${location}.tags muss ein Array sein.`);
    if (profile && !profile.sections.some(([key]) => key === entry?.section)) {
      errors.push(`${location}.section ist für ${profile.label} nicht zulässig.`);
    }

    if (issue?.newsletter === 'material') {
      const material = entry?.material;
      if (!material || typeof material !== 'object') {
        errors.push(`${location}.material ist für den MaterialNewsletter erforderlich.`);
      } else {
        if (!Array.isArray(material.subjects) || material.subjects.length === 0) {
          errors.push(`${location}.material.subjects muss mindestens ein Fach enthalten.`);
        }
        if (!Array.isArray(material.gradeLevels) || material.gradeLevels.length === 0) {
          errors.push(`${location}.material.gradeLevels muss mindestens eine Stufe enthalten.`);
        }
        requiredString(errors, material, 'materialType', `${location}.material`);
        requiredString(errors, material, 'license', `${location}.material`);
        if (!['free', 'paid', 'freemium', 'unknown'].includes(material.access)) {
          errors.push(`${location}.material.access ist ungültig.`);
        }
        if (typeof material.loginRequired !== 'boolean') {
          errors.push(`${location}.material.loginRequired muss true oder false sein.`);
        }
      }
    }
  }

  return errors;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function materialMeta(material) {
  const accessLabels = {
    free: 'Kostenlos',
    paid: 'Kostenpflichtig',
    freemium: 'Freemium',
    unknown: 'Unbekannt',
  };
  return `<ul>
<li><strong>Fach:</strong> ${escapeHtml(material.subjects.join(', '))}</li>
<li><strong>Stufe:</strong> ${escapeHtml(material.gradeLevels.join(', '))}</li>
<li><strong>Materialtyp:</strong> ${escapeHtml(material.materialType)}</li>
<li><strong>Lizenz:</strong> ${escapeHtml(material.license)}</li>
<li><strong>Zugang:</strong> ${accessLabels[material.access]}${material.loginRequired ? ', Anmeldung erforderlich' : ', keine Anmeldung erforderlich'}</li>
</ul>`;
}

function renderEntryHtml(entry, profile) {
  const image = entry.image
    ? `<figure><img src="${escapeHtml(entry.image.url)}" alt="${escapeHtml(entry.image.alt)}">${entry.image.caption ? `<figcaption>${escapeHtml(entry.image.caption)}</figcaption>` : ''}</figure>\n`
    : '';
  const meta = entry.material ? `${materialMeta(entry.material)}\n` : '';
  return `<h3>${escapeHtml(entry.publishedAt)} – <a href="${escapeHtml(entry.url)}">${escapeHtml(entry.title)}</a> – ${escapeHtml(entry.source)}</h3>
${image}<p>${escapeHtml(entry.summary)}</p>
${meta}<p><a href="${escapeHtml(entry.url)}">${profile.cta}</a></p>`;
}

function renderSponsorHtml() {
  return `<pre>+--------------------------------+
| Sponsor                        |
| Hier könnte deine Nachricht    |
| stehen.                        |
+--------------------------------+</pre>`;
}

export async function renderHtml(issue) {
  const errors = validateIssue(issue);
  if (errors.length > 0) throw new Error(`Ausgabe ist ungültig:\n- ${errors.join('\n- ')}`);

  const profile = PROFILES[issue.newsletter];
  const sections = profile.sections
    .map(([key, title]) => {
      const entries = issue.entries
        .filter((entry) => entry.section === key)
        .toSorted((left, right) => right.publishedAt.localeCompare(left.publishedAt)
          || left.title.localeCompare(right.title, 'de'));
      if (entries.length === 0) return '';
      return `<h2>${escapeHtml(title)}</h2>\n${entries.map((entry) => renderEntryHtml(entry, profile)).join('\n<hr>\n')}`;
    })
    .filter(Boolean)
    .join('\n<hr>\n');

  const template = await fs.readFile(path.join(ROOT, 'templates', `${issue.newsletter}-newsletter.html`), 'utf8');
  return template
    .replace('{{INTRO}}', escapeHtml(issue.intro))
    .replace('{{SECTIONS}}', sections)
    .replace('{{SPONSOR}}', renderSponsorHtml())
    .replace('{{CLOSING}}', escapeHtml(issue.closing))
    .trim();
}

function materialMetaMarkdown(material) {
  const accessLabels = {
    free: 'Kostenlos',
    paid: 'Kostenpflichtig',
    freemium: 'Freemium',
    unknown: 'Unbekannt',
  };
  return [
    `- **Fach:** ${material.subjects.join(', ')}`,
    `- **Stufe:** ${material.gradeLevels.join(', ')}`,
    `- **Materialtyp:** ${material.materialType}`,
    `- **Lizenz:** ${material.license}`,
    `- **Zugang:** ${accessLabels[material.access]}${material.loginRequired ? ', Anmeldung erforderlich' : ', keine Anmeldung erforderlich'}`,
  ].join('\n');
}

export function renderMarkdown(issue) {
  const errors = validateIssue(issue);
  if (errors.length > 0) throw new Error(`Ausgabe ist ungültig:\n- ${errors.join('\n- ')}`);
  const profile = PROFILES[issue.newsletter];
  const body = profile.sections
    .map(([key, title]) => {
      const entries = issue.entries
        .filter((entry) => entry.section === key)
        .toSorted((left, right) => right.publishedAt.localeCompare(left.publishedAt)
          || left.title.localeCompare(right.title, 'de'));
      if (entries.length === 0) return '';
      const rendered = entries.map((entry) => {
        const meta = entry.material ? `\n${materialMetaMarkdown(entry.material)}\n` : '';
        return `### ${entry.publishedAt} – [${entry.title}](${entry.url}) – ${entry.source}\n\n${entry.summary}\n${meta}\n[${profile.cta}](${entry.url})\n`;
      }).join('\n---\n\n');
      return `## ${title}\n\n${rendered}`;
    })
    .filter(Boolean)
    .join('\n\n---\n\n');

  return `# ${issue.title}\n\n${issue.intro}\n\n${body}\n\n---\n\n\`\`\`text\n+--------------------------------+\n| Sponsor                        |\n| Hier könnte deine Nachricht    |\n| stehen.                        |\n+--------------------------------+\n\`\`\`\n\n${issue.closing}\n\n---\n\n## Weitere Informationen\n\n- [Feedback geben](https://github.com/ChristianHaake/eduNewsletter/issues)\n- [Quellenliste](https://edunewsletter.de/quellen/)\n- [Unsere Arbeitsweise und der Einsatz von KI](https://edunewsletter.de/konzept-transparenz/)\n`;
}

export function ghostDraftPayload(issue, html) {
  const profile = PROFILES[issue.newsletter];
  const tags = [...new Set([profile.internalTag, ...(issue.ghostTags ?? [])])];
  return {
    title: issue.title,
    email_subject: issue.subject,
    slug: issue.slug,
    html,
    status: 'draft',
    custom_excerpt: issue.intro.slice(0, 300),
    tags,
    email_only: false,
  };
}

export { PROFILES, ROOT };
