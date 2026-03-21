import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { OverworldScene } from './OverworldScene';
import { getSoundManager } from '../systems/SoundManager';
import { COLORS, drawPanel, createMenuButtons, createTitle, createDivider, createOverlay, MenuNav } from '../ui/MenuHelper';

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

    // Dark overlay
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x001100, 0.8);

    // Title
    this.add.text(GAME_WIDTH / 2, 20, 'Level Complete!', {
      fontSize: '14px',
      color: '#44cc44',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Stats
    const mins = Math.floor(data.timeSeconds / 60);
    const secs = Math.floor(data.timeSeconds % 60);
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

    const statsLines = [
      `Enemies Defeated:  ${data.enemiesKilled}`,
      `Time:              ${timeStr}`,
      `Hits Taken:        ${data.damagesTaken}`,
    ];

    // Rating based on performance
    let rating = 'S';
    if (data.damagesTaken > 2) rating = 'A';
    if (data.damagesTaken > 5) rating = 'B';
    if (data.damagesTaken > 10) rating = 'C';
    if (data.timeSeconds > 180) {
      // Downgrade one tier for slow time
      const tiers = ['S', 'A', 'B', 'C', 'D'];
      const idx = Math.min(tiers.indexOf(rating) + 1, tiers.length - 1);
      rating = tiers[idx];
    }

    statsLines.push('');
    statsLines.push(`Rating:            ${rating}`);

    this.add.text(GAME_WIDTH / 2, 55, statsLines.join('\n'), {
      fontSize: '8px',
      color: '#cccccc',
      fontFamily: 'monospace',
      lineSpacing: 4,
    }).setOrigin(0.5, 0);

    // Rating color
    const ratingColors: Record<string, string> = {
      S: '#ffcc00', A: '#44cc44', B: '#4488cc', C: '#cc8844', D: '#cc4444',
    };
    this.add.text(GAME_WIDTH / 2 + 50, 92, rating, {
      fontSize: '16px',
      color: ratingColors[rating] || '#ffffff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Buttons (UP/DOWN/ENTER/SPACE + mouse handled by createMenuButtons)
    const sound = getSoundManager();
    sound.setScene(this);

    const nav = createMenuButtons(this, GAME_WIDTH / 2, 135, 18, [
      {
        label: 'Continue',
        onClick: () => this.scene.start('OverworldScene', { returnToLevel: data.level }),
        hoverColor: '#44cc44',
      },
      {
        label: 'Replay Level',
        onClick: () => this.scene.start('GameScene', { level: data.level }),
        color: '#999999',
        hoverColor: '#44cc44',
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
