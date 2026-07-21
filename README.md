# EduNewsletter

EduNewsletter kuratiert Bildungsmedien in zwei getrennten Ausgaben:

- **EduNewsletter**: Blogposts, Fachartikel, Studien und Bildungsnachrichten
- **MaterialNewsletter**: Unterrichtsmaterialien, OER, Aufgaben und digitale Werkzeuge

Vorgelagerte KI-Agenten liefern ausschließlich strukturierte Ausgabedaten. Dieses Repository validiert diese Daten, rendert daraus Ghost-kompatibles HTML sowie ein Markdown-Archiv und kann einen **Entwurf** in Ghost anlegen. Versand und Veröffentlichung bleiben bis zur redaktionellen Freigabe in Ghost manuell.

## Struktur

```text
schemas/                 JSON-Schema für Agenten-Ausgaben
templates/               Ghost-kompatible HTML-Hüllen
examples/                valide Beispielausgaben
scripts/                 Validierung, Rendering und Draft-Erstellung
archive/edu/             Markdown-Archiv des EduNewsletter
archive/material/        Markdown-Archiv des MaterialNewsletter
docs/                    Agentenvertrag und Publishing-Workflow
```

## Lokale Verwendung

Voraussetzung: Node.js 22 oder neuer.

```bash
npm run verify
node scripts/validate-issue.mjs examples/edu-example.json
node scripts/render-issue.mjs examples/edu-example.json --html /tmp/edu.html --markdown /tmp/edu.md
```

## Ghost-Entwurf erstellen

Die Zugangsdaten werden nur über Umgebungsvariablen eingelesen:

```bash
GHOST_ADMIN_API_URL=https://edunewsletter.de \
GHOST_ADMIN_API_KEY=... \
node scripts/create-ghost-draft.mjs examples/edu-example.json
```

Der Publisher erzwingt `status: draft`. Er kann weder veröffentlichen noch E-Mails versenden.

## Verbindliche Regeln

- Kanonische Domain ist `https://edunewsletter.de`.
- Quellen-URLs und Zusammenfassungen sind Pflichtfelder.
- Materialeinträge benötigen Fach, Klassenstufe, Materialtyp, Lizenz und Zugangsangaben.
- Doppelte URLs innerhalb einer Ausgabe werden abgewiesen.
- Vor Veröffentlichung und Versand ist eine menschliche Prüfung erforderlich.

Weitere Einzelheiten stehen im [Agentenvertrag](docs/agent-contract.md) und im [Publishing-Workflow](docs/publishing-workflow.md).

## Öffentliche Sicherheit

Dieses Repository ist öffentlich. Zugangsdaten, personenbezogene Abonnentendaten, private Kontaktinformationen und interne Infrastrukturwerte dürfen nicht eingecheckt oder archiviert werden.

```bash
npm run check:public
```

Der Check durchsucht alle Repository-Dateien nach typischen Schlüsseln, Tokens, privaten Schlüsseln, Zugangsdaten in URLs, E-Mail-Adressen und Anschriften. Details stehen in [SECURITY.md](SECURITY.md).
