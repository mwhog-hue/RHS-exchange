# rhs-exchange v3 – Austauschformat der RH-App-Familie

Gemeinsames Format für RH Flächensuchassistent, RH Mantrailing-Assistent, RH Trümmersuchassistent,
Trainingstagebuch (Standalone und in BARRY), BARRY und Einsatzprotokoll.
Grundlage: das bestehende `rhs-exchange` (Version 1 in den Assistenten, Version 2 in Tagebuch, BARRY und
Einsatzprotokoll). Version 3 erweitert es um Trainings-/Einsatz-Einträge (`records[].type === "entry"`)
und bleibt für alte Dateien lesbar.

## Dateien

| Datei | Zweck |
| --- | --- |
| `rhs-exchange.js` | Bibliothek für Browser (`window.RHS`) und Node (`require`). Keine Abhängigkeiten. |
| `rhs-exchange-v3.schema.json` | JSON Schema (Draft 2020-12) des Pakets – für Dokumentation und Fremd-Apps. |
| `pruefstand.html` | Offline-Prüfstand: beliebige Exportdatei einer RH-App laden, v3-Ergebnis, Prüfbericht, GPX/CSV. |
| `test.js` | Node-Tests (`node test.js`), 10 Fälle mit Paketen in der Form der echten App-Exporte. |

## Einbau in eine App (drei Zeilen)

```html
<script src="rhs-exchange.js"></script>
<script>
  // Import: alles annehmen, was die App-Familie je geschrieben hat
  const paket = RHS.normalize(JSON.parse(dateiText));   // v1, v2, v3, Assistenten-Brücken
  const pruef = RHS.validate(paket);                    // { ok, fehler[] }
  const erg   = RHS.merge(meineRecords, paket);         // { records, neu, aktualisiert, unveraendert, konflikte }

  // Export
  const out = RHS.buildPackage({ source:{ app:'barry', appVersion:'2.1' }, records: meineRecords, personen, hunde, teams });
  out.pruefsumme = await RHS.checksum(out.records);
</script>
```

## Feste Regeln

1. Unbekannte Felder werden nie verworfen (`entry.data.roh`, Durchreichen am Record).
2. Versteckpersonen, Spurleger und Helfer nur mit Kürzel; `normalize()` kürzt volle Namen, `validate()` lehnt sie ab.
3. Chipnummer und Heimatpunkt verlassen die App nie (`validate()` prüft das).
4. Gleiche Id = derselbe Datensatz; `merge()` entscheidet nach `fieldMeta.revision`, gleiche Revision mit anderem Inhalt = Konflikt für den Nutzer.
5. Ein Team je Sparte: aus einem v2-Team-Record mit zwei Sparten entstehen zwei `teams`-Einträge (`<teamId>:<sparte>`).
6. Anzeigeart in Trümmern: `verbeller` prüfungsberechtigt, `sitzen_fundstelle` nur Training.

## Stand

30.09.2026, Entwurf v3.0. Das JSON Schema ist syntaktisch geprüft, aber mangels Netz noch nicht mit einem
externen Validator gegen Beispielpakete gelaufen; `RHS.validate()` deckt die Regeln zur Laufzeit ab.
Die Feldzuordnung der Assistenten-Brücken basiert auf den Exportfunktionen der Versionen
Fläche 2.9, Mantrailing 2.7, Trümmer 2.5 – bitte mit echten Exportdateien im Prüfstand gegenprüfen.
