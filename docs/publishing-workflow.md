# Publishing-Workflow

## Zielzustand

```text
KI-Agenten
  -> strukturierte JSON-Ausgabe
  -> Validierung und Deduplizierung
  -> Ghost-HTML und Markdown-Archiv
  -> Ghost-Entwurf
  -> redaktionelle Prüfung
  -> Ghost-Vorschau und Test-E-Mail
  -> manuelle Veröffentlichung und Versand
  -> Archivierung
```

## Warum der Versand manuell bleibt

Der aktuell eingesetzte Ghost-MCP kann Posts als Entwurf anlegen und aktualisieren. Seine Post-Werkzeuge unterstützen aber keinen `newsletter`-Parameter. Ghost benötigt diesen Parameter, um beim Veröffentlichen den richtigen Newsletter-Verteiler auszuwählen.

Bis ein eigener, getesteter Versandadapter existiert, gilt deshalb:

- Automatisierung endet beim Ghost-Entwurf.
- Der Entwurf wird in Ghost auf Web-, Mobil- und E-Mail-Darstellung geprüft.
- Eine Test-E-Mail wird manuell versendet.
- Newsletter, Zielgruppe und Veröffentlichungsmodus werden manuell ausgewählt.
- Erst danach wird veröffentlicht und versendet.

## Ghost-Zuordnung

| Profil | Ghost-Newsletter | geplanter Slug | Veröffentlichung |
| --- | --- | --- | --- |
| `edu` | EduNewsletter | `edu-newsletter` | Website und E-Mail |
| `material` | MaterialNewsletter | `material-newsletter` | Website und E-Mail |

## Sicherheitsregeln

- Der lokale Publisher erzwingt `status: draft`.
- Ghost-Zugangsdaten werden nicht in Dateien, Logs oder Repository-Artefakte geschrieben.
- Mitglieder- und Abonnentendaten werden niemals in Repository-Artefakte eingelesen oder exportiert.
- Vor jedem öffentlichen Commit muss `npm run check:public` erfolgreich sein.
- Vor jeder Aktualisierung wird der aktuelle Ghost-Stand erneut gelesen.
- Versand ist niemals eine implizite Folge des Renderings.
- Nach erfolgreichem Versand wird die exakt versendete Ausgabe als Markdown archiviert.
