import Phaser from 'phaser';
import { EventBus, Events } from '../../utils/EventBus';

export interface EnemyConfig {
  speed: number;
  health: number;
  damage: number;
  acceleration: number;
  bodyWidth: number;
  bodyHeight: number;
}

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  protected config: EnemyConfig;
  protected currentHealth: number;
  protected direction: number = 1;
  protected isAlive: boolean = true;

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

  update(_time: number, delta: number): void {
    if (!this.isAlive) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const dt = delta / 1000;
    const onFloor = body.blocked.down;

    // Patrol AI: flip at walls or edges
    if (onFloor) {
      if (body.blocked.left || body.blocked.right) {
        this.flip();
      }
      // Edge detection — check if ground ahead exists
      this.checkEdge();
    }

    // Movement
    const targetVx = this.config.speed * this.direction;
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
    const body = this.body as Phaser.Physics.Arcade.Body;
    // Check if there's ground ahead by looking at the tilemap
    const aheadX = this.x + this.edgeCheckOffset * this.direction;
    const belowY = this.y + 4; // slightly below feet

    const layer = this.scene.children.getByName('groundLayer') as Phaser.Tilemaps.TilemapLayer | null;
    if (!layer) return;

    const tile = layer.getTileAtWorldXY(aheadX, belowY);
    if (!tile) {
      this.flip();
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

    // Play death animation if available, then destroy
    if (this.scene.anims.exists('orc_death')) {
      this.clearTint();
      this.play('orc_death');
      this.once('animationcomplete', () => {
        this.destroy();
      });
    } else {
      // Fallback: fade out
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 400,
        onComplete: () => {
          this.destroy();
        },
      });
    }
  }

  getDamage(): number {
    return this.config.damage;
  }

  getIsAlive(): boolean {
    return this.isAlive;
  }
}
