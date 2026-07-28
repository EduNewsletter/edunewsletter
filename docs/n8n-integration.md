# n8n-Übergabevertrag

Dieses öffentliche Repository ist die fachliche Quelle für Validierung,
Rendering und Ghost-Draft-Erzeugung. Ein n8n-Workflow darf davon keine zweite,
abweichende Ausgabestruktur ableiten.

## Artefaktjob

`create_release_artifacts` erhält einen unveränderlichen Job-Umschlag:

```json
{
  "schemaVersion": 1,
  "jobId": "uuid",
  "action": "create_release_artifacts",
  "newsletterNo": 1,
  "versionNo": 1,
  "contentHash": "sha256",
  "idempotencyKey": "1:1:create_release_artifacts:sha256",
  "callbackToken": "one-time-secret",
  "payload": {
    "issue": {},
    "version": {}
  }
}
```

Dabei gilt:

- `payload.issue` erfüllt vollständig `schemas/newsletter-issue.schema.json`;
- Newsletter- und Versionsnummer sowie `contentHash` stimmen im Umschlag und
  in `payload.version` überein;
- der Idempotenzschlüssel wird ausschließlich aus Nummern, Aktion und Hash
  gebildet;
- eine frei übergebene Callback-URL ist nicht Teil des Vertrags;
- Zugangsdaten, Ziel-Origins und Repository-Ziele kommen ausschließlich aus
  der n8n-Laufzeitkonfiguration;
- technische Wiederholungen mit demselben Hash erzeugen keine neue Ausgabe.

Vor einem Staging-Lauf:

```bash
npm run validate:automation -- /path/to/release-job.json
```

## Ghost-Grenze

n8n darf ausschließlich einen Ghost-Entwurf erstellen oder einen bereits
vorhandenen, hashgleichen Entwurf wiederverwenden. Der Payload muss mindestens
`status: draft`, `email_only: false`, `email_subject`, `custom_excerpt` und den
internen Profil-Tag enthalten. Veröffentlichung, Zielgruppenwahl, Testmail und
Versand bleiben manuell.

## Produktionssperre

Der Release-Pfad darf erst aktiviert werden, wenn die Webapp den vollständigen
`payload.issue` erzeugt. Ein Snapshot nur aus Titel, Einleitung, URL,
Abschnitt und Zusammenfassung reicht nicht: Quelle, Veröffentlichungsdatum,
Profil, Betreff, Schluss, Relevanz und Tags sind Pflichtfelder des öffentlichen
Publishing-Vertrags.
