import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { OverworldScene } from './OverworldScene';
import { getSoundManager } from '../systems/SoundManager';
import { createMenuButtons } from '../ui/MenuHelper';
import { pixelText } from '../ui/PixelText';

export interface LevelStats {
  level: number;
  enemiesKilled: number;
  timeSeconds: number;
  damagesTaken: number;
}

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' });
  }

  create(data: LevelStats): void {
    // Save progress — unlock next level
    OverworldScene.saveProgress(data.level + 1);

    const cx = GAME_WIDTH / 2;

    // Dark overlay
    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x001100, 0.8);

    // Title
    pixelText(this, cx, 36, 'Level Complete!', 'gold');

    // Stats
    const mins = Math.floor(data.timeSeconds / 60);
    const secs = Math.floor(data.timeSeconds % 60);
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

    // Rating based on performance
    let rating = 'S';
    if (data.damagesTaken > 2) rating = 'A';
    if (data.damagesTaken > 5) rating = 'B';
    if (data.damagesTaken > 10) rating = 'C';
    if (data.timeSeconds > 180) {
      const tiers = ['S', 'A', 'B', 'C', 'D'];
      const idx = Math.min(tiers.indexOf(rating) + 1, tiers.length - 1);
      rating = tiers[idx];
    }

    const statY = 80;
    const lineH = 28;

    pixelText(this, cx, statY, `Enemies Defeated: ${data.enemiesKilled}`, 'body');
    pixelText(this, cx, statY + lineH, `Time: ${timeStr}`, 'body');
    pixelText(this, cx, statY + lineH * 2, `Hits Taken: ${data.damagesTaken}`, 'body');

    // Rating display
    pixelText(this, cx, statY + lineH * 3 + 8, 'Rating:', 'dim');

    const ratingColors: Record<string, string> = {
      S: '#ffcc00', A: '#44cc44', B: '#4488cc', C: '#cc8844', D: '#cc4444',
    };
    const ratingText = this.add.text(cx, statY + lineH * 4 + 12, rating, {
      fontSize: '28px',
      color: ratingColors[rating] || '#ffffff',
      fontFamily: '"Courier New", Courier, monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);

    // Pulse the rating
    this.tweens.add({
      targets: ratingText,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Buttons
    const sound = getSoundManager();
    sound.setScene(this);

    const nav = createMenuButtons(this, cx, 270, 36, [
      {
        label: 'Continue',
        onClick: () => this.scene.start('OverworldScene', { returnToLevel: data.level }),
      },
      {
        label: 'Replay Level',
        onClick: () => this.scene.start('GameScene', { level: data.level }),
        color: '#665577',
      },
    ]);

    // Blinking continue
    this.tweens.add({
      targets: nav.texts[0],
      alpha: 0.4,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });
  }
}
