# Chronicle - D&D 5th Edition (2024) System Pack

Game system content pack for Chronicle providing D&D 5th Edition (2024 revision) reference data, entity presets, and Foundry VTT integration.

## Contents

- **Reference Data**: Spells, monsters, magic items, classes, races, and conditions from the SRD 5.1
- **Entity Presets**: Character (with full Foundry VTT sync), monster, spell, and magic item templates
- **Relation Types**: Ally, enemy, patron, mentor, worships, owns (with quantity/equipped metadata)
- **Foundry VTT Integration**: foundry_path annotations on character fields for automatic bidirectional sync via the generic adapter

## Installation

### Via Package Manager (Recommended)
1. Go to Admin > Packages
2. Add this repository URL
3. Install the latest version
4. Enable the D&D 5e addon in your campaign settings

### Via Manual Upload
1. Download the latest release ZIP
2. Go to Campaign Settings > Content Packs > Upload System
3. Upload the ZIP and verify the validation report

## License

Reference content is sourced from the Systems Reference Document 5.1 and is used under the Open Game License v1.0a. See LICENSE for the full license text.

## Contributing

To add more SRD content:
1. Add entries to the appropriate data/*.json file
2. Follow the existing entry format (id, name, summary, description, properties, tags, source)
3. Ensure all content is from the SRD 5.1 or other OGL-licensed sources
4. Include "source": "SRD 5.1" on every entry
