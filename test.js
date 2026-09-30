const assert = require('assert');
const RHS = require('./rhs-exchange.js');
let n = 0; const ok = (name, fn) => { fn(); n++; console.log('✓', name); };

// --- v2 Team-Paket, wie BARRY 2.0 / Tagebuch RHA / Mantrailing-Assistent es schreiben
const v2 = { rhsFormat: 'rhs-exchange', schemaVersion: 2, packageType: 'team', packageId: 'pkg-1', createdAt: '2026-09-30T10:00:00Z',
  source: { app: 'barry', appVersion: '2.0', instanceId: 'inst-1' },
  records: [{ type: 'team', id: 'team-42', data: { handler: 'M. Weiße', dogName: 'Flynn', dogBirthDate: '2021-03-01', dogBreed: 'Mischling', disciplines: ['Fläche', 'Mantrailing'], indicationType: 'Bringsler' },
    fieldMeta: { handler: { revision: 3, updatedAt: '2026-09-01' } } }] };
ok('v2 → v3: Team-Record bleibt, Personen/Hunde/Teams je Sparte entstehen', () => {
  const p = RHS.normalize(v2);
  assert.strictEqual(p.schemaVersion, 3);
  assert.strictEqual(p.records[0].type, 'team');
  assert.deepStrictEqual(p.records[0].fieldMeta.handler.revision, 3);
  assert.strictEqual(p.teams.length, 2);
  assert.deepStrictEqual(p.teams.map(t => t.sparte).sort(), ['flaeche', 'mantrailing']);
  assert.strictEqual(p.teams[0].anzeigeart, 'bringsel');
  assert.ok(RHS.validate(p).ok, RHS.validate(p).fehler.join('; '));
});

// --- v1 Team-Paket (Assistenten-Altformat)
const v1 = { rhsFormat: 'rhs-exchange', schemaVersion: 1, packageId: 'pkg-0', createdAt: '2026-08-01T10:00:00Z', sourceApp: 'rh-truemmersuchassistent',
  payload: { team: { teamId: 'team-7', fields: { handler: { value: 'A. B.', revision: 1 }, dog: { value: 'Momo', revision: 1 }, geburtsdatum: { value: '2019-05-05' } } } } };
ok('v1 → v3', () => {
  const p = RHS.normalize(v1);
  assert.strictEqual(p.hunde[0].rufname, 'Momo');
  assert.strictEqual(p.records[0].data.dogBirthDate, '2019-05-05');
  assert.ok(RHS.validate(p).ok);
});

// --- Mantrailing-Assistent Export (state-Dump)
const mt = { bridgeFormat: 'rhs-mantrailing-assistent-export', schemaVersion: 1, createdAt: '2026-09-30T17:41:00+02:00', sourceApp: 'rh-mantrailing-assistent',
  state: { version: 3, mode: 'Training', createdAt: '2026-09-30T17:05:00+02:00', team: 'M. Weiße / Flynn', layer: 'Klaus Kleber', lkp: 'Brunnenpark', saType: 'Hot Trail', refMode: 'blind',
    plsType: 'bekannt', plsResult: 'Abgang selbstständig gefunden', plsConfidence: 4, crossConfidence: 3, endPool: 'klar erkennbar', endPoolDog: 'direkt zur VP differenziert',
    findSituation: 'verdeckt / hinter Sichtschutz', result: 'Person gefunden', indication: 'Anspringen', progStart: 4, progSearch: 3, progFind: 5,
    wxTemp: 14, wxWind: 12, events: [{ t: '2026-09-30T17:20:00+02:00', lat: 51.49, lon: 9.39, type: 'Kreuzung', note: 'links' }],
    track: [{ lat: 51.49, lon: 9.39, t: '2026-09-30T17:05:00+02:00' }, { lat: 51.491, lon: 9.392 }], referenceTrack: [[51.489, 9.389]], finds: [] } };
ok('Mantrailing-Brücke → v3 Eintrag (Spurleger nur als Kürzel)', () => {
  const p = RHS.normalize(mt); const e = p.records[0];
  assert.strictEqual(e.type, 'entry'); assert.strictEqual(e.data.sparte, 'mantrailing');
  assert.strictEqual(e.data.helfer[0].kuerzel, 'KK'); assert.strictEqual(e.data.helfer[0].name, undefined);
  assert.strictEqual(e.data.nutzlast.trailart.hot, true); assert.strictEqual(e.data.nutzlast.trailart.blind, true);
  assert.strictEqual(e.data.nutzlast.trackHund.length, 2); assert.strictEqual(e.data.nutzlast.trackSpurleger.length, 1);
  assert.strictEqual(e.data.nutzlast.anzeige.art, 'anspringen');
  assert.strictEqual(e.data.bewertung.ergebnis, 'erfolgreich');
  assert.strictEqual(e.data.bewertung.zusatzskalen.length, 3);
  assert.ok(e.data.roh, 'Rohdaten durchgereicht');
  const v = RHS.validate(p); assert.ok(v.ok, v.fehler.join('; '));
});

// --- Trümmersuchassistent Export (Feldnamen wie in v2.5, echte Datei vom 30.09.2026 unten)
const tr = { bridgeFormat: 'rhs-truemmersuchassistent-export', schemaVersion: 2, createdAt: '2026-09-30T12:00:00Z', sourceApp: 'rh-truemmersuchassistent', appVersion: '2.5',
  state: { version: 3, mode: 'Training', createdAt: '2026-09-30T11:00:00Z', team: 'Micha/Mogli', place: 'Baugrube', events: [{ at: '2026-09-30T11:10:00Z', type: 'Ruhephase Hund' }], track: [{ t: '2026-09-30T11:01:00Z', lat: 51.5, lon: 9.39, acc: 3 }],
    finds: [{ id: 1, at: '2026-09-30T11:05:00Z', result: 'VP gefunden', bark: 'anhaltend', marking: '', depth: '1 m', lat: 51.5, lon: 9.39, acc: 3 }, { id: 2, result: 'nicht gefunden', bark: 'Sitz an Fundstelle' }],
    chips: { structure: ['Beton'], hazards: ['Staub'], pattern: ['Grobsuche'], scent: ['Geruchspool'] }, rubbleDrawing: [[1, 2, 3]], mapWidthM: '40', sectorList: [], searchAreaPolygon: [], wxTemp: 22.6, rhsExchange: { team: { handler: '', dogName: '' } } },
  protocol: { id: 'proto-1', startAt: '2026-09-30T11:01:00Z', kpi: { dur: 174 }, progress: { start: '3 – wechselhaft', search: '1 – Aufbau', find: '4 – sicher' }, ratingNum: 3, debrief: { good: 'ruhig', next: 'tiefer verstecken' } } };
ok('Trümmer-Brücke → v3 (Kürzel, Anzeige-Prüfungsberechtigung, Skalen aus Text, stabile Id)', () => {
  const p = RHS.normalize(tr); const e = p.records[0]; const vps = e.data.nutzlast.versteckpersonen;
  assert.strictEqual(e.id, 'tr-proto-1'); assert.strictEqual(e.data.teamId, 'p-mi:h-mogli:truemmer');
  assert.strictEqual(vps[0].anzeige.pruefungsberechtigt, true); assert.strictEqual(vps[1].anzeige.art, 'sitzen_fundstelle'); assert.strictEqual(vps[1].anzeige.pruefungsberechtigt, false);
  assert.strictEqual(e.data.nutzlast.ruhephasen.length, 1); assert.strictEqual(e.data.nutzlast.skizze.breiteM, 40);
  assert.deepStrictEqual(e.data.bewertung.zusatzskalen.map(z => z.wert), [3, 1, 4]); assert.strictEqual(e.data.bewertung.naechsterSchritt, 'tiefer verstecken');
  assert.strictEqual(RHS.merge(p.records, RHS.normalize(tr)).records.length, 1, 'Doppelimport erzeugt kein Duplikat');
  const v = RHS.validate(p); assert.ok(v.ok, v.fehler.join('; '));
});

// --- echte Exportdateien vom 30.09.2026 (wenn vorhanden)
const U = '/mnt/user-data/uploads/'; const fs = require('fs');
[['Trainingstagebuch_JSON-Sicherung_2026-09-30_21-09.json', 'tagebuch-rha', 'erfolgreich'], ['MT-Training_Lissy_2026-09-30.json', 'tagebuch-mt', 'offen'], ['RHS_Team_Irma.json', 'rhs-exchange-v2', null], ['RHS_Training_Truemmersuche_2026-09-30.json', 'truemmer-bridge', 'erfolgreich'], ['RHS_Sicherung_Truemmersuche_2026-09-30.json', 'truemmer-bridge', 'offen'], ['RHS_Auswertung_Flaechensuche_2026-09-30-17-38.json', 'flaeche-eval', 'teilweise']].forEach(([f, kind, erg]) => {
  if (fs.existsSync(U + f)) ok('echte Datei ' + f, () => { const d = JSON.parse(fs.readFileSync(U + f, 'utf8')); const p = RHS.normalize(d); assert.strictEqual(RHS.detect(d), kind); if (erg) assert.strictEqual(p.records.find(r => r.type === 'entry').data.bewertung.ergebnis, erg); const v = RHS.validate(p); assert.ok(v.ok, v.fehler.join('; ')); });
});

// --- Flächensuchassistent Export
const fl = { bridgeFormat: 'rhs-taktik-assistent-export', bridgeVersion: 2, sourceApp: 'RH-Flächensuchassistent', exportId: 'x1', exportedAt: '2026-09-30T09:00:00Z',
  rhsExchange: { schemaVersion: 2, teamId: 'team-42', teamFields: {} }, mode: 'training', personenzahl: 2,
  auftrag: { incidentWhat: 'Übung Reinhardswald' }, gebiet: { placeName: 'Sababurg', latitude: 51.54, longitude: 9.51, terrain: 'Wald', areaSize: '15 ha', vegetation: 'dicht' },
  wetter: { searchTime: '2026-09-30T09:00', windDirectionDeg: 240, temperature: 12, humidity: 80 }, dogTrack: [{ lat: 51.54, lon: 9.51 }] };
ok('Flächen-Brücke → v3 (teamId je Sparte)', () => {
  const p = RHS.normalize(fl); const e = p.records[0];
  assert.strictEqual(e.data.teamId, 'team-42:flaeche'); assert.strictEqual(e.data.ort.gelaendeart, 'Wald');
  assert.strictEqual(e.data.wetter.windRichtungGrad, 240); assert.strictEqual(e.data.nutzlast.trackHund.length, 1);
  assert.ok(RHS.validate(p).ok, RHS.validate(p).fehler.join('; '));
});

// --- Protokoll-Sicherung des Mantrailing-Assistenten (echte Datei vom 30.09.2026)
const protoDatei = '/mnt/user-data/uploads/RHS_Mantrailing_Protokolle_2026-09-30.json';
if (require('fs').existsSync(protoDatei)) ok('Protokolle-Format (echte Datei) → v3 mit Person/Hund/Team', () => {
  const p = RHS.normalize(JSON.parse(require('fs').readFileSync(protoDatei, 'utf8')));
  assert.strictEqual(RHS.detect({ format: 'rhs-mantrailing-protokolle', records: [] }), 'protokolle');
  assert.strictEqual(p.hunde[0].rufname, 'Mogli'); assert.strictEqual(p.teams[0].sparte, 'mantrailing');
  const e = p.records[0].data; assert.strictEqual(e.helfer[0].kuerzel, 'SV'); assert.strictEqual(e.nutzlast.trailAlterMin, 62); assert.strictEqual(e.nutzlast.gpsEreignisse.length, 13);
  assert.ok(RHS.validate(p).ok, RHS.validate(p).fehler.join('; '));
});

// --- v3 durchreichen + Namen kürzen
ok('v3 mit vollem Namen wird gekürzt und sonst unverändert durchgereicht', () => {
  const p = RHS.normalize(RHS.buildPackage({ source: { app: 'test' }, records: [RHS.newEntry({ sparte: 'flaeche', helfer: ['Erika Musterfrau'], nutzlast: { versteckpersonen: [{ name: 'Max Mann' }], fremdesFeld: 42 } })] }));
  const e = p.records[0]; assert.strictEqual(e.data.helfer[0].kuerzel, 'EM');
  assert.strictEqual(e.data.nutzlast.versteckpersonen[0].kuerzel, 'MM'); assert.strictEqual(e.data.nutzlast.fremdesFeld, 42);
  assert.ok(RHS.validate(p).ok);
});

// --- Validierung schlägt an
ok('validate meldet Namen, falsche Sparte und Chipnummer', () => {
  const p = RHS.buildPackage({ source: { app: 'x' }, hunde: [{ id: 'h', rufname: 'A', chipnummer: '276…' }],
    records: [{ type: 'entry', id: 'e1', data: { typ: 'training', sparte: 'unbekannt', beginn: '2026-01-01', helfer: [{ name: 'Voll Name' }] } }] });
  const v = RHS.validate(p); assert.ok(!v.ok); assert.strictEqual(v.fehler.length, 3);
});

// --- merge
ok('merge: neu / aktualisiert nach revision / Konflikt', () => {
  const a = RHS.newEntry({ id: 'e1', sparte: 'flaeche', fieldMeta: { revision: 1 } });
  const b = RHS.newEntry({ id: 'e1', sparte: 'flaeche', ziel: 'neu', fieldMeta: { revision: 2 } });
  const c = RHS.newEntry({ id: 'e2', sparte: 'truemmer' });
  const r = RHS.merge([a], RHS.buildPackage({ source: { app: 'x' }, records: [b, c] }));
  assert.strictEqual(r.neu, 1); assert.strictEqual(r.aktualisiert, 1); assert.strictEqual(r.records.find(x => x.id === 'e1').data.ziel, 'neu');
  const k = RHS.merge([b], RHS.buildPackage({ source: { app: 'x' }, records: [Object.assign(RHS.newEntry({ id: 'e1', sparte: 'flaeche', ziel: 'anders', fieldMeta: { revision: 2 } }))] }));
  assert.strictEqual(k.konflikte.length, 1);
});

// --- Außenformate
ok('GPX und CSV', () => {
  const e = RHS.normalize(mt).records[0]; const g = RHS.toGpx(e);
  assert.ok(g.includes('<gpx') && g.includes('<trk><name>Hund</name>') && g.includes('Spurleger'));
  const csv = RHS.toCsv([e]); assert.strictEqual(csv.split('\r\n').length, 2); assert.ok(csv.startsWith('id;teamId'));
});

RHS.checksum([{ a: 1 }]).then(h => { assert.ok(/^sha256:[0-9a-f]{64}$/.test(h)); console.log('✓ checksum'); console.log('\n' + (n + 1) + ' Tests bestanden'); });
