import Phaser from 'phaser';
import { LIGHT_FORM, DARK_FORM, PLAYER, PHYSICS, DARKNESS_METER } from '../config/GameConfig';
import { EventBus, Events } from '../utils/EventBus';
import { moveToward } from '../utils/MathUtils';
import { getSoundManager } from '../systems/SoundManager';

export enum PlayerState {
  IDLE,
  RUN,
  JUMP,
  FALL,
  ATTACK,
  HURT,
  TRANSFORM,
  DASH,
  ROLL,
  WALL_SLIDE,
  DEAD,
}

export type PlayerForm = 'light' | 'dark';

// How many ms into an attack before it can be cancelled by movement/jump
const ATTACK_COMMIT_MS = 150;
// Max time an attack can last before forced exit (failsafe)
const ATTACK_MAX_MS = 600;
const ROLL_SPEED = 180;
const ROLL_DURATION_MS = 300;

export class Player extends Phaser.Physics.Arcade.Sprite {
  // State
  private currentState: PlayerState = PlayerState.IDLE;
  private form: PlayerForm = 'light';
  private facingRight: boolean = true;

  // Health
  private currentHealth: number = PLAYER.MAX_HEALTH;

  // Darkness meter
  private darknessMeter: number = 0;

  // Invincibility
  private isInvincible: boolean = false;
  private invincibilityTimer?: Phaser.Time.TimerEvent;

  // Coyote time & jump buffer
  private coyoteTimer: number = 0;
  private jumpBufferTimer: number = 0;
  private wasOnFloor: boolean = false;

  // Attack
  private attackHitbox!: Phaser.GameObjects.Rectangle;
  private attackCombo: number = 0;
  private attackTimer: number = 0;
  private hitEnemies: Set<Phaser.GameObjects.GameObject> = new Set();

  // Dash (dark form)
  private dashTimer: number = 0;
  private dashCooldown: number = 0;
  private dashDirection: number = 0;

  // Roll (light form)
  private rollTimer: number = 0;
  private rollDirection: number = 0;
  private rollCooldown: number = 0;

  // Checkpoint
  private checkpointPosition: Phaser.Math.Vector2 | null = null;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyX!: Phaser.Input.Keyboard.Key;
  private keyC!: Phaser.Input.Keyboard.Key;
  private keyZ!: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Start with first idle frame
    super(scene, x, y, 'light_idle_blink_0');
    scene.add.existing(this as Phaser.GameObjects.GameObject);
    scene.physics.add.existing(this as unknown as Phaser.GameObjects.GameObject);

    // Anchor at bottom-center so feet stay planted regardless of frame size
    this.setOrigin(0.5, 1.0);

    // Physics body setup
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(10, 16);
    // Initial offset for idle frame (15x18)
    body.setOffset(Math.floor((15 - 10) / 2), 18 - 16);
    body.setCollideWorldBounds(false);
    body.setMaxVelocityY(400);

    // Input
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.keyW = scene.input.keyboard!.addKey('W');
    this.keyA = scene.input.keyboard!.addKey('A');
    this.keyD = scene.input.keyboard!.addKey('D');
    this.keyX = scene.input.keyboard!.addKey('X');
    this.keyC = scene.input.keyboard!.addKey('C');
    this.keyZ = scene.input.keyboard!.addKey('Z');

    // Attack hitbox (invisible, toggled on during attacks)
    this.attackHitbox = scene.add.rectangle(x + 12, y, 16, 16);
    scene.physics.add.existing(this.attackHitbox, false);
    (this.attackHitbox.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    (this.attackHitbox.body as Phaser.Physics.Arcade.Body).enable = false;
    this.attackHitbox.setVisible(false);

    // Initial state
    this.play('light_idle');
    EventBus.emit(Events.HEALTH_CHANGED, this.currentHealth, PLAYER.MAX_HEALTH);
    EventBus.emit(Events.METER_CHANGED, this.darknessMeter);
    EventBus.emit(Events.FORM_CHANGED, this.form);
  }

  getAttackHitbox(): Phaser.GameObjects.Rectangle {
    return this.attackHitbox;
  }

  getAttackDamage(): number {
    return this.form === 'light' ? LIGHT_FORM.ATTACK_DAMAGE : DARK_FORM.ATTACK_DAMAGE;
  }

  getAttackKnockback(): number {
    return this.form === 'light' ? LIGHT_FORM.ATTACK_KNOCKBACK : DARK_FORM.ATTACK_KNOCKBACK;
  }

  isAttacking(): boolean {
    return this.currentState === PlayerState.ATTACK;
  }

  hasHitEnemy(enemy: Phaser.GameObjects.GameObject): boolean {
    return this.hitEnemies.has(enemy);
  }

  markEnemyHit(enemy: Phaser.GameObjects.GameObject): void {
    this.hitEnemies.add(enemy);
  }

  getForm(): PlayerForm {
    return this.form;
  }

  private get stats() {
    return this.form === 'light' ? LIGHT_FORM : DARK_FORM;
  }

  update(_time: number, delta: number): void {
    if (this.currentState === PlayerState.DEAD) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const onFloor = body.blocked.down;
    const dt = delta / 1000;

    // Coyote time
    if (this.wasOnFloor && !onFloor && body.velocity.y >= 0 && this.currentState !== PlayerState.JUMP) {
      this.coyoteTimer = PHYSICS.COYOTE_TIME_MS;
    }
    if (this.coyoteTimer > 0) this.coyoteTimer -= delta;
    this.wasOnFloor = onFloor;

    // Jump buffer
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= delta;

    // Darkness meter drain in dark form
    if (this.form === 'dark') {
      this.darknessMeter -= DARKNESS_METER.DRAIN_PER_SECOND * dt;
      if (this.darknessMeter <= 0) {
        this.darknessMeter = 0;
        this.forceRevertToLight();
      }
      EventBus.emit(Events.METER_CHANGED, this.darknessMeter);
    }

    // Cooldowns
    if (this.dashCooldown > 0) this.dashCooldown -= delta;
    if (this.rollCooldown > 0) this.rollCooldown -= delta;

    // State machine
    switch (this.currentState) {
      case PlayerState.IDLE:
      case PlayerState.RUN:
        this.handleMovement(dt, onFloor);
        this.handleJumpInput(onFloor);
        this.handleAttackInput();
        this.handleTransformInput();
        this.handleEvasionInput();
        break;

      case PlayerState.JUMP:
      case PlayerState.FALL:
        this.handleAirMovement(dt);
        this.handleJumpRelease();
        this.handleAttackInput();
        this.handleTransformInput();
        this.handleEvasionInput();
        if (onFloor) {
          this.changeState(body.velocity.x !== 0 ? PlayerState.RUN : PlayerState.IDLE);
        } else if (body.velocity.y > 0 && this.currentState === PlayerState.JUMP) {
          this.changeState(PlayerState.FALL);
        }
        break;

      case PlayerState.ATTACK:
        this.attackTimer += delta;
        this.handleAttackMovement(dt, onFloor);
        // Failsafe: force exit attack if animation didn't complete
        if (this.attackTimer > ATTACK_MAX_MS) {
          this.cancelAttack();
          this.changeState(onFloor ? PlayerState.IDLE : PlayerState.FALL);
          break;
        }
        // Allow cancelling attack after commit window
        if (this.attackTimer > ATTACK_COMMIT_MS) {
          // Cancel into jump
          if (this.isJumpPressed() && onFloor) {
            this.cancelAttack();
            this.performJump();
            break;
          }
          // Cancel into movement
          if (this.getInputX() !== 0) {
            this.cancelAttack();
            this.changeState(PlayerState.RUN);
            break;
          }
          // Cancel into next attack (combo)
          if (Phaser.Input.Keyboard.JustDown(this.keyX)) {
            this.cancelAttack();
            this.handleAttackInput();
            break;
          }
        }
        break;

      case PlayerState.HURT:
        // Brief knockback state — transitions handled by timer
        break;

      case PlayerState.TRANSFORM:
        // Animation plays out
        break;

      case PlayerState.DASH:
        this.handleDash(delta);
        break;

      case PlayerState.ROLL:
        this.handleRoll(delta);
        break;
    }

    // Update attack hitbox position
    this.updateAttackHitbox();

    // Update animations
    this.updateAnimations(onFloor);

    // Keep body offset correct for current frame size
    this.updateBodyOffset();
  }

  private handleMovement(dt: number, onFloor: boolean): void {
    const inputX = this.getInputX();
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (inputX !== 0) {
      // Snap to full speed quickly for responsive feel
      const targetSpeed = this.stats.SPEED * inputX;
      body.velocity.x = moveToward(body.velocity.x, targetSpeed, this.stats.ACCELERATION * dt);
      this.facingRight = inputX > 0;
      if (onFloor) this.changeState(PlayerState.RUN);
    } else {
      body.velocity.x = moveToward(body.velocity.x, 0, this.stats.FRICTION * dt);
      if (onFloor && Math.abs(body.velocity.x) < 10) {
        body.velocity.x = 0;
        this.changeState(PlayerState.IDLE);
      }
    }
  }

  private handleAirMovement(dt: number): void {
    const inputX = this.getInputX();
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (inputX !== 0) {
      body.velocity.x = moveToward(body.velocity.x, this.stats.SPEED * inputX, this.stats.AIR_ACCELERATION * dt);
      this.facingRight = inputX > 0;
    } else {
      body.velocity.x = moveToward(body.velocity.x, 0, this.stats.AIR_RESISTANCE * dt);
    }
  }

  private handleAttackMovement(dt: number, onFloor: boolean): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (onFloor) {
      body.velocity.x = moveToward(body.velocity.x, 0, this.stats.FRICTION * 0.5 * dt);
    }
  }

  private isJumpPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.cursors.up!) ||
           Phaser.Input.Keyboard.JustDown(this.keyW) ||
           Phaser.Input.Keyboard.JustDown(this.cursors.space!);
  }

  private handleJumpInput(onFloor: boolean): void {
    if (this.isJumpPressed()) {
      this.jumpBufferTimer = PHYSICS.JUMP_BUFFER_MS;
    }

    if (this.jumpBufferTimer > 0 && (onFloor || this.coyoteTimer > 0)) {
      this.performJump();
    }
  }

  private handleJumpRelease(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const jumpReleased = Phaser.Input.Keyboard.JustUp(this.cursors.up!) ||
                         Phaser.Input.Keyboard.JustUp(this.keyW) ||
                         Phaser.Input.Keyboard.JustUp(this.cursors.space!);

    // Variable jump height — cut velocity on release
    if (jumpReleased && body.velocity.y < this.stats.JUMP_VELOCITY / 2) {
      body.velocity.y = this.stats.JUMP_VELOCITY / 2;
    }
  }

  private performJump(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.velocity.y = this.stats.JUMP_VELOCITY;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.changeState(PlayerState.JUMP);
    getSoundManager().playJump();
  }

  private cancelAttack(): void {
    (this.attackHitbox.body as Phaser.Physics.Arcade.Body).enable = false;
    this.off('animationcomplete');
  }

  private handleAttackInput(): void {
    const attackPressed = Phaser.Input.Keyboard.JustDown(this.keyX);

    if (attackPressed && this.currentState !== PlayerState.ATTACK) {
      this.attackCombo = (this.attackCombo % 3) + 1;
      this.hitEnemies.clear();
      this.attackTimer = 0;
      this.changeState(PlayerState.ATTACK);
      getSoundManager().playAttack();

      const animKey = `${this.form}_attack${this.attackCombo}`;
      this.play(animKey);

      // Enable attack hitbox
      (this.attackHitbox.body as Phaser.Physics.Arcade.Body).enable = true;

      // Listen for animation complete to exit attack
      this.once('animationcomplete', () => {
        (this.attackHitbox.body as Phaser.Physics.Arcade.Body).enable = false;
        const body = this.body as Phaser.Physics.Arcade.Body;
        if (body.blocked.down) {
          this.changeState(Math.abs(body.velocity.x) > 5 ? PlayerState.RUN : PlayerState.IDLE);
        } else {
          this.changeState(body.velocity.y < 0 ? PlayerState.JUMP : PlayerState.FALL);
        }
      });
    }
  }

  private handleTransformInput(): void {
    if (!Phaser.Input.Keyboard.JustDown(this.keyC)) return;

    if (this.form === 'light') {
      if (this.darknessMeter >= DARKNESS_METER.TRANSFORM_THRESHOLD) {
        this.transform('dark');
      }
    } else {
      this.transform('light');
    }
  }

  private handleEvasionInput(): void {
    if (!Phaser.Input.Keyboard.JustDown(this.keyZ)) return;

    if (this.form === 'dark') {
      // Dark form: dash with i-frames
      if (this.dashCooldown > 0) return;
      this.dashDirection = this.facingRight ? 1 : -1;
      this.dashTimer = DARK_FORM.DASH_DURATION_MS;
      this.dashCooldown = DARK_FORM.DASH_COOLDOWN_MS;
      this.isInvincible = true;
      this.changeState(PlayerState.DASH);
      this.play(`${this.form}_dash`);
      getSoundManager().playDash();
    } else {
      // Light form: roll (no i-frames, but moves fast)
      if (this.rollCooldown > 0) return;
      this.rollDirection = this.facingRight ? 1 : -1;
      this.rollTimer = ROLL_DURATION_MS;
      this.rollCooldown = 500;
      this.changeState(PlayerState.ROLL);
      this.play(`${this.form}_roll`);
      getSoundManager().playRoll();
    }
  }

  private handleDash(delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.velocity.x = DARK_FORM.DASH_SPEED * this.dashDirection;
    body.velocity.y = 0;
    body.setAllowGravity(false);

    this.dashTimer -= delta;
    if (this.dashTimer <= 0) {
      body.setAllowGravity(true);
      // Brief invincibility after dash ends so you don't get hit while still overlapping
      this.startInvincibility();
      const onFloor = body.blocked.down;
      this.changeState(onFloor ? (Math.abs(body.velocity.x) > 5 ? PlayerState.RUN : PlayerState.IDLE) : PlayerState.FALL);
    }
  }

  private handleRoll(delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.velocity.x = ROLL_SPEED * this.rollDirection;

    this.rollTimer -= delta;
    if (this.rollTimer <= 0) {
      const onFloor = body.blocked.down;
      this.changeState(onFloor ? (Math.abs(body.velocity.x) > 5 ? PlayerState.RUN : PlayerState.IDLE) : PlayerState.FALL);
    }
  }

  private transform(targetForm: PlayerForm): void {
    this.changeState(PlayerState.TRANSFORM);
    this.isInvincible = true;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.velocity.x = 0;

    this.play(`${this.form}_transform`);

    if (targetForm === 'dark') {
      getSoundManager().playTransformToDark();
    } else {
      getSoundManager().playTransformToLight();
    }

    this.once('animationcomplete', () => {
      this.form = targetForm;
      this.isInvincible = false;
      this.changeState(PlayerState.IDLE);
      EventBus.emit(Events.FORM_CHANGED, this.form);
    });
  }

  private forceRevertToLight(): void {
    if (this.form !== 'dark') return;
    this.form = 'light';
    this.changeState(PlayerState.HURT);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.velocity.x = 0;
    this.setTint(0xffffff);

    this.scene.time.delayedCall(400, () => {
      if (this.currentState === PlayerState.HURT) {
        this.changeState(PlayerState.IDLE);
      }
    });

    EventBus.emit(Events.FORM_CHANGED, this.form);
  }

  takeDamage(amount: number, knockbackDir: Phaser.Math.Vector2): void {
    if (this.isInvincible || this.currentState === PlayerState.DEAD) return;

    // Cancel attack if we get hit
    if (this.currentState === PlayerState.ATTACK) {
      this.cancelAttack();
    }

    const actualDamage = Math.ceil(amount * this.stats.DAMAGE_TAKEN_MULT);
    this.currentHealth = Math.max(0, this.currentHealth - actualDamage);

    // Knockback
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.velocity.x = knockbackDir.x * PLAYER.KNOCKBACK_FORCE;
    body.velocity.y = knockbackDir.y * PLAYER.KNOCKBACK_FORCE * 0.5;

    // Gain darkness meter from taking damage
    this.addDarknessMeter(DARKNESS_METER.GAIN_ON_TAKE_DAMAGE);

    this.startInvincibility();
    this.flashEffect();

    EventBus.emit(Events.HEALTH_CHANGED, this.currentHealth, PLAYER.MAX_HEALTH);
    EventBus.emit(Events.PLAYER_DAMAGED, actualDamage);
    getSoundManager().playPlayerHurt();

    if (this.currentHealth <= 0) {
      this.die();
    } else {
      this.changeState(PlayerState.HURT);
      this.scene.time.delayedCall(300, () => {
        if (this.currentState === PlayerState.HURT) {
          this.changeState(PlayerState.IDLE);
        }
      });
    }
  }

  addDarknessMeter(amount: number): void {
    const wasBelowThreshold = this.darknessMeter < DARKNESS_METER.TRANSFORM_THRESHOLD;
    this.darknessMeter = Math.min(DARKNESS_METER.MAX, this.darknessMeter + amount);
    EventBus.emit(Events.METER_CHANGED, this.darknessMeter);

    if (wasBelowThreshold && this.darknessMeter >= DARKNESS_METER.TRANSFORM_THRESHOLD) {
      getSoundManager().playMeterFull();
      EventBus.emit(Events.METER_REACHED_THRESHOLD);
    }
  }

  restoreHealth(amount: number): void {
    if (this.currentHealth >= PLAYER.MAX_HEALTH) return;
    this.currentHealth = Math.min(this.currentHealth + amount, PLAYER.MAX_HEALTH);
    EventBus.emit(Events.HEALTH_CHANGED, this.currentHealth, PLAYER.MAX_HEALTH);

    this.setTint(0x00cc00);
    this.scene.time.delayedCall(100, () => this.clearTint());
  }

  setCheckpoint(pos: Phaser.Math.Vector2): void {
    this.checkpointPosition = pos.clone();
  }

  private die(): void {
    this.changeState(PlayerState.DEAD);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.velocity.set(0, 0);
    body.setAllowGravity(false);
    this.setAlpha(0.5);

    getSoundManager().playDeath();
    EventBus.emit(Events.PLAYER_DIED);

    if (this.checkpointPosition) {
      this.scene.time.delayedCall(1000, () => this.respawn());
    } else {
      this.scene.time.delayedCall(1000, () => {
        this.scene.scene.stop('UIScene');
        this.scene.scene.start('DeathScene');
      });
    }
  }

  private respawn(): void {
    if (!this.checkpointPosition) return;
    this.setPosition(this.checkpointPosition.x, this.checkpointPosition.y);
    this.currentHealth = PLAYER.MAX_HEALTH;
    this.isInvincible = false;
    this.setAlpha(1);
    this.clearTint();
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.velocity.set(0, 0);
    body.setAllowGravity(true);
    this.form = 'light';
    this.changeState(PlayerState.IDLE);

    EventBus.emit(Events.HEALTH_CHANGED, this.currentHealth, PLAYER.MAX_HEALTH);
    EventBus.emit(Events.FORM_CHANGED, this.form);
    EventBus.emit(Events.PLAYER_RESPAWNED);
    this.startInvincibility();
  }

  private startInvincibility(): void {
    this.isInvincible = true;
    if (this.invincibilityTimer) this.invincibilityTimer.destroy();
    this.invincibilityTimer = this.scene.time.delayedCall(PLAYER.INVINCIBILITY_MS, () => {
      this.isInvincible = false;
      this.clearTint();
      this.setAlpha(1);
    });
  }

  private flashEffect(): void {
    let flashes = 0;
    const flashInterval = this.scene.time.addEvent({
      delay: 80,
      callback: () => {
        if (!this.isInvincible || flashes > 6) {
          flashInterval.destroy();
          this.clearTint();
          this.setAlpha(1);
          return;
        }
        if (flashes % 2 === 0) {
          this.setTint(0xff0000);
          this.setAlpha(0.6);
        } else {
          this.clearTint();
          this.setAlpha(1);
        }
        flashes++;
      },
      repeat: 6,
    });
  }

  private changeState(newState: PlayerState): void {
    this.currentState = newState;
  }

  private getInputX(): number {
    let x = 0;
    if (this.cursors.left?.isDown || this.keyA.isDown) x -= 1;
    if (this.cursors.right?.isDown || this.keyD.isDown) x += 1;
    return x;
  }

  private updateBodyOffset(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const fw = this.frame.width;
    const fh = this.frame.height;
    // Keep body centered horizontally in frame, aligned to bottom
    body.setOffset(Math.floor((fw - 10) / 2), fh - 16);
  }

  private updateAttackHitbox(): void {
    const offsetX = this.facingRight ? 12 : -12;
    this.attackHitbox.setPosition(this.x + offsetX, this.y - 8);
  }

  private updateAnimations(onFloor: boolean): void {
    // Don't override attack/transform/dash/roll animations
    if (this.currentState === PlayerState.ATTACK ||
        this.currentState === PlayerState.TRANSFORM ||
        this.currentState === PlayerState.DASH ||
        this.currentState === PlayerState.ROLL) {
      this.setFlipX(!this.facingRight);
      return;
    }

    const prefix = this.form;
    let animKey = `${prefix}_idle`;

    switch (this.currentState) {
      case PlayerState.IDLE:
        animKey = `${prefix}_idle`;
        break;
      case PlayerState.RUN:
        animKey = `${prefix}_run`;
        break;
      case PlayerState.JUMP:
        animKey = `${prefix}_jump`;
        break;
      case PlayerState.FALL:
        animKey = `${prefix}_fall`;
        break;
      case PlayerState.HURT:
        animKey = `${prefix}_idle`;
        break;
    }

    if (this.anims.currentAnim?.key !== animKey) {
      this.play(animKey, true);
    }
    this.setFlipX(!this.facingRight);
  }
}
