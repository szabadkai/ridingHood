import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { getSoundManager } from '../systems/SoundManager';
import { COLORS, drawPanel, createMenuButtons, createTitle, createDivider, MenuNav } from '../ui/MenuHelper';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const sound = getSoundManager();
    sound.setScene(this);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Background
    this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, COLORS.bg);

    // Decorative particles (floating embers)
    for (let i = 0; i < 15; i++) {
      const px = Phaser.Math.Between(20, GAME_WIDTH - 20);
      const py = Phaser.Math.Between(20, GAME_HEIGHT - 20);
      const dot = this.add.circle(px, py, 1, COLORS.accent, 0.3);
      this.tweens.add({
        targets: dot,
        y: py - Phaser.Math.Between(10, 30),
        alpha: 0,
        duration: Phaser.Math.Between(2000, 4000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
        onRepeat: () => {
          dot.setPosition(
            Phaser.Math.Between(20, GAME_WIDTH - 20),
            Phaser.Math.Between(100, GAME_HEIGHT),
          );
          dot.setAlpha(0.3);
        },
      });
    }

    // Main panel
    drawPanel(this, cx, cy, 240, 140);

    // Title
    createTitle(this, cx, cy - 46, 'Dark Riding Hood', '16px');

    // Subtitle
    this.add.text(cx, cy - 28, 'A Tale of Light & Shadow', {
      fontSize: '8px',
      color: COLORS.subtitle,
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(10);

    // Divider
    createDivider(this, cy - 16, 180);

    // Menu buttons (ENTER/SPACE handled by createMenuButtons)
    const startGame = () => this.scene.start('OverworldScene');

    const nav = createMenuButtons(this, cx, cy + 8, 20, [
      { label: 'Start Game', onClick: startGame },
    ]);

    // Pulse the start button
    this.tweens.add({
      targets: nav.texts[0],
      alpha: 0.4,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Controls hint
    this.add.text(cx, cy + 55, 'ENTER to start', {
      fontSize: '7px',
      color: COLORS.textDim,
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(10);

    // Version text
    this.add.text(GAME_WIDTH - 4, GAME_HEIGHT - 4, 'v0.1', {
      fontSize: '7px',
      color: COLORS.muted,
      fontFamily: 'monospace',
    }).setOrigin(1, 1);
  }
}
