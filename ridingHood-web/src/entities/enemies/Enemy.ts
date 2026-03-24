import Phaser from 'phaser';
import { EventBus, Events } from '../../utils/EventBus';
import { spawnDeathEffect } from '../../effects/DeathEffect';

export interface EnemyConfig {
  speed: number;
  health: number;
  damage: number;
  acceleration: number;
  bodyWidth: number;
  bodyHeight: number;
  /** Distance at which enemy notices the player and gives chase */
  aggroRange?: number;
  /** Speed multiplier when chasing (default 1.6) */
  chaseSpeedMult?: number;
  /** Walk animation key (default 'orc_walk') */
  walkAnim?: string;
  /** Death animation key (default 'orc_death') */
  deathAnim?: string;
  /** Primary color for death particles (default 0xcc3333) */
  deathColor?: number;
  /** Number of particles on death (default 12) */
  deathParticles?: number;
}

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  protected config: EnemyConfig;
  protected currentHealth: number;
  protected direction: number = 1;
  protected isAlive: boolean = true;
  protected playerRef: Phaser.Physics.Arcade.Sprite | null = null;
  protected isChasing: boolean = false;

  // Patrol ray — we'll check for edges manually
  private edgeCheckOffset: number = 8;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    config: EnemyConfig,
  ) {
    super(scene, x, y, texture);
    this.config = config;
    this.currentHealth = config.health;

    scene.add.existing(this as Phaser.GameObjects.GameObject);
    scene.physics.add.existing(this as unknown as Phaser.GameObjects.GameObject);

    // Anchor at bottom-center like the player
    this.setOrigin(0.5, 1.0);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(config.bodyWidth, config.bodyHeight);
    body.setOffset(
      Math.floor((this.width - config.bodyWidth) / 2),
      this.height - config.bodyHeight,
    );
    body.setCollideWorldBounds(false);
    body.setMaxVelocityY(400);
  }

  setPlayerRef(player: Phaser.Physics.Arcade.Sprite): void {
    this.playerRef = player;
  }

  update(_time: number, delta: number): void {
    if (!this.isAlive) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const dt = delta / 1000;
    const onFloor = body.blocked.down;

    // Check for player aggro
    const aggroRange = this.config.aggroRange ?? 0;
    if (aggroRange > 0 && this.playerRef && onFloor) {
      const dx = this.playerRef.x - this.x;
      const dist = Math.abs(dx);

      if (dist < aggroRange) {
        // Chase the player
        this.isChasing = true;
        this.direction = dx > 0 ? 1 : -1;
      } else {
        this.isChasing = false;
      }
    }

    // Patrol AI: flip at walls or edges (only when patrolling, not chasing)
    if (onFloor) {
      if (body.blocked.left || body.blocked.right) {
        if (!this.isChasing) {
          this.flip();
        }
      }
      // Edge detection — don't walk off ledges even when chasing
      this.checkEdge();
    }

    // Movement — faster when chasing
    const speedMult = this.isChasing ? (this.config.chaseSpeedMult ?? 1.6) : 1.0;
    const targetVx = this.config.speed * speedMult * this.direction;
    const accel = this.config.acceleration * dt;
    if (Math.abs(body.velocity.x - targetVx) < accel) {
      body.velocity.x = targetVx;
    } else {
      body.velocity.x += (targetVx > body.velocity.x ? accel : -accel);
    }

    // Flip sprite
    this.setFlipX(this.direction < 0);
  }

  private checkEdge(): void {
    // Check if there's ground ahead by looking at the tilemap
    const aheadX = this.x + this.edgeCheckOffset * this.direction;
    const belowY = this.y + 4; // slightly below feet

    const layer = this.scene.children.getByName('groundLayer') as Phaser.Tilemaps.TilemapLayer | null;
    if (!layer) return;

    const tile = layer.getTileAtWorldXY(aheadX, belowY);
    if (!tile) {
      // Stop at edges even when chasing — orcs aren't suicidal
      if (this.isChasing) {
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.velocity.x = 0;
        this.isChasing = false;
      } else {
        this.flip();
      }
    }
  }

  protected flip(): void {
    this.direction *= -1;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.velocity.x = 0;
  }

  takeDamage(damage: number, knockbackDir: Phaser.Math.Vector2): void {
    if (!this.isAlive) return;

    this.currentHealth -= damage;
    this.currentHealth = Math.max(0, this.currentHealth);

    // Knockback
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.velocity.x = knockbackDir.x * 80;
    body.velocity.y = -50;

    // Red flash
    this.flashEffect();

    // Getting hit makes the enemy aggro
    this.isChasing = true;
    if (this.playerRef) {
      this.direction = this.playerRef.x > this.x ? 1 : -1;
    }

    if (this.currentHealth <= 0) {
      this.die();
    }
  }

  private flashEffect(): void {
    this.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.isAlive) {
        this.clearTint();
      }
    });
  }

  protected die(): void {
    if (!this.isAlive) return;

    this.isAlive = false;
    EventBus.emit(Events.ENEMY_KILLED);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.velocity.set(0, 0);
    body.enable = false;

    // Hit-freeze: flash white, pause briefly, then burst into particles
    this.setTint(0xffffff);

    this.scene.time.delayedCall(80, () => {
      // Spawn pixel particle burst at enemy position
      spawnDeathEffect(this.scene, this.x, this.y - this.displayHeight * 0.5, {
        color: this.config.deathColor ?? 0xcc3333,
        count: this.config.deathParticles ?? 12,
        scale: this.scaleX,
      });

      // Shrink + fade the sprite itself
      this.scene.tweens.add({
        targets: this,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: 200,
        ease: 'Back.easeIn',
        onComplete: () => this.destroy(),
      });
    });
  }

  getDamage(): number {
    return this.config.damage;
  }

  getIsAlive(): boolean {
    return this.isAlive;
  }
}
