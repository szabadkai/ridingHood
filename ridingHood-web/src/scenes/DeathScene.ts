import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { getSoundManager } from '../systems/SoundManager';
import { COLORS, drawPanel, createMenuButtons, createTitle, createDivider, createOverlay } from '../ui/MenuHelper';
import { pixelText } from '../ui/PixelText';

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
    drawPanel(this, cx, cy, 360, 220);

    // Title
    createTitle(this, cx, cy - 70, 'You Died');

    // Divider
    createDivider(this, cy - 40, 280);

    // Buttons
    createMenuButtons(this, cx, cy + 0, 40, [
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
    pixelText(this, cx, cy + 88, 'ENTER select / UP DOWN navigate', 'dim');
  }
}
