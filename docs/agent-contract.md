# Agentenvertrag

## Zweck

Vorgelagerte KI-Agenten recherchieren, klassifizieren und formulieren einzelne Newsletter-Einträge. Sie veröffentlichen nicht selbst in Ghost und erzeugen kein eigenes Layout.

## Verbindliches Ausgabeformat

Jede vollständige Ausgabe muss dem Schema `schemas/newsletter-issue.schema.json` entsprechen. JSON ist das Übergabeformat zwischen den Agenten und dem Renderer.

Pflichtregeln:

1. `newsletter` ist ausschließlich `edu` oder `material`.
2. Jede Quelle verwendet eine direkte HTTPS-URL zur Originalquelle.
3. `summary` enthält nur durch die Quelle belegte Aussagen.
4. `relevance` erklärt den konkreten Nutzen für Lehrkräfte.
5. Quellenname und Veröffentlichungsdatum werden nicht erfunden.
6. Doppelte URLs innerhalb einer Ausgabe sind unzulässig.
7. Materialeinträge enthalten die vollständige `material`-Struktur.
8. Unklare Lizenz- oder Kostenangaben werden als `unknown` beziehungsweise `Unbekannt` gekennzeichnet, nicht geraten.
9. Agenten dürfen weder `status: published` setzen noch einen Versand auslösen.
10. Agenten dürfen keine API-Schlüssel, Tokens, Cookies, Passwörter oder internen URLs ausgeben.
11. Abonnentenlisten, E-Mail-Adressen, private Anschriften und andere personenbezogene Daten gehören weder in Ausgaben noch in das Archiv.
12. Personenbezogene Angaben aus einer Quelle dürfen nur übernommen werden, wenn sie für den redaktionellen Inhalt zwingend notwendig und bereits Bestandteil der verlinkten öffentlichen Quelle sind. Kontaktdaten werden grundsätzlich nicht kopiert.
13. `closing` enthält einen kurzen redaktionellen Abschlusssatz für die jeweilige Ausgabe.

## Ausgabereihenfolge

1. Einleitung
2. Kategorien mit den jeweils zugehörigen Artikeln
3. Sponsorplatz
4. Abschlusstext
5. Links zu Feedback, Quellenliste und Arbeitsweise

Die Reihenfolge der Kategorien wird vom Newsletterprofil bestimmt. Artikel innerhalb einer Kategorie werden nach `publishedAt` absteigend sortiert.

## Zuständigkeiten

- Recherche-Agenten liefern belegte Kandidaten.
- Klassifikations-Agenten ordnen Sektion und Tags zu.
- Redaktions-Agenten erstellen Zusammenfassung und Relevanztext.
- Der Composer führt Einträge zusammen und entfernt Dubletten.
- Der Validator kontrolliert den technischen Vertrag.
- Ein Mensch prüft Inhalt, Links, Auswahl und Sprache vor dem Versand.

## Sektionen

EduNewsletter:

- `news`
- `studies`
- `blogs`
- `short`

MaterialNewsletter:

- `teaching-material`
- `oer`
- `tools`
- `collections`
