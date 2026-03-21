import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { getSoundManager } from '../systems/SoundManager';
import { COLORS, drawPanel, createMenuButtons, createTitle, createDivider, createOverlay } from '../ui/MenuHelper';

export class DeathScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DeathScene' });
  }

  create(): void {
    const sound = getSoundManager();
    sound.setScene(this);
    sound.stopMusic(0);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Dark red overlay
    createOverlay(this, 0x220000, 0.8);

    // Panel
    drawPanel(this, cx, cy, 180, 110);

    // Title
    createTitle(this, cx, cy - 35, 'You Died', '14px');

    // Divider
    createDivider(this, cy - 20, 140);

    // Buttons (UP/DOWN/ENTER/SPACE handled by createMenuButtons)
    createMenuButtons(this, cx, cy + 0, 20, [
      {
        label: 'Restart',
        onClick: () => { this.scene.stop('UIScene'); this.scene.start('OverworldScene'); },
      },
      {
        label: 'Main Menu',
        onClick: () => { this.scene.stop('UIScene'); this.scene.start('MainMenuScene'); },
        color: COLORS.textDim,
      },
    ]);

    // Hint
    this.add.text(cx, cy + 44, 'ENTER select / UP DOWN navigate', {
      fontSize: '7px',
      color: COLORS.textDim,
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(10);
  }
}
