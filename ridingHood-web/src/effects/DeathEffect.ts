import Phaser from 'phaser';

export interface DeathEffectOptions {
  /** Primary particle color */
  color: number;
  /** Number of particles to spawn */
  count: number;
  /** Scale multiplier (matches enemy scale) */
  scale?: number;
  /** Whether this is a boss death (bigger, more dramatic) */
  isBoss?: boolean;
}

/**
 * Spawns a burst of pixel particles at the given position.
 * Each particle is a tiny colored rectangle that flies outward,
 * rotates, slows down, and fades out — giving a satisfying
 * "shatter into pixels" death effect.
 */
export function spawnDeathEffect(
  scene: Phaser.Scene,
  x: number,
  y: number,
  opts: DeathEffectOptions,
): void {
  const {
    color,
    count,
    scale = 1,
    isBoss = false,
  } = opts;

  const baseSize = isBoss ? 3 : 2;
  const spreadSpeed = isBoss ? 120 : 80;
  const lifetime = isBoss ? 600 : 400;
  const gravity = isBoss ? 100 : 160;

  // Generate a palette: main color + lighter + darker variants
  const baseColor = Phaser.Display.Color.IntegerToColor(color);
  const lightColor = baseColor.clone().lighten(40).color;
  const darkColor = baseColor.clone().darken(30).color;
  const palette = [color, color, lightColor, darkColor, 0xffffff];

  for (let i = 0; i < count; i++) {
    const pColor = palette[i % palette.length];
    const size = Phaser.Math.Between(baseSize - 1, baseSize + 1) * scale;

    const particle = scene.add.rectangle(x, y, size, size, pColor);
    particle.setDepth(50);
    particle.setAlpha(1);

    // Random burst direction — biased upward
    const angle = Phaser.Math.FloatBetween(-Math.PI, 0); // upper hemisphere
    // Add some downward particles too for variety
    const finalAngle = Math.random() < 0.3
      ? Phaser.Math.FloatBetween(0, Math.PI * 0.4)
      : angle;

    const speed = Phaser.Math.FloatBetween(spreadSpeed * 0.4, spreadSpeed) * scale;
    const vx = Math.cos(finalAngle) * speed;
    const vy = Math.sin(finalAngle) * speed;

    // Stagger start slightly for a more organic feel
    const delay = Phaser.Math.Between(0, 40);

    scene.time.delayedCall(delay, () => {
      scene.tweens.add({
        targets: particle,
        x: particle.x + vx * (lifetime / 1000),
        y: particle.y + vy * (lifetime / 1000) + gravity * Math.pow(lifetime / 1000, 2) * 0.5,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        angle: Phaser.Math.Between(-180, 180),
        duration: lifetime + Phaser.Math.Between(-50, 80),
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    });
  }

  // Screen flash — brief white rectangle that fades instantly
  if (isBoss) {
    const flash = scene.add.rectangle(x, y, 60, 60, 0xffffff, 0.6);
    flash.setDepth(49);
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 3,
      scaleY: 3,
      duration: 200,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy(),
    });
  } else {
    // Small pop flash for regular enemies
    const flash = scene.add.rectangle(x, y, 12 * scale, 12 * scale, 0xffffff, 0.5);
    flash.setDepth(49);
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 120,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy(),
    });
  }
}
