// Pins the character fields that travel to Foundry as items: race and
// background swap the sheet's one item of that type, and class stays
// Chronicle-only because it drives the dnd5e system's own advancement.
//
//   node --test tools/*.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'));
const character = manifest.entity_presets.find((p) => p.slug === 'dnd5e-character');
const field = (key) => character.fields.find((f) => f.key === key);

test('race and background map to the one dnd5e item of their type', () => {
  for (const [key, type] of [['race', 'race'], ['background', 'background']]) {
    const f = field(key);
    assert.equal(f.foundry_collection, 'items', key);
    assert.deepEqual(f.foundry_item_type, [type], key);
    assert.equal(f.foundry_item_single, true, key);
    assert.equal(f.foundry_path, undefined, `${key} is an item, not a path`);
  }
});

test('class is not mapped: Foundry builds it with its own advancement', () => {
  const f = field('class');
  assert.equal(f.foundry_collection, undefined);
  assert.equal(f.foundry_path, undefined);
});
