# Sicherheit im öffentlichen Repository

Dieses Repository ist öffentlich und darf ausschließlich veröffentlichungsfähige Inhalte und quelloffenen Programmcode enthalten.

## Verbotene Inhalte

- API-Schlüssel, Tokens, Passwörter und Cookies
- private Schlüssel und Zertifikatsgeheimnisse
- Zugangsdaten in Datenbank- oder Dienst-URLs
- echte `.env`-Dateien
- Mitglieder- und Abonnentenlisten
- private E-Mail-Adressen, Telefonnummern oder Wohnanschriften
- interne Hostnamen, IP-Adressen oder nicht öffentliche Infrastrukturdetails
- unveröffentlichte personenbezogene Rohdaten aus Agenten- oder Workflowläufen

## Zulässige Konfiguration

- Variablennamen ohne Werte
- eindeutig erkennbare Platzhalter in `.env.example`
- öffentliche URLs zu `https://edunewsletter.de`
- redaktionell freigegebene Quellenlinks und Newsletter-Inhalte

## Lokaler Check

```bash
npm run check:public
```

Der Check muss vor jeder Veröffentlichung erfolgreich sein. Lokale Zugangsdaten werden nur über Prozessvariablen eingelesen und dürfen nicht in gerenderte Dateien, Logs oder Fehlerausgaben übernommen werden.

Falls ein Geheimnis versehentlich veröffentlicht wurde, reicht das Entfernen aus einer späteren Version nicht aus. Der Schlüssel muss beim jeweiligen Dienst widerrufen und ersetzt werden.
