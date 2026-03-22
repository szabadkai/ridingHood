import Phaser from 'phaser';
import { Enemy } from './Enemy';
import { EventBus, Events } from '../../utils/EventBus';
import { getSoundManager } from '../../systems/SoundManager';

enum BossState {
  IDLE,
  CHASE,
  ATTACK,
  RETREAT,
}

/** Per-level boss configuration */
export interface BossConfig {
  name: string;
  health: number;
  damage: number;
  speed: number;
  acceleration: number;
  chaseRange: number;
  attackRange: number;
  retreatRange: number;
  attackCooldown: number;   // ms between attacks
  enrageSpeedMult: number;  // speed multiplier at 50% hp
  berserkSpeedMult: number; // speed multiplier at 25% hp
  lungeForce: number;       // horizontal lunge impulse multiplier
  scale: number;
}

/** Preset boss configs per level (index 0 = level 1) */
const BOSS_PRESETS: BossConfig[] = [
  // Level 1: Forest Guardian — slow, telegraphed, teaches the fight
  {
    name: 'Forest Guardian',
    health: 10,
    damage: 1,
    speed: 30,
    acceleration: 200,
    chaseRange: 130,
    attackRange: 25,
    retreatRange: 70,
    attackCooldown: 3000,
    enrageSpeedMult: 1.2,
    berserkSpeedMult: 1.4,
    lungeForce: 2.0,
    scale: 1.1,
  },
  // Level 2: Village Brute — tougher, wider chase, still slow
  {
    name: 'Village Brute',
    health: 14,
    damage: 1,
    speed: 35,
    acceleration: 250,
    chaseRange: 150,
    attackRange: 28,
    retreatRange: 80,
    attackCooldown: 2500,
    enrageSpeedMult: 1.3,
    berserkSpeedMult: 1.5,
    lungeForce: 2.5,
    scale: 1.15,
  },
  // Level 3: Castle Knight — moderate speed, faster attacks
  {
    name: 'Castle Knight',
    health: 16,
    damage: 2,
    speed: 40,
    acceleration: 300,
    chaseRange: 160,
    attackRange: 30,
    retreatRange: 90,
    attackCooldown: 2200,
    enrageSpeedMult: 1.4,
    berserkSpeedMult: 1.6,
    lungeForce: 2.5,
    scale: 1.2,
  },
  // Level 4: Tower Warden — mid speed, aggressive, short cooldowns
  {
    name: 'Tower Warden',
    health: 18,
    damage: 2,
    speed: 45,
    acceleration: 350,
    chaseRange: 180,
    attackRange: 30,
    retreatRange: 60,
    attackCooldown: 1800,
    enrageSpeedMult: 1.4,
    berserkSpeedMult: 1.8,
    lungeForce: 3.0,
    scale: 1.2,
  },
  // Level 5: Wolf King — fast, relentless, the real deal
  {
    name: 'Wolf King',
    health: 22,
    damage: 2,
    speed: 60,
    acceleration: 450,
    chaseRange: 220,
    attackRange: 32,
    retreatRange: 50,
    attackCooldown: 1500,
    enrageSpeedMult: 1.5,
    berserkSpeedMult: 2.0,
    lungeForce: 3.5,
    scale: 1.3,
  },
];

export function getBossConfig(level: number): BossConfig {
  const idx = Math.max(0, Math.min(level - 1, BOSS_PRESETS.length - 1));
  return BOSS_PRESETS[idx];
}

export class WolfKing extends Enemy {
  private bossState: BossState = BossState.IDLE;
  private bossPlayer: Phaser.Physics.Arcade.Sprite | null = null;
  private attackCooldown: number = 0;
  private baseSpeed: number;
  private isEnraged: boolean = false;
  private isBerserk: boolean = false;
  private maxHealth: number;
  private bossConfig: BossConfig;

  constructor(scene: Phaser.Scene, x: number, y: number, level: number = 5) {
    const cfg = getBossConfig(level);

    super(scene, x, y, 'boss_walk_0', {
      speed: cfg.speed,
      health: cfg.health,
      damage: cfg.damage,
      acceleration: cfg.acceleration,
      bodyWidth: 18,
      bodyHeight: 26,
    });

    this.bossConfig = cfg;
    this.baseSpeed = cfg.speed;
    this.maxHealth = cfg.health;
    this.setScale(cfg.scale);
    this.setDepth(2);

    this.play('boss_walk');
  }

  setPlayerRef(player: Phaser.Physics.Arcade.Sprite): void {
    this.bossPlayer = player;
    // Also set on parent for potential use
    super.setPlayerRef(player);
  }

  update(_time: number, delta: number): void {
    if (!this.isAlive || !this.bossPlayer) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const dt = delta / 1000;

    if (this.attackCooldown > 0) this.attackCooldown -= delta;

    const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, this.bossPlayer.x, this.bossPlayer.y);
    const dirToPlayer = this.bossPlayer.x > this.x ? 1 : -1;

    switch (this.bossState) {
      case BossState.IDLE:
        body.velocity.x = this.config.speed * this.direction * 0.4;
        this.setFlipX(this.direction < 0);
        if (this.anims.currentAnim?.key !== 'boss_walk') {
          this.play('boss_walk');
        }
        if (distToPlayer < this.bossConfig.chaseRange) {
          this.bossState = BossState.CHASE;
        }
        break;

      case BossState.CHASE:
        this.direction = dirToPlayer;
        body.velocity.x = Phaser.Math.Linear(
          body.velocity.x,
          this.config.speed * dirToPlayer,
          dt * 5,
        );
        this.setFlipX(dirToPlayer < 0);
        if (this.anims.currentAnim?.key !== 'boss_walk') {
          this.play('boss_walk');
        }

        if (distToPlayer < this.bossConfig.attackRange && this.attackCooldown <= 0) {
          this.bossState = BossState.ATTACK;
          this.attackCooldown = this.bossConfig.attackCooldown;
          // Lunge
          body.velocity.x = dirToPlayer * this.config.speed * this.bossConfig.lungeForce;
          body.velocity.y = -80;

          this.play('boss_attack');
          this.setTint(0xff6600);
          getSoundManager().playBossAttack();
          this.scene.time.delayedCall(400, () => {
            if (this.isAlive) {
              this.clearTint();
              this.bossState = BossState.RETREAT;
            }
          });
        } else if (distToPlayer > this.bossConfig.chaseRange * 1.5) {
          this.bossState = BossState.IDLE;
        }
        break;

      case BossState.ATTACK:
        break;

      case BossState.RETREAT:
        body.velocity.x = Phaser.Math.Linear(
          body.velocity.x,
          -dirToPlayer * this.config.speed * 0.6,
          dt * 4,
        );
        this.setFlipX(-dirToPlayer < 0);
        if (this.anims.currentAnim?.key !== 'boss_walk') {
          this.play('boss_walk');
        }

        if (distToPlayer > this.bossConfig.retreatRange || this.attackCooldown <= this.bossConfig.attackCooldown * 0.5) {
          this.bossState = BossState.CHASE;
        }
        break;
    }

    // Keep body offset correct
    const fw = this.frame.width;
    const fh = this.frame.height;
    body.setOffset(
      Math.floor((fw - 18) / 2),
      fh - 26,
    );
  }

  takeDamage(damage: number, knockbackDir: Phaser.Math.Vector2): void {
    super.takeDamage(damage, knockbackDir);

    if (!this.isEnraged && this.currentHealth <= this.maxHealth / 2 && this.currentHealth > 0) {
      this.isEnraged = true;
      this.config.speed = this.baseSpeed * this.bossConfig.enrageSpeedMult;
      this.setTint(0xff8800);
      this.scene.time.delayedCall(300, () => {
        if (this.isAlive) this.clearTint();
      });
    }

    if (!this.isBerserk && this.currentHealth <= this.maxHealth / 4 && this.currentHealth > 0) {
      this.isBerserk = true;
      this.config.speed = this.baseSpeed * this.bossConfig.berserkSpeedMult;
      this.config.damage = this.bossConfig.damage * 2;
    }

    if (this.isAlive) {
      this.bossState = BossState.CHASE;
    }
  }

  protected die(): void {
    if (!this.isAlive) return;

    this.isAlive = false;
    EventBus.emit(Events.ENEMY_KILLED);
    EventBus.emit(Events.BOSS_KILLED);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.velocity.set(0, 0);
    body.enable = false;

    this.clearTint();
    if (this.scene.anims.exists('boss_death')) {
      this.play('boss_death');
      this.once('animationcomplete', () => {
        this.scene.tweens.add({
          targets: this,
          alpha: 0,
          duration: 500,
          onComplete: () => this.destroy(),
        });
      });
    } else {
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 400,
        onComplete: () => this.destroy(),
      });
    }
  }
}
