export function moveToward(current: number, target: number, delta: number): number {
  if (Math.abs(target - current) <= delta) return target;
  return current + Math.sign(target - current) * delta;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
