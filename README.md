# Chronicle - D&D 5th Edition (2024) System Pack

Game system content pack for Chronicle providing D&D 5th Edition (2024 revision) reference data, entity presets, and Foundry VTT integration.

## Contents

- **Reference Data**: a starter sample from the SRD 5.1: a few spells, monsters, magic items, classes, races and conditions (three or four of each), enough to show the format rather than a full rules reference
- **Entity Presets**: Character (with full Foundry VTT sync), monster, spell, and magic item templates. The character sheet carries all five coins (cp, sp, ep, gp, pp), synced with Foundry's currency
- **DM Screen**: the manifest's `dm_screen` block gives Chronicle's DM Screen each hero's Hit Points (current and max, flagged below half) and Armor Class, the class under the hero's name, and the conditions from the Conditions reference for rules lookup
- **Relation Types**: Ally, enemy, patron, leader, mentor, worships, created, owns (with quantity/equipped metadata)
- **Foundry VTT Integration**: foundry_path annotations on character fields for automatic bidirectional sync via the generic adapter

## Installation

### Via Package Manager (Recommended)
1. Go to Admin > Packages
2. Add this repository URL
3. Install the latest version
4. In your campaign, open **Manage → Game & features** and pick D&D 5th Edition in the **Game system** card

To update, install the newer version from Admin > Packages. Chronicle adds the sheet fields the update introduces (for example cp, sp, ep and pp) to the Character type of campaigns already using this system; it never restores a field a GM deleted, and it does not create entity types or change existing fields.

### Via Manual Upload
1. Download the latest release ZIP
2. Go to Campaign Settings > Content Packs > Upload System
3. Upload the ZIP and verify the validation report

## License

Reference content is sourced from the Systems Reference Document 5.1 and is used under the Open Game License v1.0a. LICENSE carries the attribution and a link to the OGL text.

## Contributing

To add more SRD content:
1. Add entries to the appropriate data/*.json file
2. Follow the existing entry format (id, name, summary, description, properties, tags, source)
3. Ensure all content is from the SRD 5.1 or other OGL-licensed sources
4. Include "source": "SRD 5.1" on every entry
