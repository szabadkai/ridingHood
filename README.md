# Dark Riding Hood

A dark-themed action platformer where Little Red Riding Hood battles through a corrupted forest, wielding a dual-form light/dark transformation system. Built with Godot 4.5 (desktop) and Phaser 3 (web).

**[Play in browser](https://szabadkai.github.io/ridingHood/)**

## Gameplay

Fight through 5 levels — from the Dark Forest to The Abyss — defeating orcs and a final boss. A darkness meter fills from combat and pickups; once it crosses the threshold, press **C** to transform into Dark Riding Hood: faster, stronger, but more fragile. The meter drains over time in dark form, forcing you back to light.

### Controls

| Action | Key |
|--------|-----|
| Move | Arrow keys / WASD |
| Jump | Up / W / Space |
| Attack | X |
| Transform | C |
| Dodge (light: roll, dark: dash) | Z |
| Pause | ESC / P |

### Mechanics

- **Light form** — balanced stats, roll dodge
- **Dark form** — 1.5x damage output, dash with i-frames, but takes 1.5x damage and meter drains constantly
- **3-hit combo** — chain attacks with X
- **Coyote time & jump buffering** — forgiving platforming
- **Checkpoints** — respawn mid-level on death
- **Pickups** — food restores health, wolf essence fills the darkness meter

## Levels

1. **Dark Forest** — introductory platforming, 13 enemies
2. **Abandoned Village** — tighter gaps, 16 enemies
3. **Huntsman's Castle** — corridors and walls, 18 enemies
4. **Grandmother's Tower** — vertical focus, 16 enemies
5. **The Abyss** — maximum challenge, 22 enemies + boss arena

## Tech Stack

| | Desktop | Web |
|---|---------|-----|
| Engine | Godot 4.5 | Phaser 3.80.1 |
| Language | GDScript | TypeScript |
| Resolution | 320x180 scaled | 320x180 scaled |
| Build | Godot export | Vite 8 |

## Running the Web Version

```bash
cd ridingHood-web
npm install
npm run dev       # dev server on localhost:3000
npm run build     # production build to dist/
```

## Project Structure

```
ridingHood/
├── Scenes/                  # Godot scenes
├── Scripts/                 # GDScript game logic
├── Assets/                  # Shared art & audio
├── ridingHood-web/
│   ├── src/
│   │   ├── scenes/          # Boot, Preload, MainMenu, Game, UI, Pause, Death, Victory, Overworld
│   │   ├── entities/        # Player, Enemy, Orc, WolfKing, Checkpoint, Pickup
│   │   ├── systems/         # Camera, Sound, Parallax managers
│   │   ├── config/          # Game balance, animations, input
│   │   ├── levels/          # Level tile/enemy/pickup data
│   │   └── utils/           # EventBus, math helpers
│   └── public/assets/       # Sprites, tilemaps, audio
└── project.godot
```

## Credits

### Audio

**Sound Effects** — [80 CC0 RPG SFX](https://opengameart.org/content/80-cc0-rpg-sfx) (CC0 Public Domain)
Used for attack, enemy, boss, pickup, checkpoint, transform, and UI sounds.

**Player Movement SFX** — [12 Player Movement SFX](https://opengameart.org/content/12-player-movement-sfx) (CC-BY 4.0 / CC-BY 3.0)
Used for jump, land, and player hurt.

**Forest Theme** — [Forest Whisper Theme](https://opengameart.org/content/forest-whisper-theme) by Cleyton Kauffman (CC0)

**Boss Theme** — [Dark Ambience Loop](https://opengameart.org/content/dark-ambience-loop) by Iwan Gabovitch (CC-BY 3.0)

### Art

- Tileset: [0x72 Dungeon Tileset II](https://0x72.itch.io/dungeontileset-ii)
- Custom character animations (Light & Dark forms)
- 6-layer parallax forest backgrounds
