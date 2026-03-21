import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { getSoundManager } from '../systems/SoundManager';

interface LevelNode {
  x: number;
  y: number;
  label: string;
  level: number;
}

const LEVELS: LevelNode[] = [
  { x: 40,  y: 140, label: 'Dark Forest',         level: 1 },
  { x: 110, y: 100, label: 'Abandoned Village',    level: 2 },
  { x: 175, y: 130, label: "Huntsman's Castle",    level: 3 },
  { x: 230, y: 80,  label: "Grandmother's Tower",  level: 4 },
  { x: 285, y: 120, label: 'The Abyss',            level: 5 },
];

const SAVE_KEY = 'darkRidingHood_progress';

export class OverworldScene extends Phaser.Scene {
  private selectedIndex: number = 0;
  private maxUnlocked: number = 1;
  private playerIcon!: Phaser.GameObjects.Sprite;
  private nodeSprites: Phaser.GameObjects.Arc[] = [];
  private labelText!: Phaser.GameObjects.Text;
  private isMoving: boolean = false;

  constructor() {
    super({ key: 'OverworldScene' });
  }

  create(data?: { returnToLevel?: number }): void {
    this.isMoving = false;
    const sound = getSoundManager();
    sound.setScene(this);

    // Load progress
    this.loadProgress();

    // If returning from a level, select that level
    if (data?.returnToLevel) {
      this.selectedIndex = Math.min(data.returnToLevel - 1, this.maxUnlocked - 1);
    } else {
      this.selectedIndex = Math.min(this.maxUnlocked - 1, LEVELS.length - 1);
    }

    // Background — dark gradient
    const bg = this.add.graphics();
    bg.fillStyle(0x0a0a1a, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Ground
    bg.fillStyle(0x1a2a10, 1);
    bg.fillRect(0, 150, GAME_WIDTH, 30);
    bg.fillStyle(0x142008, 1);
    bg.fillRect(0, 155, GAME_WIDTH, 25);

    // Stars
    for (let i = 0; i < 30; i++) {
      const sx = Phaser.Math.Between(0, GAME_WIDTH);
      const sy = Phaser.Math.Between(0, 80);
      bg.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.3, 0.8));
      bg.fillRect(sx, sy, 1, 1);
    }

    // Trees in background
    for (let i = 0; i < 8; i++) {
      const tx = Phaser.Math.Between(10, GAME_WIDTH - 10);
      const ty = Phaser.Math.Between(100, 148);
      this.drawTree(bg, tx, ty, Phaser.Math.Between(6, 12));
    }

    // Draw paths between nodes
    const pathGfx = this.add.graphics();
    for (let i = 0; i < LEVELS.length - 1; i++) {
      const a = LEVELS[i];
      const b = LEVELS[i + 1];
      const unlocked = i + 1 < this.maxUnlocked;

      // Dotted path
      const dist = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
      const steps = Math.floor(dist / 4);
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const px = Phaser.Math.Linear(a.x, b.x, t);
        const py = Phaser.Math.Linear(a.y, b.y, t);
        if (s % 2 === 0) {
          pathGfx.fillStyle(unlocked ? 0x886633 : 0x333333, unlocked ? 0.8 : 0.4);
          pathGfx.fillRect(Math.floor(px), Math.floor(py), 2, 2);
        }
      }
    }

    // Draw nodes (clickable for mouse support)
    this.nodeSprites = [];
    for (let i = 0; i < LEVELS.length; i++) {
      const node = LEVELS[i];
      const unlocked = i < this.maxUnlocked;
      const completed = i < this.maxUnlocked - 1;

      // Node circle — make interactive for mouse
      const color = completed ? 0x44cc44 : unlocked ? 0xcc3333 : 0x444444;
      const circle = this.add.circle(node.x, node.y, 8, color);
      circle.setStrokeStyle(1, unlocked ? 0xffffff : 0x666666);
      this.nodeSprites.push(circle);

      if (unlocked) {
        circle.setInteractive({ useHandCursor: true });
        const idx = i;
        circle.on('pointerover', () => {
          if (this.selectedIndex !== idx) {
            sound.playMenuSelect();
            this.moveToNode(idx);
          }
        });
        circle.on('pointerdown', () => {
          if (this.selectedIndex !== idx) {
            this.moveToNode(idx);
          }
          sound.playMenuConfirm();
          this.startLevel();
        });
      }

      // Completed checkmark
      if (completed) {
        this.add.text(node.x, node.y - 1, '✓', {
          fontSize: '8px',
          color: '#ffffff',
          fontFamily: 'monospace',
        }).setOrigin(0.5);
      }

      // Lock icon for locked levels
      if (!unlocked) {
        this.add.text(node.x, node.y - 1, '■', {
          fontSize: '8px',
          color: '#666666',
          fontFamily: 'monospace',
        }).setOrigin(0.5);
      }
    }

    // Player icon — generate a small red hood sprite
    if (!this.textures.exists('overworld_player')) {
      this.generatePlayerIcon();
    }
    const startNode = LEVELS[this.selectedIndex];
    this.playerIcon = this.add.sprite(startNode.x, startNode.y - 14, 'overworld_player');
    this.playerIcon.setOrigin(0.5, 1.0);

    // Bobbing animation
    this.tweens.add({
      targets: this.playerIcon,
      y: startNode.y - 16,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Pulse selected node
    this.tweens.add({
      targets: this.nodeSprites[this.selectedIndex],
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Title
    this.add.text(GAME_WIDTH / 2, 10, 'Dark Riding Hood', {
      fontSize: '10px',
      color: '#cc3333',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Level label
    this.labelText = this.add.text(GAME_WIDTH / 2, 25, '', {
      fontSize: '8px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.updateLabel();

    // Controls hint
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 8, '\u2190 \u2192 select   ENTER play', {
      fontSize: '7px',
      color: '#666666',
      fontFamily: 'monospace',
    }).setOrigin(0.5);

    // Input
    this.input.keyboard!.on('keydown-LEFT', () => { this.moveSelection(-1); sound.playMenuSelect(); });
    this.input.keyboard!.on('keydown-RIGHT', () => { this.moveSelection(1); sound.playMenuSelect(); });
    this.input.keyboard!.on('keydown-A', () => { this.moveSelection(-1); sound.playMenuSelect(); });
    this.input.keyboard!.on('keydown-D', () => { this.moveSelection(1); sound.playMenuSelect(); });
    this.input.keyboard!.on('keydown-ENTER', () => { sound.playMenuConfirm(); this.startLevel(); });
    this.input.keyboard!.on('keydown-SPACE', () => { sound.playMenuConfirm(); this.startLevel(); });
  }

  private moveSelection(dir: number): void {
    if (this.isMoving) return;

    const newIndex = this.selectedIndex + dir;
    if (newIndex < 0 || newIndex >= LEVELS.length) return;
    if (newIndex >= this.maxUnlocked) return;

    this.moveToNode(newIndex);
  }

  private moveToNode(newIndex: number): void {
    if (this.isMoving) return;
    if (newIndex === this.selectedIndex) return;

    const oldIndex = this.selectedIndex;
    this.selectedIndex = newIndex;

    // Stop old node pulse
    this.tweens.killTweensOf(this.nodeSprites[oldIndex]);
    this.nodeSprites[oldIndex].setScale(1);

    // Move player icon
    this.isMoving = true;
    const target = LEVELS[this.selectedIndex];
    this.tweens.killTweensOf(this.playerIcon);

    this.tweens.add({
      targets: this.playerIcon,
      x: target.x,
      y: target.y - 14,
      duration: 300,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.isMoving = false;
        // Restart bobbing
        this.tweens.add({
          targets: this.playerIcon,
          y: target.y - 16,
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      },
    });

    // Pulse new node
    this.tweens.add({
      targets: this.nodeSprites[this.selectedIndex],
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.updateLabel();
  }

  private startLevel(): void {
    if (this.isMoving) return;
    const level = LEVELS[this.selectedIndex];

    // Flash the node
    this.nodeSprites[this.selectedIndex].setFillStyle(0xffffff);
    this.time.delayedCall(200, () => {
      this.scene.start('GameScene', { level: level.level });
    });
  }

  private updateLabel(): void {
    const node = LEVELS[this.selectedIndex];
    this.labelText.setText(`Level ${node.level}: ${node.label}`);
  }

  private loadProgress(): void {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        this.maxUnlocked = data.maxUnlocked ?? 1;
      }
    } catch {
      this.maxUnlocked = 1;
    }
  }

  static saveProgress(maxUnlocked: number): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ maxUnlocked }));
    } catch {
      // Storage unavailable
    }
  }

  private drawTree(g: Phaser.GameObjects.Graphics, x: number, y: number, h: number): void {
    // Trunk
    g.fillStyle(0x2a1a08, 1);
    g.fillRect(x - 1, y - h * 0.3, 2, Math.floor(h * 0.3));
    // Canopy
    g.fillStyle(0x0a2a08, 0.7);
    const canopyH = Math.floor(h * 0.7);
    for (let row = 0; row < canopyH; row++) {
      const w = Math.floor((canopyH - row) * 0.6) + 1;
      g.fillRect(x - w, y - h + row, w * 2, 1);
    }
  }

  private generatePlayerIcon(): void {
    const g = this.add.graphics();
    g.setVisible(false);
    // Small red riding hood icon (8x10)
    // Hood
    g.fillStyle(0xcc3333, 1);
    g.fillRect(2, 0, 4, 3);
    g.fillRect(1, 1, 6, 2);
    // Face
    g.fillStyle(0xffcc99, 1);
    g.fillRect(2, 3, 4, 2);
    // Eyes
    g.fillStyle(0x000000, 1);
    g.fillRect(3, 3, 1, 1);
    g.fillRect(5, 3, 1, 1);
    // Body/cloak
    g.fillStyle(0xcc3333, 1);
    g.fillRect(1, 5, 6, 3);
    g.fillRect(2, 8, 4, 2);
    // Feet
    g.fillStyle(0x553322, 1);
    g.fillRect(2, 9, 2, 1);
    g.fillRect(5, 9, 2, 1);
    g.generateTexture('overworld_player', 8, 10);
    g.destroy();
  }
}
