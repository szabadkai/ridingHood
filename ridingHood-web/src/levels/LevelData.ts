// Level configuration data for all 5 levels

export interface PlatformDef {
  x: number;
  y: number;
  width: number;
}

export interface WallDef {
  x: number;
  yTop: number;
  yBot: number;
}

export interface GapDef {
  start: number; // start tile column
  end: number;   // end tile column (inclusive)
}

export interface ParallaxLayerDef {
  key: string;        // texture key to load/use
  path: string;       // file path relative to public/assets/
  scrollSpeed: number;
}

export interface LevelConfig {
  name: string;
  mapWidthTiles: number;
  mapHeightTiles: number;
  platforms: PlatformDef[];
  walls: WallDef[];
  gaps: GapDef[];
  orcPositions: number[];
  bossX: number;
  bossArenaWallCol: number;
  checkpointPositions: number[];
  foodPositions: number[];
  essencePositions: number[];
  playerSpawnX: number;
  // Background parallax layers (ordered back to front)
  parallaxLayers: ParallaxLayerDef[];
  // Visual theme
  tintColor: number;       // overlay tint color
  tintAlpha: number;       // overlay tint alpha
  darkTintColor: number;   // tint when in dark form
  darkTintAlpha: number;
  // Tile color overrides
  groundColor: number;
  groundDetailColor: number;
  grassColor: number;
  grassHighlightColor: number;
  stoneColor: number;
}

export const LEVELS: LevelConfig[] = [
  // ─────────────────────────────────────────────────────────────────
  // Level 1: Dark Forest — gentle intro, teaches basic movement
  //   Short, open, few enemies, no walls. Ease the player in.
  // ─────────────────────────────────────────────────────────────────
  {
    name: 'Dark Forest',
    mapWidthTiles: 100,
    mapHeightTiles: 12,
    platforms: [
      { x: 8, y: 7, width: 3 },
      { x: 15, y: 6, width: 4 },
      { x: 25, y: 7, width: 3 },
      { x: 35, y: 5, width: 3 },
      { x: 45, y: 6, width: 4 },
      { x: 55, y: 7, width: 3 },
      { x: 65, y: 5, width: 3 },
      { x: 75, y: 6, width: 4 },
    ],
    walls: [],  // no walls in the intro level
    gaps: [
      { start: 42, end: 43 },  // one small gap to teach jumping
    ],
    orcPositions: [200, 400, 580, 760, 1000, 1200],
    bossX: 1400,
    bossArenaWallCol: 82,
    checkpointPositions: [500, 960],
    foodPositions: [150, 350, 700, 1100],
    essencePositions: [300, 850],
    playerSpawnX: 40,
    parallaxLayers: [
      { key: 'forest_bg1', path: 'assets/backgrounds/forest/1.png', scrollSpeed: 0.05 },
      { key: 'forest_bg2', path: 'assets/backgrounds/forest/2.png', scrollSpeed: 0.1 },
      { key: 'forest_bg3', path: 'assets/backgrounds/forest/3.png', scrollSpeed: 0.15 },
      { key: 'forest_bg4', path: 'assets/backgrounds/forest/4.png', scrollSpeed: 0.2 },
      { key: 'forest_bg5', path: 'assets/backgrounds/forest/5.png', scrollSpeed: 0.3 },
      { key: 'forest_bg6', path: 'assets/backgrounds/forest/6.png', scrollSpeed: 0.4 },
      { key: 'forest_bg7', path: 'assets/backgrounds/forest/7.png', scrollSpeed: 0.5 },
    ],
    tintColor: 0x333355,
    tintAlpha: 0.3,
    darkTintColor: 0x220022,
    darkTintAlpha: 0.5,
    groundColor: 0x3d2817,
    groundDetailColor: 0x2e1e10,
    grassColor: 0x3a5c28,
    grassHighlightColor: 0x4a7a35,
    stoneColor: 0x555555,
  },

  // ─────────────────────────────────────────────────────────────────
  // Level 2: Abandoned Village — introduces gaps and walls
  //   More gaps to jump, first walls to navigate around.
  //   Enemies placed to guard narrow passages.
  // ─────────────────────────────────────────────────────────────────
  {
    name: 'Abandoned Village',
    mapWidthTiles: 120,
    mapHeightTiles: 12,
    platforms: [
      { x: 10, y: 7, width: 3 },
      { x: 18, y: 5, width: 4 },
      { x: 30, y: 6, width: 3 },
      { x: 40, y: 4, width: 3 },
      { x: 52, y: 7, width: 4 },
      { x: 62, y: 5, width: 3 },
      { x: 72, y: 6, width: 4 },
      { x: 82, y: 4, width: 3 },
      { x: 95, y: 5, width: 3 },
      { x: 105, y: 7, width: 4 },
    ],
    walls: [
      { x: 35, yTop: 7, yBot: 9 },  // short wall, jumpable
      { x: 68, yTop: 6, yBot: 9 },  // medium wall, needs platform
    ],
    gaps: [
      { start: 25, end: 27 },
      { start: 57, end: 59 },
      { start: 88, end: 90 },
    ],
    orcPositions: [160, 340, 500, 650, 820, 1050, 1350, 1550],
    bossX: 1750,
    bossArenaWallCol: 102,
    checkpointPositions: [430, 900],
    foodPositions: [120, 320, 600, 800, 1200, 1500],
    essencePositions: [250, 700, 1100],
    playerSpawnX: 40,
    parallaxLayers: [
      { key: 'village_bg1', path: 'assets/backgrounds/village/1.png', scrollSpeed: 0.03 },
      { key: 'village_bg2', path: 'assets/backgrounds/village/2.png', scrollSpeed: 0.08 },
      { key: 'village_bg3', path: 'assets/backgrounds/village/3.png', scrollSpeed: 0.13 },
      { key: 'village_bg4', path: 'assets/backgrounds/village/4.png', scrollSpeed: 0.18 },
      { key: 'village_bg5', path: 'assets/backgrounds/village/5.png', scrollSpeed: 0.3 },
      { key: 'village_bg6', path: 'assets/backgrounds/village/6.png', scrollSpeed: 0.45 },
    ],
    tintColor: 0x442211,
    tintAlpha: 0.35,
    darkTintColor: 0x331100,
    darkTintAlpha: 0.5,
    groundColor: 0x443322,
    groundDetailColor: 0x332211,
    grassColor: 0x445522,
    grassHighlightColor: 0x556633,
    stoneColor: 0x5a4a3a,
  },

  // ─────────────────────────────────────────────────────────────────
  // Level 3: Huntsman's Castle — tight corridors, wall-heavy
  //   Defined by walls creating corridors. Enemies guard doorways.
  //   Fewer gaps but more vertical navigation via platforms over walls.
  // ─────────────────────────────────────────────────────────────────
  {
    name: "Huntsman's Castle",
    mapWidthTiles: 130,
    mapHeightTiles: 12,
    platforms: [
      // Platforms placed to let you get over each wall
      { x: 14, y: 4, width: 3 },   // over wall at 18
      { x: 20, y: 6, width: 3 },
      { x: 32, y: 5, width: 4 },
      { x: 40, y: 3, width: 3 },   // over wall at 43
      { x: 46, y: 5, width: 3 },
      { x: 56, y: 4, width: 3 },
      { x: 64, y: 6, width: 4 },   // over wall at 68
      { x: 72, y: 3, width: 3 },
      { x: 80, y: 5, width: 3 },
      { x: 88, y: 4, width: 4 },   // over wall at 92
      { x: 96, y: 6, width: 3 },
      { x: 108, y: 5, width: 3 },
      { x: 118, y: 6, width: 4 },
    ],
    walls: [
      { x: 18, yTop: 5, yBot: 9 },   // must platform over
      { x: 43, yTop: 4, yBot: 9 },   // taller, need higher platform
      { x: 68, yTop: 5, yBot: 9 },
      { x: 92, yTop: 4, yBot: 9 },
    ],
    gaps: [
      { start: 50, end: 52 },
      { start: 76, end: 78 },
    ],
    orcPositions: [130, 300, 480, 640, 830, 1000, 1200, 1500, 1700],
    bossX: 1900,
    bossArenaWallCol: 112,
    checkpointPositions: [380, 750, 1150],
    foodPositions: [100, 350, 560, 900, 1100, 1400],
    essencePositions: [220, 700, 1050, 1600],
    playerSpawnX: 30,
    parallaxLayers: [
      { key: 'castle_bg1', path: 'assets/backgrounds/castle/1.png', scrollSpeed: 0.03 },
      { key: 'castle_bg2', path: 'assets/backgrounds/castle/2.png', scrollSpeed: 0.1 },
      { key: 'castle_bg3', path: 'assets/backgrounds/castle/3.png', scrollSpeed: 0.2 },
      { key: 'castle_bg4', path: 'assets/backgrounds/castle/4.png', scrollSpeed: 0.35 },
    ],
    tintColor: 0x222244,
    tintAlpha: 0.4,
    darkTintColor: 0x110033,
    darkTintAlpha: 0.55,
    groundColor: 0x3a3a3a,
    groundDetailColor: 0x2a2a2a,
    grassColor: 0x334433,
    grassHighlightColor: 0x445544,
    stoneColor: 0x4a4a5a,
  },

  // ─────────────────────────────────────────────────────────────────
  // Level 4: Grandmother's Tower — vertical platforming focus
  //   Dense platform stacking, frequent gaps, few walls.
  //   Tests precision jumping. Enemies on platforms, not just ground.
  // ─────────────────────────────────────────────────────────────────
  {
    name: "Grandmother's Tower",
    mapWidthTiles: 110,
    mapHeightTiles: 12,
    platforms: [
      // Staircase sections
      { x: 6, y: 8, width: 2 },
      { x: 9, y: 6, width: 2 },
      { x: 12, y: 4, width: 2 },
      { x: 15, y: 2, width: 3 },
      // Open run
      { x: 24, y: 6, width: 5 },
      // Another staircase
      { x: 35, y: 7, width: 2 },
      { x: 38, y: 5, width: 2 },
      { x: 41, y: 3, width: 2 },
      // Mid-air bridge
      { x: 48, y: 5, width: 6 },
      // Descent
      { x: 58, y: 3, width: 2 },
      { x: 61, y: 5, width: 2 },
      { x: 64, y: 7, width: 3 },
      // Final gauntlet
      { x: 72, y: 4, width: 3 },
      { x: 78, y: 6, width: 2 },
      { x: 82, y: 3, width: 3 },
      { x: 88, y: 5, width: 3 },
      { x: 96, y: 6, width: 4 },
    ],
    walls: [
      { x: 30, yTop: 6, yBot: 9 },  // short, forces platforming
    ],
    gaps: [
      { start: 20, end: 22 },
      { start: 33, end: 34 },
      { start: 45, end: 47 },
      { start: 56, end: 57 },
      { start: 69, end: 71 },
      { start: 85, end: 86 },
    ],
    orcPositions: [160, 390, 550, 770, 1020, 1250, 1430],
    bossX: 1600,
    bossArenaWallCol: 92,
    checkpointPositions: [370, 780],
    foodPositions: [100, 300, 530, 750, 1000, 1300],
    essencePositions: [200, 600, 1100],
    playerSpawnX: 30,
    parallaxLayers: [
      { key: 'tower_bg1', path: 'assets/backgrounds/tower/1.png', scrollSpeed: 0.05 },
      { key: 'tower_bg2', path: 'assets/backgrounds/tower/2.png', scrollSpeed: 0.15 },
      { key: 'tower_bg3', path: 'assets/backgrounds/tower/3.png', scrollSpeed: 0.3 },
    ],
    tintColor: 0x332233,
    tintAlpha: 0.35,
    darkTintColor: 0x220022,
    darkTintAlpha: 0.5,
    groundColor: 0x352535,
    groundDetailColor: 0x251525,
    grassColor: 0x3a3a28,
    grassHighlightColor: 0x4a4a35,
    stoneColor: 0x504050,
  },

  // ─────────────────────────────────────────────────────────────────
  // Level 5: The Abyss — shadow realm, everything at once
  //   Long, punishing. Big gaps, tall walls, dense enemies.
  //   The darkness meter matters here — need dark form to survive.
  // ─────────────────────────────────────────────────────────────────
  {
    name: 'The Abyss',
    mapWidthTiles: 145,
    mapHeightTiles: 12,
    platforms: [
      { x: 8, y: 6, width: 3 },
      { x: 16, y: 4, width: 2 },
      { x: 22, y: 7, width: 3 },
      { x: 30, y: 3, width: 3 },   // high platform over wall at 34
      { x: 38, y: 5, width: 3 },
      { x: 46, y: 7, width: 2 },
      { x: 50, y: 4, width: 3 },   // over wall at 54
      { x: 58, y: 6, width: 3 },
      { x: 66, y: 3, width: 3 },
      { x: 74, y: 5, width: 2 },
      { x: 78, y: 7, width: 3 },   // over wall at 82
      { x: 84, y: 3, width: 3 },
      { x: 92, y: 5, width: 2 },
      { x: 98, y: 7, width: 3 },
      { x: 104, y: 4, width: 3 },  // over wall at 108
      { x: 112, y: 6, width: 2 },
      { x: 118, y: 3, width: 3 },
      { x: 130, y: 5, width: 3 },
      { x: 137, y: 6, width: 4 },
    ],
    walls: [
      { x: 34, yTop: 4, yBot: 9 },
      { x: 54, yTop: 4, yBot: 9 },
      { x: 82, yTop: 4, yBot: 9 },
      { x: 108, yTop: 4, yBot: 9 },
    ],
    gaps: [
      { start: 12, end: 14 },
      { start: 26, end: 28 },
      { start: 42, end: 45 },    // wide gap — needs dark form dash
      { start: 62, end: 64 },
      { start: 88, end: 91 },    // wide gap
      { start: 114, end: 117 },  // wide gap
    ],
    orcPositions: [
      100, 250, 380, 500, 620, 780, 940, 1100, 1300, 1500, 1700, 1900,
    ],
    bossX: 2100,
    bossArenaWallCol: 126,
    checkpointPositions: [350, 750, 1250],
    foodPositions: [80, 280, 480, 720, 1000, 1350, 1650, 1850],
    essencePositions: [180, 550, 900, 1200, 1550, 2050],
    playerSpawnX: 30,
    parallaxLayers: [
      { key: 'abyss_bg1', path: 'assets/backgrounds/abyss/1.png', scrollSpeed: 0.02 },
      { key: 'abyss_bg2', path: 'assets/backgrounds/abyss/2.png', scrollSpeed: 0.07 },
      { key: 'abyss_bg3', path: 'assets/backgrounds/abyss/3.png', scrollSpeed: 0.12 },
      { key: 'abyss_bg4', path: 'assets/backgrounds/abyss/4.png', scrollSpeed: 0.2 },
      { key: 'abyss_bg5', path: 'assets/backgrounds/abyss/5.png', scrollSpeed: 0.35 },
    ],
    tintColor: 0x110022,
    tintAlpha: 0.45,
    darkTintColor: 0x000011,
    darkTintAlpha: 0.6,
    groundColor: 0x1a1a2a,
    groundDetailColor: 0x0a0a1a,
    grassColor: 0x222244,
    grassHighlightColor: 0x333355,
    stoneColor: 0x3a3a4a,
  },
];

export function getLevelConfig(level: number): LevelConfig {
  const idx = Math.max(0, Math.min(level - 1, LEVELS.length - 1));
  return LEVELS[idx];
}
