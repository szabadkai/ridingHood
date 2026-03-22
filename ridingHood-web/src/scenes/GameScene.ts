import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, DARKNESS_METER } from '../config/GameConfig';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/enemies/Enemy';
import { Orc } from '../entities/enemies/Orc';
import { WolfKing, getBossConfig } from '../entities/enemies/WolfKing';
import { Checkpoint } from '../entities/Checkpoint';
import { Pickup } from '../entities/Pickup';
import { CameraManager } from '../systems/CameraManager';
import { ParallaxManager } from '../systems/ParallaxManager';
import { EventBus, Events } from '../utils/EventBus';
import { getLevelConfig, type LevelConfig } from '../levels/LevelData';
import type { LevelStats } from './VictoryScene';
import { getSoundManager } from '../systems/SoundManager';

const TILE_SIZE = 16;

// Tile IDs for our custom tileset
const T = {
  EMPTY: -1,
  GROUND_TOP: 0,
  GROUND_FILL: 1,
  PLATFORM: 2,
  STONE: 3,
};

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private cameraManager!: CameraManager;
  private parallaxManager!: ParallaxManager;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private enemies!: Phaser.GameObjects.Group;
  private checkpoints!: Phaser.GameObjects.Group;
  private pickups!: Phaser.GameObjects.Group;
  private bossArenaLocked: boolean = false;
  private levelStartTime: number = 0;
  private enemiesKilled: number = 0;
  private damagesTaken: number = 0;
  public currentLevel: number = 1;
  private lvl!: LevelConfig;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.bossArenaLocked = false;

    // Initialize sound manager for this scene
    const sound = getSoundManager();
    sound.setScene(this);
    sound.playMusic('music_forest');

    // Determine which level to load
    this.currentLevel = (this.scene.settings.data as { level?: number })?.level ?? 1;
    this.lvl = getLevelConfig(this.currentLevel);

    // Generate tile textures (themed per level)
    this.generateTileTextures();

    // Parallax background
    this.parallaxManager = new ParallaxManager(this);
    this.parallaxManager.create(this.lvl.parallaxLayers);
    this.parallaxManager.setThemeTint(this.lvl.tintColor, this.lvl.tintAlpha);

    // Create tilemap level
    this.createTilemapLevel();

    // Name the ground layer so enemies can look it up for edge detection
    this.groundLayer.setName('groundLayer');

    // Create player — spawn at ground level (origin is bottom-center)
    const groundY = (this.lvl.mapHeightTiles - 2) * TILE_SIZE;
    this.player = new Player(this, this.lvl.playerSpawnX, groundY);

    // Player-tilemap collision
    this.physics.add.collider(
      this.player as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType,
      this.groundLayer,
    );

    // Create enemies
    this.enemies = this.add.group();
    this.spawnEnemies();

    // Enemy-tilemap collision
    this.physics.add.collider(
      this.enemies,
      this.groundLayer,
    );

    // Player attack hitbox vs enemies — deal damage
    this.physics.add.overlap(
      this.player.getAttackHitbox(),
      this.enemies,
      (_hitbox, enemyObj) => {
        const enemy = enemyObj as unknown as Enemy;
        if (!this.player.isAttacking() || !enemy.getIsAlive()) return;
        if (this.player.hasHitEnemy(enemy)) return;
        this.player.markEnemyHit(enemy);

        const dir = new Phaser.Math.Vector2(
          enemy.x - this.player.x,
          -0.5,
        ).normalize();
        enemy.takeDamage(this.player.getAttackDamage(), dir);
        getSoundManager().playEnemyHit();

        this.player.addDarknessMeter(DARKNESS_METER.GAIN_ON_DEAL_DAMAGE);
      },
    );

    // Enemy touching player — deal contact damage
    this.physics.add.overlap(
      this.player as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType,
      this.enemies,
      (_playerObj, enemyObj) => {
        const enemy = enemyObj as unknown as Enemy;
        if (!enemy.getIsAlive()) return;

        const knockbackDir = new Phaser.Math.Vector2(
          this.player.x - enemy.x,
          -0.5,
        ).normalize();
        this.player.takeDamage(enemy.getDamage(), knockbackDir);
      },
    );

    // Create checkpoints
    this.checkpoints = this.add.group();
    this.spawnCheckpoints();

    // Player-checkpoint overlap
    this.physics.add.overlap(
      this.player as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType,
      this.checkpoints,
      (_playerObj, cpObj) => {
        const cp = cpObj as unknown as Checkpoint;
        if (!cp.getIsActivated()) {
          cp.activate();
          this.player.setCheckpoint(new Phaser.Math.Vector2(cp.x, cp.y));
          this.player.restoreHealth(5);
          getSoundManager().playCheckpoint();
        }
      },
    );

    // Create pickups
    this.pickups = this.add.group();
    this.spawnPickups();

    // Player-pickup overlap
    this.physics.add.overlap(
      this.player as unknown as Phaser.Types.Physics.Arcade.ArcadeColliderType,
      this.pickups,
      (_playerObj, pickupObj) => {
        const pickup = pickupObj as unknown as Pickup;
        if (pickup.isCollected()) return;

        if (pickup.getPickupType() === 'food') {
          this.player.restoreHealth(1);
          getSoundManager().playPickupFood();
        } else if (pickup.getPickupType() === 'wolf_essence') {
          this.player.addDarknessMeter(DARKNESS_METER.GAIN_ON_WOLF_ESSENCE);
          getSoundManager().playPickupEssence();
        }
        pickup.collect();
      },
    );

    // Camera
    this.cameraManager = new CameraManager(this);
    this.cameraManager.follow(this.player as unknown as Phaser.GameObjects.GameObject);
    this.cameraManager.setBounds(0, 0, this.lvl.mapWidthTiles * TILE_SIZE, this.lvl.mapHeightTiles * TILE_SIZE);

    // World bounds
    this.physics.world.setBounds(0, 0, this.lvl.mapWidthTiles * TILE_SIZE, this.lvl.mapHeightTiles * TILE_SIZE + 50);

    // Launch UI overlay scene
    this.scene.launch('UIScene');

    // Listen for form changes to update parallax tint and music
    const onFormChanged = (form: string) => {
      if (form === 'dark') {
        this.parallaxManager.setThemeTint(this.lvl.darkTintColor, this.lvl.darkTintAlpha);
        getSoundManager().crossfadeMusic('music_boss');
      } else {
        this.parallaxManager.setThemeTint(this.lvl.tintColor, this.lvl.tintAlpha);
        if (!this.bossArenaLocked) {
          getSoundManager().crossfadeMusic('music_forest');
        }
      }
    };
    EventBus.on(Events.FORM_CHANGED, onFormChanged);

    // Track stats
    this.levelStartTime = this.time.now;
    this.enemiesKilled = 0;
    this.damagesTaken = 0;

    // Give player meter on enemy kill + track stat
    const onEnemyKilled = () => {
      this.player.addDarknessMeter(DARKNESS_METER.GAIN_ON_KILL);
      this.enemiesKilled++;
      getSoundManager().playEnemyDeath();
    };
    EventBus.on(Events.ENEMY_KILLED, onEnemyKilled);

    const onPlayerDamaged = () => {
      this.damagesTaken++;
    };
    EventBus.on(Events.PLAYER_DAMAGED, onPlayerDamaged);

    // Boss defeated → victory screen after a short delay
    const onBossKilled = () => {
      this.time.delayedCall(1500, () => {
        const stats: LevelStats = {
          level: this.currentLevel,
          enemiesKilled: this.enemiesKilled,
          timeSeconds: (this.time.now - this.levelStartTime) / 1000,
          damagesTaken: this.damagesTaken,
        };
        this.scene.stop('UIScene');
        this.scene.start('VictoryScene', stats);
      });
    };
    EventBus.on(Events.BOSS_KILLED, onBossKilled);

    // Pause menu
    this.input.keyboard!.on('keydown-ESC', () => this.openPause());
    this.input.keyboard!.on('keydown-P', () => this.openPause());

    this.events.on('shutdown', () => {
      EventBus.off(Events.FORM_CHANGED, onFormChanged);
      EventBus.off(Events.ENEMY_KILLED, onEnemyKilled);
      EventBus.off(Events.PLAYER_DAMAGED, onPlayerDamaged);
      EventBus.off(Events.BOSS_KILLED, onBossKilled);
      getSoundManager().stopMusic(0);
    });
  }

  /** Check if a pixel X position falls over a gap */
  private isOverGap(xPixel: number): boolean {
    const col = Math.floor(xPixel / TILE_SIZE);
    for (const gap of this.lvl.gaps) {
      if (col >= gap.start && col <= gap.end) return true;
    }
    return false;
  }

  private spawnEnemies(): void {
    const groundY = (this.lvl.mapHeightTiles - 2) * TILE_SIZE;

    for (const xPos of this.lvl.orcPositions) {
      // Don't spawn enemies over chasms
      if (this.isOverGap(xPos)) continue;
      const orc = new Orc(this, xPos, groundY);
      orc.setPlayerRef(this.player);
      this.enemies.add(orc as unknown as Phaser.GameObjects.GameObject);
    }

    // Wolf King boss — spawn centered in the arena for safety
    const arenaLeft = this.lvl.bossArenaWallCol * TILE_SIZE;
    const arenaRight = this.lvl.mapWidthTiles * TILE_SIZE;
    const safeBossX = Math.max(this.lvl.bossX, arenaLeft + 40);
    const clampedBossX = Math.min(safeBossX, arenaRight - 40);
    const boss = new WolfKing(this, clampedBossX, groundY, this.currentLevel);
    boss.setPlayerRef(this.player);
    (boss.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
    this.enemies.add(boss as unknown as Phaser.GameObjects.GameObject);
  }

  private spawnCheckpoints(): void {
    const groundY = (this.lvl.mapHeightTiles - 2) * TILE_SIZE;

    for (const xPos of this.lvl.checkpointPositions) {
      // Never spawn checkpoints over chasms
      if (this.isOverGap(xPos)) continue;
      const cp = new Checkpoint(this, xPos, groundY);
      this.checkpoints.add(cp as unknown as Phaser.GameObjects.GameObject);
    }
  }

  private spawnPickups(): void {
    const groundY = (this.lvl.mapHeightTiles - 2) * TILE_SIZE;

    for (const xPos of this.lvl.foodPositions) {
      if (this.isOverGap(xPos)) continue;
      const food = new Pickup(this, xPos, groundY - 8, 'food', 'pickup_food');
      this.pickups.add(food as unknown as Phaser.GameObjects.GameObject);
    }

    for (const xPos of this.lvl.essencePositions) {
      if (this.isOverGap(xPos)) continue;
      const essence = new Pickup(this, xPos, groundY - 8, 'wolf_essence', 'pickup_wolf_essence');
      this.pickups.add(essence as unknown as Phaser.GameObjects.GameObject);
    }
  }

  private tilesetKey(): string {
    return `custom_tileset_${this.currentLevel}`;
  }

  private generateTileTextures(): void {
    // Use level-specific texture keys to avoid removal issues
    const tsKey = this.tilesetKey();
    if (this.textures.exists(tsKey)) return; // Already generated for this level

    const S = TILE_SIZE;
    const lv = this.lvl;
    const pfx = `tile_${this.currentLevel}_`;

    const makeTile = (suffix: string, drawFn: (g: Phaser.GameObjects.Graphics) => void) => {
      const name = pfx + suffix;
      if (this.textures.exists(name)) return;
      const g = this.add.graphics();
      g.setVisible(false);
      drawFn(g);
      g.generateTexture(name, S, S);
      g.destroy();
    };

    makeTile('ground_top', (g) => {
      g.fillStyle(lv.groundColor, 1);
      g.fillRect(0, 0, S, S);
      g.fillStyle(lv.groundDetailColor, 1);
      g.fillRect(2, 6, 3, 2);
      g.fillRect(8, 10, 4, 2);
      g.fillRect(12, 5, 2, 3);
      g.fillStyle(lv.grassColor, 1);
      g.fillRect(0, 0, S, 3);
      g.fillStyle(lv.grassHighlightColor, 1);
      g.fillRect(1, 0, 3, 1);
      g.fillRect(6, 0, 4, 1);
      g.fillRect(12, 0, 2, 1);
      g.fillStyle(lv.grassColor, 1);
      g.fillRect(0, 3, 1, 2);
      g.fillRect(5, 3, 1, 1);
      g.fillRect(10, 3, 1, 2);
      g.fillRect(14, 3, 1, 1);
    });

    makeTile('ground_fill', (g) => {
      g.fillStyle(lv.groundColor, 1);
      g.fillRect(0, 0, S, S);
      g.fillStyle(lv.groundDetailColor, 1);
      g.fillRect(1, 2, 2, 2);
      g.fillRect(6, 7, 3, 2);
      g.fillRect(11, 1, 2, 3);
      g.fillRect(3, 11, 4, 2);
      g.fillRect(13, 10, 2, 2);
      // Stone flecks
      const fleckColor = Phaser.Display.Color.IntegerToColor(lv.stoneColor).darken(20).color;
      g.fillStyle(fleckColor, 1);
      g.fillRect(4, 5, 2, 1);
      g.fillRect(10, 12, 2, 1);
    });

    makeTile('platform', (g) => {
      // Use ground color lightened for platforms
      const platBase = Phaser.Display.Color.IntegerToColor(lv.groundColor).lighten(30).color;
      const platLight = Phaser.Display.Color.IntegerToColor(lv.groundColor).lighten(50).color;
      const platTop = Phaser.Display.Color.IntegerToColor(lv.groundColor).lighten(60).color;
      const platBot = Phaser.Display.Color.IntegerToColor(lv.groundColor).lighten(10).color;
      g.fillStyle(platBase, 1);
      g.fillRect(0, 0, S, 6);
      g.fillStyle(platLight, 1);
      g.fillRect(1, 1, S - 2, 1);
      g.fillRect(2, 3, 4, 1);
      g.fillRect(9, 3, 4, 1);
      g.fillStyle(platTop, 1);
      g.fillRect(0, 0, S, 1);
      g.fillStyle(platBot, 1);
      g.fillRect(0, 5, S, 1);
      g.fillStyle(lv.stoneColor, 1);
      g.fillRect(1, 2, 1, 1);
      g.fillRect(14, 2, 1, 1);
    });

    makeTile('stone', (g) => {
      g.fillStyle(lv.stoneColor, 1);
      g.fillRect(0, 0, S, S);
      const dark = Phaser.Display.Color.IntegerToColor(lv.stoneColor).darken(15).color;
      const light = Phaser.Display.Color.IntegerToColor(lv.stoneColor).lighten(15).color;
      const darker = Phaser.Display.Color.IntegerToColor(lv.stoneColor).darken(30).color;
      g.fillStyle(dark, 1);
      g.fillRect(0, 0, S, 1);
      g.fillRect(0, 0, 1, S);
      g.fillRect(2, 4, 5, 3);
      g.fillRect(9, 8, 4, 4);
      g.fillStyle(light, 1);
      g.fillRect(1, 1, 3, 2);
      g.fillRect(8, 2, 3, 2);
      g.fillRect(3, 10, 4, 2);
      g.fillStyle(darker, 1);
      g.fillRect(0, 7, S, 1);
      g.fillRect(7, 0, 1, 7);
      g.fillRect(5, 8, 1, S - 8);
    });

    const combined = this.add.renderTexture(0, 0, S * 4, S);
    combined.setVisible(false);
    combined.draw(pfx + 'ground_top', 0, 0);
    combined.draw(pfx + 'ground_fill', S, 0);
    combined.draw(pfx + 'platform', S * 2, 0);
    combined.draw(pfx + 'stone', S * 3, 0);
    combined.saveTexture(tsKey);
    combined.destroy();
  }

  private createTilemapLevel(): void {
    const W = this.lvl.mapWidthTiles;
    const H = this.lvl.mapHeightTiles;

    const data: number[][] = [];
    for (let row = 0; row < H; row++) {
      data.push(new Array(W).fill(T.EMPTY));
    }

    const groundRow = H - 2;
    const fillRow = H - 1;

    // Build gap set for fast lookup
    const gapCols = new Set<number>();
    for (const gap of this.lvl.gaps) {
      for (let c = gap.start; c <= gap.end; c++) {
        gapCols.add(c);
      }
    }

    // Ground
    for (let col = 0; col < W; col++) {
      if (gapCols.has(col)) continue;
      data[groundRow][col] = T.GROUND_TOP;
      data[fillRow][col] = T.GROUND_FILL;
    }

    // Platforms
    for (const p of this.lvl.platforms) {
      for (let i = 0; i < p.width; i++) {
        const col = p.x + i;
        if (col < W) {
          data[p.y][col] = T.PLATFORM;
        }
      }
    }

    // Walls
    for (const w of this.lvl.walls) {
      for (let row = w.yTop; row <= w.yBot; row++) {
        data[row][w.x] = T.STONE;
      }
    }

    // Boss arena wall is NOT placed at build time — it gets placed dynamically
    // when the player crosses the trigger column (see lockBossArena).

    const map = this.make.tilemap({
      data,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    });

    const tileset = map.addTilesetImage(this.tilesetKey())!;
    this.groundLayer = map.createLayer(0, tileset, 0, 0)!;

    this.groundLayer.setCollisionByExclusion([T.EMPTY]);
    this.groundLayer.setDepth(0);
  }

  update(time: number, delta: number): void {
    this.player.update(time, delta);
    this.parallaxManager.update();

    // Update all enemies
    for (const enemy of this.enemies.getChildren()) {
      (enemy as unknown as Enemy).update(time, delta);
    }

    // Boss arena lock — when player crosses the trigger column
    const triggerCol = this.lvl.bossArenaWallCol + 1;
    if (!this.bossArenaLocked && this.player.x >= triggerCol * TILE_SIZE) {
      this.lockBossArena();
    }

    // Fall death
    if (this.player.y > this.lvl.mapHeightTiles * TILE_SIZE + 40) {
      this.player.takeDamage(999, new Phaser.Math.Vector2(0, 0));
    }
  }

  private lockBossArena(): void {
    this.bossArenaLocked = true;

    // No respawning during boss fight — die here and it's game over
    this.player.clearCheckpoint();

    const arenaWall = this.lvl.bossArenaWallCol;
    const arenaLeft = arenaWall * TILE_SIZE;
    const arenaWidth = (this.lvl.mapWidthTiles - arenaWall) * TILE_SIZE;
    const arenaHeight = this.lvl.mapHeightTiles * TILE_SIZE;
    const arenaCenterX = arenaLeft + arenaWidth / 2;
    const arenaCenterY = arenaHeight / 2;

    // ── Phase 1: Freeze gameplay ──
    // Stop player movement and disable input during cinematic
    const playerBody = this.player.body as Phaser.Physics.Arcade.Body;
    playerBody.velocity.set(0, 0);
    playerBody.setAllowGravity(false);
    this.player.setActive(false); // stops player update

    // Close the wall behind the player immediately
    const layer = this.groundLayer;
    for (let row = 0; row <= this.lvl.mapHeightTiles - 3; row++) {
      const tile = layer.getTileAt(arenaWall, row);
      if (!tile) {
        layer.putTileAt(T.STONE, arenaWall, row);
      }
    }
    this.groundLayer.setCollisionByExclusion([T.EMPTY]);

    // Expand camera bounds so pan can reach the arena
    this.cameraManager.setBounds(0, 0, this.lvl.mapWidthTiles * TILE_SIZE, arenaHeight);

    // ── Phase 2: Pan camera to boss arena (800ms) ──
    this.cameraManager.panTo(arenaCenterX, arenaCenterY, 800, () => {

      // ── Phase 3: Letterbox + boss title card ──
      getSoundManager().crossfadeMusic('music_boss');

      // Letterbox bars
      const cam = this.cameras.main;
      const barHeight = 24;
      const topBar = this.add.rectangle(cam.scrollX + GAME_WIDTH / 2, cam.scrollY - barHeight / 2, GAME_WIDTH, barHeight, 0x000000)
        .setDepth(100).setScrollFactor(0).setOrigin(0.5, 0.5);
      const botBar = this.add.rectangle(cam.scrollX + GAME_WIDTH / 2, cam.scrollY + GAME_HEIGHT + barHeight / 2, GAME_WIDTH, barHeight, 0x000000)
        .setDepth(100).setScrollFactor(0).setOrigin(0.5, 0.5);

      // Slide letterbox bars in
      this.tweens.add({ targets: topBar, y: cam.scrollY + barHeight / 2, duration: 300, ease: 'Sine.easeOut' });
      this.tweens.add({ targets: botBar, y: cam.scrollY + GAME_HEIGHT - barHeight / 2, duration: 300, ease: 'Sine.easeOut' });

      // Boss name title card
      const bossCfg = getBossConfig(this.currentLevel);
      const titleText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 8, bossCfg.name.toUpperCase(), {
        fontSize: '14px',
        color: '#ff4444',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(101).setScrollFactor(0).setAlpha(0);

      const subtitleText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 8, `Level ${this.currentLevel} Boss`, {
        fontSize: '8px',
        color: '#ffaa88',
        fontFamily: 'monospace',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(101).setScrollFactor(0).setAlpha(0);

      // Fade in title
      this.tweens.add({
        targets: [titleText, subtitleText],
        alpha: 1,
        duration: 400,
        delay: 200,
      });

      // Roar after title appears
      this.time.delayedCall(500, () => {
        getSoundManager().playBossRoar();
        this.cameras.main.shake(300, 0.008);
      });

      // ── Phase 4: Hold for a beat, then start the fight ──
      this.time.delayedCall(2200, () => {
        // Fade out title
        this.tweens.add({
          targets: [titleText, subtitleText],
          alpha: 0,
          duration: 300,
          onComplete: () => { titleText.destroy(); subtitleText.destroy(); },
        });

        // Slide letterbox bars out
        this.tweens.add({ targets: topBar, y: cam.scrollY - barHeight / 2, duration: 300, ease: 'Sine.easeIn', onComplete: () => topBar.destroy() });
        this.tweens.add({ targets: botBar, y: cam.scrollY + GAME_HEIGHT + barHeight / 2, duration: 300, ease: 'Sine.easeIn', onComplete: () => botBar.destroy() });

        // Lock camera to arena bounds and resume follow
        this.cameraManager.setBounds(arenaLeft, 0, arenaWidth, arenaHeight);
        this.cameraManager.resumeFollow();

        // Constrain player and boss within the arena
        this.physics.world.setBounds(arenaLeft, 0, arenaWidth, arenaHeight + 50);
        playerBody.setCollideWorldBounds(true);
        playerBody.setAllowGravity(true);
        this.player.setActive(true); // re-enable player update
      });
    });
  }

  private openPause(): void {
    if (this.scene.isPaused()) return;
    this.scene.pause();
    this.scene.pause('UIScene');
    this.scene.launch('PauseScene');
  }
}
