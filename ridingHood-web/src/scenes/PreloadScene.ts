import Phaser from 'phaser';
import { LIGHT_ANIMS, DARK_ANIMS, FX_ANIMS, type AnimDef } from '../config/AnimationConfig';
import { SoundManager } from '../systems/SoundManager';
import { LEVELS } from '../levels/LevelData';

function padIndex(i: number, zeroPad: number): string {
  if (zeroPad <= 0) return String(i);
  return String(i).padStart(zeroPad, '0');
}

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // Progress bar
    const barW = 200;
    const barH = 10;
    const barX = (this.cameras.main.width - barW) / 2;
    const barY = this.cameras.main.height / 2;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(barX, barY, barW, barH);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xcc3333, 1);
      progressBar.fillRect(barX + 1, barY + 1, (barW - 2) * value, barH - 2);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
    });

    // Load player sprite frames
    this.loadFormFrames('light', 'assets/sprites/light', LIGHT_ANIMS);
    this.loadFormFrames('dark', 'assets/sprites/dark', DARK_ANIMS);

    // Load FX frames — explicitly map each to its source folder
    // fx_light and fx_lighttodark live in the Light folder
    // fx_dark and fx_darktolight live in the Dark folder
    this.loadFXFrames('assets/sprites/light', FX_ANIMS.filter(a => a.key === 'fx_light' || a.key === 'fx_lighttodark'));
    this.loadFXFrames('assets/sprites/dark', FX_ANIMS.filter(a => a.key === 'fx_dark' || a.key === 'fx_darktolight'));

    // Load background layers for all levels
    const loadedKeys = new Set<string>();
    for (const level of LEVELS) {
      for (const layer of level.parallaxLayers) {
        if (!loadedKeys.has(layer.key)) {
          this.load.image(layer.key, layer.path);
          loadedKeys.add(layer.key);
        }
      }
    }

    // Load tileset image
    this.load.image('metroidvania-tiles', 'assets/tilemaps/s4m_ur4i-metroidvania-1.3.png');

    // Load enemy spritesheets
    this.load.image('dungeon_tileset', 'assets/sprites/enemies/dungeon_tileset.png');
    this.load.image('metroidvania_tileset', 'assets/sprites/enemies/metroidvania_tileset.png');

    // Load food spritesheet
    this.load.image('food_sheet', 'assets/sprites/enemies/food.png');

    // Load all audio assets
    SoundManager.preloadAll(this);
  }

  private loadFormFrames(form: string, basePath: string, anims: AnimDef[]): void {
    for (const anim of anims) {
      for (let i = 0; i < anim.frames; i++) {
        const idx = padIndex(i, anim.zeroPad);
        const key = `${form}_${anim.folder}_${i}`;
        this.load.image(key, `${basePath}/${anim.folder}/${anim.prefix}${idx}.png`);
      }
    }
  }

  private loadFXFrames(basePath: string, anims: AnimDef[]): void {
    for (const anim of anims) {
      for (let i = 0; i < anim.frames; i++) {
        const idx = padIndex(i, anim.zeroPad);
        const key = `${anim.key}_${i}`;
        this.load.image(key, `${basePath}/${anim.folder}/${anim.prefix}${idx}.png`);
      }
    }
  }

  create(): void {
    // Register all animations
    this.registerAnimations('light', LIGHT_ANIMS);
    this.registerAnimations('dark', DARK_ANIMS);
    this.registerFXAnimations(FX_ANIMS);

    // Register enemy animations from spritesheets
    this.registerEnemyAnimations();

    this.scene.start('MainMenuScene');
  }

  private registerAnimations(form: string, anims: AnimDef[]): void {
    for (const anim of anims) {
      const frames: Phaser.Types.Animations.AnimationFrame[] = [];
      for (let i = 0; i < anim.frames; i++) {
        frames.push({ key: `${form}_${anim.folder}_${i}` });
      }
      this.anims.create({
        key: anim.key,
        frames,
        frameRate: anim.frameRate,
        repeat: anim.repeat,
      });
    }
  }

  private registerFXAnimations(anims: AnimDef[]): void {
    for (const anim of anims) {
      const frames: Phaser.Types.Animations.AnimationFrame[] = [];
      for (let i = 0; i < anim.frames; i++) {
        frames.push({ key: `${anim.key}_${i}` });
      }
      this.anims.create({
        key: anim.key,
        frames,
        frameRate: anim.frameRate,
        repeat: anim.repeat,
      });
    }
  }

  private registerEnemyAnimations(): void {
    // Extract orc walk frames from the dungeon tileset (0x72)
    // Walk frames: 7 frames, each 21x30, at y=386
    // x positions: 22, 54, 86, 150, 182, 214, 246
    const orcWalkPositions = [22, 54, 86, 150, 182, 214, 246];
    const src = this.textures.get('dungeon_tileset').getSourceImage() as HTMLImageElement;

    for (let i = 0; i < orcWalkPositions.length; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 21;
      canvas.height = 30;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(src, orcWalkPositions[i], 386, 21, 30, 0, 0, 21, 30);
      this.textures.addCanvas(`orc_walk_${i}`, canvas);
    }

    this.anims.create({
      key: 'orc_walk',
      frames: orcWalkPositions.map((_, i) => ({ key: `orc_walk_${i}` })),
      frameRate: 10,
      repeat: -1,
    });

    // Extract orc death frames from metroidvania tileset
    // Death frames: 9 frames at 16x16
    // Row 1 (y=32): x=0, x=16, x=32
    // Row 2 (y=48): x=0, x=16, x=32
    // Row 3 (y=64): x=0, x=16, x=32
    const deathPositions = [
      { x: 0, y: 32 }, { x: 16, y: 32 }, { x: 16, y: 48 },
      { x: 0, y: 48 }, { x: 0, y: 64 }, { x: 16, y: 64 },
      { x: 32, y: 64 }, { x: 32, y: 48 }, { x: 32, y: 32 },
    ];
    const deathSrc = this.textures.get('metroidvania_tileset').getSourceImage() as HTMLImageElement;

    for (let i = 0; i < deathPositions.length; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(deathSrc, deathPositions[i].x, deathPositions[i].y, 16, 16, 0, 0, 16, 16);
      this.textures.addCanvas(`orc_death_${i}`, canvas);
    }

    this.anims.create({
      key: 'orc_death',
      frames: deathPositions.map((_, i) => ({ key: `orc_death_${i}` })),
      frameRate: 16,
      repeat: 0,
    });

    // Extract food and wolf essence sprites from food sheet (128x128, 8x8 grid of 16x16)
    const foodSrc = this.textures.get('food_sheet').getSourceImage() as HTMLImageElement;

    // Apple (row 0, col 0) for food pickup
    const foodCanvas = document.createElement('canvas');
    foodCanvas.width = 16;
    foodCanvas.height = 16;
    foodCanvas.getContext('2d')!.drawImage(foodSrc, 0, 0, 16, 16, 0, 0, 16, 16);
    this.textures.addCanvas('pickup_food', foodCanvas);

    // Purple potion-like item (row 1, col 4) for wolf essence
    const essenceCanvas = document.createElement('canvas');
    essenceCanvas.width = 16;
    essenceCanvas.height = 16;
    essenceCanvas.getContext('2d')!.drawImage(foodSrc, 64, 16, 16, 16, 0, 0, 16, 16);
    this.textures.addCanvas('pickup_wolf_essence', essenceCanvas);

    // Extract boss (demon) sprites from dungeon tileset
    // Walk: 3 frames at 26x34
    const bossWalkPositions = [
      { x: 149, y: 430, w: 26, h: 34 },
      { x: 117, y: 430, w: 26, h: 34 },
      { x: 245, y: 430, w: 26, h: 34 },
    ];
    for (let i = 0; i < bossWalkPositions.length; i++) {
      const p = bossWalkPositions[i];
      const c = document.createElement('canvas');
      c.width = p.w; c.height = p.h;
      c.getContext('2d')!.drawImage(src, p.x, p.y, p.w, p.h, 0, 0, p.w, p.h);
      this.textures.addCanvas(`boss_walk_${i}`, c);
    }
    this.anims.create({
      key: 'boss_walk',
      frames: bossWalkPositions.map((_, i) => ({ key: `boss_walk_${i}` })),
      frameRate: 3,
      repeat: -1,
    });

    // Attack: 4 frames at 28x36
    const bossAttackPositions = [
      { x: 214, y: 432, w: 28, h: 36 },
      { x: 181, y: 432, w: 28, h: 36 },
      { x: 148, y: 432, w: 28, h: 36 },
      { x: 181, y: 432, w: 28, h: 36 },
    ];
    for (let i = 0; i < bossAttackPositions.length; i++) {
      const p = bossAttackPositions[i];
      const c = document.createElement('canvas');
      c.width = p.w; c.height = p.h;
      c.getContext('2d')!.drawImage(src, p.x, p.y, p.w, p.h, 0, 0, p.w, p.h);
      this.textures.addCanvas(`boss_attack_${i}`, c);
    }
    this.anims.create({
      key: 'boss_attack',
      frames: bossAttackPositions.map((_, i) => ({ key: `boss_attack_${i}` })),
      frameRate: 5,
      repeat: 0,
    });

    // Death: 3 frames at 26x34
    const bossDeathPositions = [
      { x: 277, y: 430, w: 26, h: 34 },
      { x: 309, y: 430, w: 26, h: 34 },
      { x: 341, y: 430, w: 26, h: 34 },
    ];
    for (let i = 0; i < bossDeathPositions.length; i++) {
      const p = bossDeathPositions[i];
      const c = document.createElement('canvas');
      c.width = p.w; c.height = p.h;
      c.getContext('2d')!.drawImage(src, p.x, p.y, p.w, p.h, 0, 0, p.w, p.h);
      this.textures.addCanvas(`boss_death_${i}`, c);
    }
    this.anims.create({
      key: 'boss_death',
      frames: bossDeathPositions.map((_, i) => ({ key: `boss_death_${i}` })),
      frameRate: 8,
      repeat: 0,
    });
  }
}
