<h1 align="center">D&amp;D 5th Edition (2024) for Chronicle</h1>

<p align="center">
  <b>D&amp;D 5e (2024) page types, a DM Screen layout and Foundry VTT sync for <a href="https://github.com/keyxmakerx/Chronicle">Chronicle</a>.</b><br>
  Reference content from the SRD 5.1, under the Open Game License.
</p>

## What it adds

- **Page types**: Character, monster, spell and magic item. The character sheet carries all five coins (cp, sp, ep, gp, pp), kept in step with Foundry's currency.
- **DM Screen**: each hero's Hit Points (current and max, flagged below half) and Armor Class, the class under the hero's name, and the conditions from the Conditions reference for rules lookup.
- **Foundry VTT sync**: character fields carry `foundry_path` annotations, so the [Chronicle Sync module](https://github.com/keyxmakerx/Chronicle-Foundry-Module) syncs them both ways with no extra setup.
- **Relation types**: ally, enemy, patron, leader, mentor, worships, created and owns (with quantity and equipped details).
- **Reference data**: a starter sample from the SRD 5.1. It has three or four each of spells, monsters, magic items, classes, races and conditions, enough to show the format but not a full rules reference.

## Install

1. In Chronicle, go to **Admin > Packages** and add `https://github.com/keyxmakerx/Chronicle-DnD-5.5e`.
2. Install the latest version.
3. In your campaign, open **Manage > Game & features** and pick **D&D 5th Edition** in the **Game system** card.

> **Known problem:** Chronicle currently reads this repository's name as `Chronicle-DnD-5`, because of the dot in `5.5e`, so installing it from Admin > Packages fails ([Chronicle#1215](https://github.com/keyxmakerx/Chronicle/issues/1215)). Until that is fixed, try the manual upload below.

Without the package manager, download the latest release ZIP and upload it from **Campaign Settings > Content Packs > Upload System**, then check the validation report.

To update, install the newer version from **Admin > Packages**. Chronicle adds any new sheet fields (for example cp, sp, ep and pp) to the Character type of campaigns already using this system. It never brings back a field a GM deleted, and it does not create page types or change existing fields.

## Contributing

To add more SRD content:

1. Add entries to the matching `data/*.json` file.
2. Follow the existing entry format: `id`, `name`, `summary`, `description`, `properties`, `tags`, `source`.
3. Use only content from the SRD 5.1 or other OGL-licensed sources.
4. Put `"source": "SRD 5.1"` on every entry.

## License

Reference content is sourced from the Systems Reference Document 5.1 and is used under the Open Game License v1.0a. [LICENSE](LICENSE) carries the attribution and a link to the OGL text.
