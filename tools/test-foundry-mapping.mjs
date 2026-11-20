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

const monster = manifest.entity_presets.find((p) => p.slug === 'dnd5e-monster');
const monsterField = (key) => monster.fields.find((f) => f.key === key);

test('monsters become dnd5e NPC actors, by the formats the module converts', () => {
  assert.equal(monster.foundry_actor_type, 'npc');
  const want = {
    size: ['system.traits.size', undefined, 'DND5E.actorSizes'],
    type: ['system.details.type', 'type_subtype', 'DND5E.creatureTypes'],
    alignment: ['system.details.alignment', undefined, undefined],
    challenge_rating: ['system.details.cr', 'fraction', undefined],
    hit_points: ['system.attributes.hp.max', 'integer', undefined],
    armor_class: ['system.attributes.ac', 'ac_flat', undefined],
    speed: ['system.attributes.movement.walk', 'integer', undefined],
    environment: ['system.details.environment', undefined, undefined],
  };
  for (const a of ['str', 'dex', 'con', 'int', 'wis', 'cha']) want[a] = [`system.abilities.${a}.value`, undefined, undefined];
  for (const [key, [path, format, choices]] of Object.entries(want)) {
    const f = monsterField(key);
    assert.equal(f.foundry_path, path, key);
    assert.equal(f.foundry_format, format, key);
    assert.equal(f.foundry_choices, choices, key);
  }
  // Current hit points are Foundry's at the table; nothing is sent back.
  assert.equal(monster.foundry_pull_fields, undefined);
  assert.equal(monsterField('source').foundry_path, undefined, 'a book name has no NPC field');
});
