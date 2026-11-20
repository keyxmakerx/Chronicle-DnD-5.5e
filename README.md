<h1 align="center">D&amp;D 5th Edition (SRD 5.2 / 5.1) for Chronicle</h1>

<p align="center">
  <b>D&amp;D 5e page types, a DM Screen layout and Foundry VTT sync for <a href="https://github.com/keyxmakerx/Chronicle">Chronicle</a>.</b><br>
  Character options (species, classes, backgrounds) from the SRD 5.2, the 2024 rules; spells, monsters, magic items and conditions from the SRD 5.1, the 2014 rules. Both under CC-BY-4.0.
</p>

## What it adds

- **Page types**: Character, monster, spell and magic item. The character sheet carries all five coins (cp, sp, ep, gp, pp), kept in step with Foundry's currency.
- **DM Screen**: each hero's Hit Points (current and max, flagged below half) and Armor Class, the class under the hero's name, and the conditions from the Conditions reference for rules lookup.
- **Encounter totals**: in an Adventures page's encounter builder, a panel under "Who's fighting" sums the fight: the heroes and their levels, the creatures and their XP (from each monster page's challenge rating, using the SRD 5.1 table). Type the XP your party takes on comfortably once, for the whole campaign, and every encounter's bar fills against it. The panel never labels a fight easy or deadly; a figure a page doesn't give is listed as not counted.
- **Foundry VTT sync**: the character fields Foundry stores carry `foundry_path` annotations, so the [Chronicle Sync module](https://github.com/keyxmakerx/Chronicle-Foundry-Module) syncs them both ways with no extra setup. Species and background map to the sheet's race and background items: a pick made in Chronicle puts that item on the Foundry sheet (from a compendium when one has it), and the item on the sheet is what Chronicle shows. Class, alignment and player name stay Chronicle-only; class drives Foundry's own level-up steps, so it is set there. Monster pages become Foundry NPC actors when they are used (a fight places one, or **Add to Foundry** on the page), with size, type and subtype, alignment, challenge rating ("1/4" as 0.25), hit points, a flat armour class, walking speed, ability scores and environment; Chronicle owns the stat block and nothing is sent back. Needs Chronicle Sync with D&D monster support.
- **Relation types**: ally, enemy, patron, leader, mentor, worships, created and owns (with quantity and equipped details).
- **Reference data**: all nine species, all twelve classes and the four backgrounds of the SRD 5.2, so the hero builder offers a species, class and background step (the character field keyed `race` is labelled Species). Spells, monsters and magic items are a starter sample from the SRD 5.1, enough to show the format but not a full rules reference, plus all fifteen conditions so the DM Screen can look up any of them.

## Install

1. In Chronicle, go to **Admin > Packages** and add `https://github.com/keyxmakerx/Chronicle-DnD-5.5e`.
2. Install the latest version.
3. In your campaign, open **Manage > Game & features** and pick **D&D 5th Edition** in the **Game system** card.

To install without the package manager, download the latest release ZIP and upload it from **Campaign Settings > Content Packs > Upload System**, then check the validation report.

To update, install the newer version from **Admin > Packages**. Chronicle adds any new sheet fields (for example cp, sp, ep and pp) to the Character type of campaigns already using this system. It never brings back a field a GM deleted, and it does not create page types or change existing fields.

## Contributing

To add more SRD content:

1. Add entries to the matching `data/*.json` file.
2. Follow the existing entry format: `id`, `name`, `summary`, `description`, `properties`, `tags`, `source`.
3. Use only SRD content: the SRD 5.2 for `races.json`, `classes.json` and `backgrounds.json`, the SRD 5.1 for the other files, so each file stays on one ruleset and under one licence.
4. Put `"source": "SRD 5.2"` or `"SRD 5.1"` on every entry to match its file.
5. Keep every property a string or number; the builder panel cannot show nested values.

Widget tests run with Node: `node --test tools/*.mjs`.

## License

Two parts, with different sources:

- **Reference content in `data/`**: species, classes and backgrounds come from the System Reference Document 5.2, the rest from the System Reference Document 5.1, both by Wizards of the Coast LLC and used under CC-BY-4.0.
- **This package's own work** (`widgets/`, `tools/`, `manifest.json`, this README) is CC-BY-4.0.

[LICENSE](LICENSE) carries the required attribution.
