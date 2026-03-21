// Animation definitions - frame counts for each animation per form
// File naming: {folder}/{prefix}{index}.png
// e.g. idle_blink/idle_blink0.png, attack1/attack1_0.png, attack3/attack3_00.png

export interface AnimDef {
  key: string;
  prefix: string;   // filename prefix before the frame number
  folder: string;    // subfolder name
  frames: number;
  frameRate: number;
  repeat: number;    // -1 = loop
  zeroPad: number;   // 0 = no padding, 2 = zero-pad to 2 digits
}

function anim(
  key: string,
  folder: string,
  prefix: string,
  frames: number,
  frameRate: number = 10,
  repeat: number = -1,
  zeroPad: number = 0,
): AnimDef {
  return { key, prefix, folder, frames, frameRate, repeat, zeroPad };
}

export const LIGHT_ANIMS: AnimDef[] = [
  anim('light_idle', 'idle_blink', 'idle_blink', 3, 6),
  anim('light_run', 'run', 'run', 10, 12),
  anim('light_jump', 'jump', 'jump', 4, 10, 0),
  anim('light_fall', 'fall', 'fall', 4, 10),
  anim('light_attack1', 'attack1', 'attack1_', 10, 24, 0),
  anim('light_attack2', 'attack2', 'attack2_', 10, 24, 0),
  anim('light_attack3', 'attack3', 'attack3_', 11, 24, 0, 2),
  anim('light_dash', 'dash', 'dash', 4, 12, 0),
  anim('light_roll', 'roll', 'roll', 20, 20, 0),
  anim('light_wall_grab', 'wall_grab', 'wall_grab', 13, 10),
  anim('light_wall_slide', 'wall_slide', 'wall_slide', 4, 8),
  anim('light_transform', 'transform', 'transform', 38, 30, 0),
  anim('light_turn', 'turn', 'turn', 20, 15, 0),
];

export const DARK_ANIMS: AnimDef[] = [
  anim('dark_idle', 'idle_blink', 'idle_blink', 3, 6),
  anim('dark_run', 'run', 'run', 10, 12),
  anim('dark_jump', 'jump', 'jump', 4, 10, 0),
  anim('dark_fall', 'fall', 'fall', 4, 10),
  anim('dark_attack1', 'attack1', 'attack1_', 10, 24, 0),
  anim('dark_attack2', 'attack2', 'attack2_', 10, 24, 0),
  anim('dark_attack3', 'attack3', 'attack3_', 11, 24, 0),
  anim('dark_dash', 'dash', 'dash', 4, 12, 0),
  anim('dark_roll', 'roll', 'roll', 20, 20, 0),
  anim('dark_wall_grab', 'wall_grab', 'wall_grab', 13, 10),
  anim('dark_wall_slide', 'wall_slide', 'wall_slide', 4, 8),
  anim('dark_transform', 'transform', 'transform', 38, 30, 0),
  anim('dark_turn', 'turn', 'turn', 20, 15, 0),
];

export const FX_ANIMS: AnimDef[] = [
  anim('fx_light', 'FX_light', 'FX_light', 36, 24, 0),
  anim('fx_lighttodark', 'FX_lighttodark', 'FX_lighttodark', 36, 30, 0),
  anim('fx_dark', 'FX_dark', 'FX_dark', 36, 24, 0),
  anim('fx_darktolight', 'FX_darktolight', 'FX_darktolight', 36, 30, 0),
];
