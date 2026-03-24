export function moveToward(current: number, target: number, delta: number): number {
  if (Math.abs(target - current) <= delta) return target;
  return current + Math.sign(target - current) * delta;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Exponential lerp — smooth asymptotic approach.
 * `smoothing` is how much of the gap to close per second (0–1 range, higher = snappier).
 * dt is in seconds.
 */
export function expLerp(current: number, target: number, smoothing: number, dt: number): number {
  return target + (current - target) * Math.pow(1 - smoothing, dt);
}
