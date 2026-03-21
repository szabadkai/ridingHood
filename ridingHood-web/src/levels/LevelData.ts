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
  // Level 1: Dark Forest — introductory, gentle platforming
  {
    name: 'Dark Forest',
    mapWidthTiles: 125,
    mapHeightTiles: 12,
    platforms: [
      { x: 5, y: 7, width: 3 },
      { x: 10, y: 6, width: 3 },
      { x: 15, y: 5, width: 3 },
      { x: 20, y: 7, width: 4 },
      { x: 26, y: 6, width: 3 },
      { x: 31, y: 7, width: 3 },
      { x: 36, y: 5, width: 4 },
      { x: 42, y: 6, width: 3 },
      { x: 57, y: 5, width: 3 },
      { x: 62, y: 4, width: 3 },
      { x: 67, y: 6, width: 4 },
      { x: 73, y: 5, width: 3 },
      { x: 79, y: 7, width: 3 },
      { x: 85, y: 3, width: 2 },
      { x: 90, y: 4, width: 3 },
      { x: 96, y: 3, width: 2 },
      { x: 102, y: 5, width: 4 },
      { x: 110, y: 4, width: 3 },
      { x: 117, y: 6, width: 4 },
    ],
    walls: [
      { x: 32, yTop: 7, yBot: 9 },
      { x: 44, yTop: 6, yBot: 9 },
    ],
    gaps: [{ start: 52, end: 55 }],
    orcPositions: [80, 140, 220, 320, 400, 500, 600, 700, 900, 1050, 1200, 1400, 1550],
    bossX: 1750,
    bossArenaWallCol: 105,
    checkpointPositions: [350, 750, 1300],
    foodPositions: [120, 280, 450, 650, 850, 1100, 1400, 1600],
    essencePositions: [200, 550, 950, 1250, 1700],
    playerSpawnX: 40,
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

  // Level 2: Abandoned Village — more gaps, denser enemies
  {
    name: 'Abandoned Village',
    mapWidthTiles: 140,
    mapHeightTiles: 12,
    platforms: [
      { x: 8, y: 7, width: 4 },
      { x: 14, y: 5, width: 3 },
      { x: 20, y: 6, width: 5 },
      { x: 28, y: 4, width: 3 },
      { x: 34, y: 7, width: 3 },
      { x: 40, y: 5, width: 4 },
      { x: 48, y: 3, width: 3 },
      { x: 55, y: 6, width: 4 },
      { x: 63, y: 4, width: 3 },
      { x: 70, y: 7, width: 5 },
      { x: 78, y: 5, width: 3 },
      { x: 84, y: 3, width: 4 },
      { x: 92, y: 6, width: 3 },
      { x: 98, y: 4, width: 4 },
      { x: 106, y: 7, width: 3 },
      { x: 112, y: 5, width: 4 },
      { x: 125, y: 4, width: 3 },
      { x: 132, y: 6, width: 4 },
    ],
    walls: [
      { x: 25, yTop: 5, yBot: 9 },
      { x: 46, yTop: 4, yBot: 9 },
      { x: 68, yTop: 6, yBot: 9 },
      { x: 90, yTop: 5, yBot: 9 },
    ],
    gaps: [
      { start: 16, end: 18 },
      { start: 43, end: 46 },
      { start: 75, end: 77 },
      { start: 102, end: 104 },
    ],
    orcPositions: [60, 120, 180, 250, 330, 420, 520, 620, 730, 840, 950, 1060, 1170, 1300, 1450, 1600],
    bossX: 2080,
    bossArenaWallCol: 120,
    checkpointPositions: [300, 700, 1100, 1500],
    foodPositions: [100, 240, 400, 560, 720, 880, 1050, 1250, 1450, 1700],
    essencePositions: [180, 500, 800, 1150, 1550, 1850],
    playerSpawnX: 40,
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

  // Level 3: Huntsman's Castle — tight corridors, lots of walls
  {
    name: "Huntsman's Castle",
    mapWidthTiles: 150,
    mapHeightTiles: 12,
    platforms: [
      { x: 6, y: 6, width: 3 },
      { x: 12, y: 4, width: 4 },
      { x: 19, y: 7, width: 3 },
      { x: 25, y: 3, width: 3 },
      { x: 32, y: 5, width: 5 },
      { x: 42, y: 7, width: 3 },
      { x: 50, y: 4, width: 4 },
      { x: 58, y: 6, width: 3 },
      { x: 66, y: 3, width: 3 },
      { x: 72, y: 7, width: 4 },
      { x: 80, y: 5, width: 3 },
      { x: 88, y: 3, width: 4 },
      { x: 95, y: 6, width: 5 },
      { x: 104, y: 4, width: 3 },
      { x: 112, y: 7, width: 4 },
      { x: 120, y: 5, width: 3 },
      { x: 135, y: 4, width: 3 },
      { x: 142, y: 6, width: 4 },
    ],
    walls: [
      { x: 16, yTop: 3, yBot: 9 },
      { x: 29, yTop: 4, yBot: 9 },
      { x: 39, yTop: 5, yBot: 9 },
      { x: 55, yTop: 3, yBot: 9 },
      { x: 69, yTop: 4, yBot: 9 },
      { x: 85, yTop: 3, yBot: 9 },
      { x: 101, yTop: 5, yBot: 9 },
      { x: 117, yTop: 4, yBot: 9 },
    ],
    gaps: [
      { start: 36, end: 38 },
      { start: 62, end: 64 },
      { start: 92, end: 94 },
    ],
    orcPositions: [50, 100, 160, 220, 300, 380, 460, 550, 640, 740, 830, 920, 1020, 1120, 1220, 1350, 1500, 1650],
    bossX: 2100,
    bossArenaWallCol: 130,
    checkpointPositions: [250, 600, 1000, 1400, 1800],
    foodPositions: [80, 200, 350, 500, 670, 800, 970, 1150, 1350, 1550, 1750, 1950],
    essencePositions: [150, 450, 750, 1050, 1400, 1700, 2050],
    playerSpawnX: 30,
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

  // Level 4: Grandmother's Tower — vertical focus, many platforms, narrow ground
  {
    name: "Grandmother's Tower",
    mapWidthTiles: 130,
    mapHeightTiles: 12,
    platforms: [
      // Dense vertical platforming sections
      { x: 5, y: 8, width: 2 },
      { x: 8, y: 6, width: 2 },
      { x: 11, y: 4, width: 2 },
      { x: 14, y: 2, width: 3 },
      { x: 20, y: 5, width: 3 },
      { x: 25, y: 3, width: 2 },
      { x: 28, y: 7, width: 3 },
      { x: 33, y: 5, width: 2 },
      { x: 36, y: 3, width: 2 },
      { x: 40, y: 6, width: 3 },
      { x: 45, y: 4, width: 2 },
      { x: 48, y: 2, width: 3 },
      { x: 54, y: 7, width: 2 },
      { x: 57, y: 5, width: 2 },
      { x: 60, y: 3, width: 3 },
      { x: 65, y: 6, width: 2 },
      { x: 68, y: 4, width: 2 },
      { x: 72, y: 7, width: 3 },
      { x: 76, y: 5, width: 2 },
      { x: 80, y: 3, width: 3 },
      { x: 85, y: 6, width: 2 },
      { x: 88, y: 4, width: 2 },
      { x: 92, y: 7, width: 3 },
      { x: 96, y: 5, width: 2 },
      { x: 100, y: 3, width: 3 },
      { x: 115, y: 5, width: 3 },
      { x: 122, y: 6, width: 4 },
    ],
    walls: [
      { x: 18, yTop: 3, yBot: 9 },
      { x: 42, yTop: 4, yBot: 9 },
      { x: 63, yTop: 3, yBot: 9 },
      { x: 83, yTop: 4, yBot: 9 },
    ],
    gaps: [
      { start: 22, end: 24 },
      { start: 50, end: 53 },
      { start: 73, end: 75 },
      { start: 93, end: 95 },
    ],
    orcPositions: [50, 110, 170, 240, 310, 380, 460, 540, 630, 720, 810, 900, 1000, 1100, 1250, 1400],
    bossX: 1800,
    bossArenaWallCol: 110,
    checkpointPositions: [200, 500, 800, 1150],
    foodPositions: [80, 180, 320, 470, 600, 750, 900, 1050, 1200, 1380, 1600],
    essencePositions: [150, 400, 700, 1000, 1350, 1750],
    playerSpawnX: 30,
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

  // Level 5: The Abyss — shadow realm, maximum challenge
  {
    name: 'The Abyss',
    mapWidthTiles: 160,
    mapHeightTiles: 12,
    platforms: [
      { x: 6, y: 7, width: 3 },
      { x: 12, y: 5, width: 2 },
      { x: 16, y: 3, width: 2 },
      { x: 22, y: 6, width: 3 },
      { x: 28, y: 4, width: 2 },
      { x: 33, y: 7, width: 3 },
      { x: 38, y: 2, width: 3 },
      { x: 45, y: 5, width: 2 },
      { x: 50, y: 7, width: 3 },
      { x: 56, y: 3, width: 2 },
      { x: 62, y: 6, width: 3 },
      { x: 68, y: 4, width: 2 },
      { x: 74, y: 7, width: 3 },
      { x: 80, y: 2, width: 3 },
      { x: 86, y: 5, width: 2 },
      { x: 92, y: 7, width: 3 },
      { x: 98, y: 3, width: 2 },
      { x: 104, y: 6, width: 3 },
      { x: 110, y: 4, width: 2 },
      { x: 116, y: 7, width: 3 },
      { x: 122, y: 2, width: 3 },
      { x: 128, y: 5, width: 2 },
      { x: 145, y: 4, width: 3 },
      { x: 152, y: 6, width: 4 },
    ],
    walls: [
      { x: 20, yTop: 3, yBot: 9 },
      { x: 36, yTop: 2, yBot: 9 },
      { x: 54, yTop: 3, yBot: 9 },
      { x: 72, yTop: 4, yBot: 9 },
      { x: 90, yTop: 3, yBot: 9 },
      { x: 108, yTop: 4, yBot: 9 },
      { x: 126, yTop: 2, yBot: 9 },
    ],
    gaps: [
      { start: 14, end: 15 },
      { start: 30, end: 32 },
      { start: 47, end: 49 },
      { start: 64, end: 67 },
      { start: 83, end: 85 },
      { start: 100, end: 102 },
      { start: 118, end: 121 },
    ],
    orcPositions: [
      50, 100, 150, 210, 280, 350, 420, 500, 580, 660, 750, 840, 930,
      1020, 1110, 1200, 1300, 1400, 1500, 1650, 1800, 1950,
    ],
    bossX: 2300,
    bossArenaWallCol: 140,
    checkpointPositions: [300, 650, 1050, 1500, 1900],
    foodPositions: [80, 200, 340, 480, 620, 780, 940, 1100, 1280, 1450, 1650, 1850, 2050, 2200],
    essencePositions: [150, 400, 700, 1000, 1350, 1700, 2100, 2250],
    playerSpawnX: 30,
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
