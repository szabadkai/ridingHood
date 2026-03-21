# Repository Guidelines

## Project Structure & Module Organization
Source assets live under `Scenes/` (packed Godot scenes), `Scripts/` (GDScript logic for player, enemies, UI, and parallax systems), and `Assets/` (art, audio, and shared resources). Configuration entry point is `project.godot`, which defines the main scene and rendering features. Prototype-only helpers such as `test_parallax.gd` sit in the repository root—re-home similar utilities into a dedicated `Tests/` folder when they grow.

## Build, Test, and Development Commands
- `godot4 project.godot` — Launches the editor with the Little Red Riding Hood project ready for scene previews.
- `godot4 --path .` — Runs the main game scene from the command line using the configured defaults.
- `godot4 --headless --script test_parallax.gd` — Executes the parallax regression script; use this pattern for additional headless checks.
- `godot4 --headless --export-release <preset> <output>` — Builds release packages; ensure export presets exist before invoking.

## Coding Style & Naming Conventions
GDScript uses tab indentation (one tab = one level) and 120-character soft limits. Name scripts and scenes in PascalCase (`Player.gd`, `MainMenu.tscn`) while keeping node, variable, and signal identifiers in snake_case (`current_health`, `health_changed`). Group related nodes via Godot groups for runtime lookups (see `Player.gd:add_to_group("player")`). Run Godot’s built-in formatter (`godot4 --headless --script res://.godot/format.gd` once configured) before committing; otherwise ensure manual alignment stays consistent.

## Testing Guidelines
Automated coverage is minimal today; keep fast smoke checks in GDScript, mirroring `test_parallax.gd`. Prefix new test scripts with `test_` and run them headless as part of your workflow. For gameplay changes, capture short screen recordings and note reproduction steps in the pull request. Manual regression on combat (player/enemy knockback) and menu navigation is required before merging.

## Commit & Pull Request Guidelines
Follow the existing concise, imperative commit style (`fix enemy death state`, `add deathscreen`). Reference related issues in the commit body when available. Pull requests should include: summary of changes, test commands with their results, affected scenes, and any new exported properties that need tweaking in the editor. Add screenshots or GIFs for visual changes to UI, parallax, or combat feedback, and request review from a second developer before merge.
