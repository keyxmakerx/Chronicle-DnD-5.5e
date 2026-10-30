<h1 align="center">D&amp;D 5th Edition (SRD 5.1) for Chronicle</h1>

<p align="center">
  <b>D&amp;D 5e page types, a DM Screen layout and Foundry VTT sync for <a href="https://github.com/keyxmakerx/Chronicle">Chronicle</a>.</b><br>
  Built on the 2014 rules: reference content from the SRD 5.1, under CC-BY-4.0.
</p>

## What it adds

- **Page types**: Character, monster, spell and magic item. The character sheet carries all five coins (cp, sp, ep, gp, pp), kept in step with Foundry's currency.
- **DM Screen**: each hero's Hit Points (current and max, flagged below half) and Armor Class, the class under the hero's name, and the conditions from the Conditions reference for rules lookup.
- **Encounter totals**: in an Adventures page's encounter builder, a panel under "Who's fighting" sums the fight: the heroes and their levels, the creatures and their XP (from each monster page's challenge rating, using the SRD 5.1 table). Type the XP your party takes on comfortably once, for the whole campaign, and every encounter's bar fills against it. The panel never labels a fight easy or deadly; a figure a page doesn't give is listed as not counted.
- **Foundry VTT sync**: the character fields Foundry stores (all but race, class, alignment, background and player name) carry `foundry_path` annotations, so the [Chronicle Sync module](https://github.com/keyxmakerx/Chronicle-Foundry-Module) syncs them both ways with no extra setup.
- **Relation types**: ally, enemy, patron, leader, mentor, worships, created and owns (with quantity and equipped details).
- **Reference data**: a starter sample from the SRD 5.1. It has three or four each of spells, monsters, magic items, classes and races, enough to show the format but not a full rules reference, and all fifteen conditions, so the DM Screen can look up any of them.

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
3. Use only content from the SRD 5.1, so the pack stays on one ruleset and under one licence.
4. Put `"source": "SRD 5.1"` on every entry.

Widget tests run with Node: `node --test tools/*.mjs`.

## License

Two parts, with different sources:

- **Reference content in `data/`** comes from the System Reference Document 5.1 by Wizards of the Coast LLC, used under CC-BY-4.0.
- **This package's own work** (`widgets/`, `tools/`, `manifest.json`, this README) is CC-BY-4.0.

[LICENSE](LICENSE) carries the required attribution.
