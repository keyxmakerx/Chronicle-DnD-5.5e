// Pins the encounter totals panel's maths: challenge rating to XP from the
// SRD 5.1 table, missing figures said rather than guessed, and the bar against
// the DM's own number with no difficulty word of its own.
//
//   node --test tools/*.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const T = require('../widgets/encounter-totals.js');

const ok = (fields) => ({ status: 'ok', entity: { fields_data: fields } });

test('challenge ratings read through the SRD 5.1 table', () => {
  const cases = [
    ['1/4', '1/4', 50], ['0.25', '1/4', 50], ['.5', '1/2', 100], ['1/8', '1/8', 25],
    ['5', '5', 1800], [' 05 ', '5', 1800], ['CR 3', '3', 700], [30, '30', 155000],
    ['0', '0', 10], ['0 (0 XP)', '0', 0], ['1/4 (50 XP)', '1/4', 50], ['21 (33,000 XP)', '21', 33000]
  ];
  for (const [raw, cr, xp] of cases) {
    assert.deepEqual(T.crXP(raw), { cr, xp }, String(raw));
  }
  for (const raw of ['', null, undefined, 'tough', '31', '-1', '1/3', '2.5']) {
    assert.equal(T.crXP(raw), null, String(raw));
  }
});

test('the table is the SRD 5.1 one, every rating from 0 to 30', () => {
  assert.equal(Object.keys(T.XP_BY_CR).length, 34);
  assert.equal(T.XP_BY_CR['4'], 1100);
  assert.equal(T.XP_BY_CR['13'], 10000);
  assert.equal(T.XP_BY_CR['24'], 62000);
});

test('totals add each row and say what is left out', () => {
  const m = T.compute({
    heroes: [
      { id: 'h1', name: 'Ada', entry: ok({ level: '3' }) },
      { id: 'h2', name: 'Bo', entry: ok({ level: 4 }) },
      { id: 'h3', name: 'Cy', entry: ok({}) },
      { id: 'h4', name: 'Di', entry: { status: 'loading' } }
    ],
    creatures: [
      { row: { id: 'r1', name: 'Goblin', count: 4, entityId: 'g' }, entry: ok({ challenge_rating: '1/4' }) },
      { row: { id: 'r2', name: 'Ogre', count: 1, entityId: 'o' }, entry: ok({ challenge_rating: '2' }) },
      { row: { id: 'r3', name: 'Thing in the well', count: 1 }, entry: null },
      { row: { id: 'r4', name: 'Mystery', count: 2, entityId: 'm' }, entry: ok({ challenge_rating: '' }) }
    ],
    handles: 1200
  });
  assert.equal(m.total, 4 * 50 + 450);
  assert.equal(m.count, 8);
  assert.deepEqual(m.levels, [3, 4]);
  assert.equal(m.loading, 1);
  assert.equal(m.missing.length, 3);
  assert.match(m.missing[0], /^Cy: no level on its page/);
  assert.match(m.missing[1], /^Thing in the well: No page/);
  assert.match(m.missing[2], /^Mystery: No challenge rating/);
  assert.equal(T.summaryText(m), '4 heroes, levels 3 to 4 · 8 creatures, 650 XP (2 rows not counted)');
  assert.equal(m.pct, 54);
  assert.equal(T.meterText(m), '650 of 1,200 XP: 54% of what you said they handle');
});

test('the mockup line reads as signed', () => {
  const m = T.compute({
    heroes: [3, 3, 4, 4].map((l, i) => ({ id: 'h' + i, name: 'H' + i, entry: ok({ level: l }) })),
    creatures: [
      { row: { id: 'a', name: 'Acolyte', count: 4, entityId: 'a' }, entry: ok({ challenge_rating: '1/4' }) },
      { row: { id: 'b', name: 'Eel', count: 2, entityId: 'b' }, entry: ok({ challenge_rating: '2' }) }
    ],
    handles: 1200
  });
  assert.equal(T.summaryText(m), '4 heroes, levels 3 to 4 · 6 creatures, 1,100 XP');
  assert.equal(T.meterText(m), '1,100 of 1,200 XP: 92% of what you said they handle');
});

test('with no number set there is no bar and no percentage', () => {
  const m = T.compute({ heroes: [], creatures: [], handles: null });
  assert.equal(m.handles, null);
  assert.equal(m.pct, null);
  assert.equal(T.meterText(m), '');
  assert.equal(T.levelsText([5, 5]), 'level 5');
});

test('the panel never names a difficulty of its own', () => {
  const src = readFileSync(new URL('../widgets/encounter-totals.js', import.meta.url), 'utf8');
  const code = src.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
  for (const word of ['Easy', 'Medium', 'Hard', 'Deadly', 'Low', 'Moderate', 'High']) {
    assert.ok(!new RegExp("'[^']*\\b" + word + "\\b").test(code), word + ' appears in a string');
  }
});

test('what the DM types is read strictly', () => {
  assert.deepEqual(T.parseHandles(''), { ok: true, value: null });
  assert.deepEqual(T.parseHandles(' 1,200 '), { ok: true, value: 1200 });
  assert.deepEqual(T.parseHandles('1200 XP'), { ok: true, value: 1200 });
  for (const bad of ['0', '-5', '12.5', 'lots', '99999999']) {
    assert.equal(T.parseHandles(bad).ok, false, bad);
  }
});

test('a stored number is trusted only when it is one', () => {
  assert.equal(T.handlesFrom({ gm: { handles: 1200 } }), 1200);
  assert.equal(T.handlesFrom({ gm: {} }), null);
  assert.equal(T.handlesFrom({ gm: { handles: '1200' } }), null);
  assert.equal(T.handlesFrom({ public: { handles: 1200 } }), null);
  assert.equal(T.handlesFrom(null), null);
});

test('heroes need a whole level from 1 to 20', () => {
  for (const [lv, want] of [[1, 1], ['20', 20], [0, null], [21, null], [2.5, null], ['', null]]) {
    assert.equal(T.readHero({ id: 'h', name: 'H' }, ok({ level: lv })).level, want, String(lv));
  }
  assert.equal(T.readHero({ id: 'h' }, { status: 'failed' }).reason, 'Its page could not be read');
});

test('the manifest registers the panel as host mounted', () => {
  const m = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'));
  const w = (m.widgets || []).find((x) => x.slug === 'encounter-totals');
  assert.ok(w, 'widget entry');
  assert.equal(w.script_file, 'widgets/encounter-totals.js');
  assert.equal(w.host_mounted, true);
});
