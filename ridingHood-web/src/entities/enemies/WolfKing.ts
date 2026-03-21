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

const BOSS_CONFIG = {
  HEALTH: 15,
  DAMAGE: 2,
  SPEED: 60,
  ACCELERATION: 400,
  CHASE_RANGE: 200,
  ATTACK_RANGE: 30,
  RETREAT_RANGE: 100,
  ATTACK_COOLDOWN: 2000,
  ENRAGE_SPEED_MULT: 1.5,
  BERSERK_SPEED_MULT: 2.0,
  BODY_W: 18,
  BODY_H: 26,
};

export class WolfKing extends Enemy {
  private bossState: BossState = BossState.IDLE;
  private player: Phaser.Physics.Arcade.Sprite | null = null;
  private attackCooldown: number = 0;
  private baseSpeed: number;
  private isEnraged: boolean = false;
  private isBerserk: boolean = false;
  private maxHealth: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'boss_walk_0', {
      speed: BOSS_CONFIG.SPEED,
      health: BOSS_CONFIG.HEALTH,
      damage: BOSS_CONFIG.DAMAGE,
      acceleration: BOSS_CONFIG.ACCELERATION,
      bodyWidth: BOSS_CONFIG.BODY_W,
      bodyHeight: BOSS_CONFIG.BODY_H,
    });

    this.baseSpeed = BOSS_CONFIG.SPEED;
    this.maxHealth = BOSS_CONFIG.HEALTH;
    this.setScale(1.2);
    this.setDepth(2);

    this.play('boss_walk');
  }

  setPlayerRef(player: Phaser.Physics.Arcade.Sprite): void {
    this.player = player;
  }

  update(_time: number, delta: number): void {
    if (!this.isAlive || !this.player) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const dt = delta / 1000;

    if (this.attackCooldown > 0) this.attackCooldown -= delta;

    const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);
    const dirToPlayer = this.player.x > this.x ? 1 : -1;

    switch (this.bossState) {
      case BossState.IDLE:
        body.velocity.x = this.config.speed * this.direction * 0.5;
        this.setFlipX(this.direction < 0);
        if (this.anims.currentAnim?.key !== 'boss_walk') {
          this.play('boss_walk');
        }
        if (distToPlayer < BOSS_CONFIG.CHASE_RANGE) {
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

        if (distToPlayer < BOSS_CONFIG.ATTACK_RANGE && this.attackCooldown <= 0) {
          this.bossState = BossState.ATTACK;
          this.attackCooldown = BOSS_CONFIG.ATTACK_COOLDOWN;
          // Lunge
          body.velocity.x = dirToPlayer * this.config.speed * 3;
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
        } else if (distToPlayer > BOSS_CONFIG.CHASE_RANGE * 1.5) {
          this.bossState = BossState.IDLE;
        }
        break;

      case BossState.ATTACK:
        break;

      case BossState.RETREAT:
        body.velocity.x = Phaser.Math.Linear(
          body.velocity.x,
          -dirToPlayer * this.config.speed * 0.8,
          dt * 4,
        );
        this.setFlipX(-dirToPlayer < 0);
        if (this.anims.currentAnim?.key !== 'boss_walk') {
          this.play('boss_walk');
        }

        if (distToPlayer > BOSS_CONFIG.RETREAT_RANGE || this.attackCooldown <= BOSS_CONFIG.ATTACK_COOLDOWN * 0.5) {
          this.bossState = BossState.CHASE;
        }
        break;
    }

    // Keep body offset correct
    const fw = this.frame.width;
    const fh = this.frame.height;
    body.setOffset(
      Math.floor((fw - BOSS_CONFIG.BODY_W) / 2),
      fh - BOSS_CONFIG.BODY_H,
    );
  }

  takeDamage(damage: number, knockbackDir: Phaser.Math.Vector2): void {
    super.takeDamage(damage, knockbackDir);

    if (!this.isEnraged && this.currentHealth <= this.maxHealth / 2 && this.currentHealth > 0) {
      this.isEnraged = true;
      this.config.speed = this.baseSpeed * BOSS_CONFIG.ENRAGE_SPEED_MULT;
      this.setTint(0xff8800);
      this.scene.time.delayedCall(300, () => {
        if (this.isAlive) this.clearTint();
      });
    }

    if (!this.isBerserk && this.currentHealth <= this.maxHealth / 4 && this.currentHealth > 0) {
      this.isBerserk = true;
      this.config.speed = this.baseSpeed * BOSS_CONFIG.BERSERK_SPEED_MULT;
      this.config.damage = BOSS_CONFIG.DAMAGE * 2;
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
