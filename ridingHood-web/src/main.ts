import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config/GameConfig';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';
import { DeathScene } from './scenes/DeathScene';
import { VictoryScene } from './scenes/VictoryScene';
import { OverworldScene } from './scenes/OverworldScene';
import { PauseScene } from './scenes/PauseScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#020610',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 700 },
      debug: false,
    },
  },
  scene: [BootScene, PreloadScene, MainMenuScene, OverworldScene, GameScene, UIScene, PauseScene, DeathScene, VictoryScene],
};

const isEditorMode = import.meta.env.DEV && window.location.search.includes('editor');

if (isEditorMode) {
  // Dynamically import so the editor is tree-shaken from production builds
  import('./scenes/LevelEditorScene').then(({ LevelEditorScene }) => {
    const editorConfig: Phaser.Types.Core.GameConfig = {
      ...config,
      physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
      scene: [LevelEditorScene],
    };
    const game = new Phaser.Game(editorConfig);
    (window as unknown as Record<string, unknown>).__GAME__ = game;
  });
} else {
  const game = new Phaser.Game(config);
  (window as unknown as Record<string, unknown>).__GAME__ = game;
}

