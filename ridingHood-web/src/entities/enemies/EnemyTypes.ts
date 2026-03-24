import Phaser from 'phaser';
import { Enemy, type EnemyConfig } from './Enemy';

export type EnemyTypeKey =
  | 'orc'
  | 'knight'
  | 'elf'
  | 'wizard'
  | 'lizard'
  | 'bigZombie'
  | 'ogre'
  | 'imp'
  | 'goblin'
  | 'skeleton';

export interface EnemyTypeDef {
  walkAnim: string;
  deathAnim: string;
  config: EnemyConfig;
  scale?: number;
}

export const ENEMY_TYPES: Record<EnemyTypeKey, EnemyTypeDef> = {
  // ── Standard orc — baseline grunt ──
  orc: {
    walkAnim: 'orc_walk',
    deathAnim: 'orc_death',
    config: {
      speed: 50,
      health: 3,
      damage: 1,
      acceleration: 500,
      bodyWidth: 12,
      bodyHeight: 20,
      aggroRange: 90,
      chaseSpeedMult: 1.6,
      deathColor: 0x44aa33,  // green orc blood
      deathParticles: 10,
    },
  },

  // ── Knight — tanky, slow, hits hard ──
  knight: {
    walkAnim: 'knight_walk',
    deathAnim: 'orc_death',
    config: {
      speed: 30,
      health: 6,
      damage: 2,
      acceleration: 400,
      bodyWidth: 10,
      bodyHeight: 22,
      aggroRange: 110,
      chaseSpeedMult: 1.4,
      deathColor: 0x4466cc,  // blue armor shards
      deathParticles: 16,
    },
  },

  // ── Elf — fastest, fragile, long aggro ──
  elf: {
    walkAnim: 'elf_walk',
    deathAnim: 'orc_death',
    config: {
      speed: 65,
      health: 2,
      damage: 1,
      acceleration: 800,
      bodyWidth: 10,
      bodyHeight: 22,
      aggroRange: 130,
      chaseSpeedMult: 2.0,
      deathColor: 0x66cc66,  // green magic sparkle
      deathParticles: 8,
    },
  },

  // ── Wizard — slow, high damage, wide aggro ──
  wizard: {
    walkAnim: 'wizard_walk',
    deathAnim: 'orc_death',
    config: {
      speed: 22,
      health: 4,
      damage: 2,
      acceleration: 300,
      bodyWidth: 10,
      bodyHeight: 22,
      aggroRange: 150,
      chaseSpeedMult: 1.2,
      deathColor: 0x8844cc,  // purple magic burst
      deathParticles: 14,
    },
  },

  // ── Lizard — agile, quick, moderate ──
  lizard: {
    walkAnim: 'lizard_walk',
    deathAnim: 'orc_death',
    config: {
      speed: 58,
      health: 3,
      damage: 1,
      acceleration: 700,
      bodyWidth: 10,
      bodyHeight: 22,
      aggroRange: 100,
      chaseSpeedMult: 1.8,
      deathColor: 0x33aa55,  // green scales
      deathParticles: 12,
    },
  },

  // ── Big Zombie — huge, slow, damage sponge ──
  bigZombie: {
    walkAnim: 'bigzombie_walk',
    deathAnim: 'orc_death',
    config: {
      speed: 18,
      health: 8,
      damage: 2,
      acceleration: 200,
      bodyWidth: 12,
      bodyHeight: 26,
      aggroRange: 70,
      chaseSpeedMult: 1.3,
      deathColor: 0x55aaaa,  // teal goo
      deathParticles: 20,
    },
    scale: 1.3,
  },

  // ── Ogre — big, strong, moderate speed ──
  ogre: {
    walkAnim: 'ogre_walk',
    deathAnim: 'orc_death',
    config: {
      speed: 25,
      health: 7,
      damage: 3,
      acceleration: 250,
      bodyWidth: 12,
      bodyHeight: 26,
      aggroRange: 80,
      chaseSpeedMult: 1.4,
      deathColor: 0xaa7733,  // brown chunks
      deathParticles: 18,
    },
    scale: 1.2,
  },

  // ── Imp — fast, sneaky, fire demon ──
  imp: {
    walkAnim: 'imp_walk',
    deathAnim: 'orc_death',
    config: {
      speed: 55,
      health: 3,
      damage: 1,
      acceleration: 600,
      bodyWidth: 12,
      bodyHeight: 20,
      aggroRange: 105,
      chaseSpeedMult: 1.8,
      deathColor: 0xee5522,  // fire/ember
      deathParticles: 12,
    },
  },

  // ── Goblin — quick, weak, swarmer ──
  goblin: {
    walkAnim: 'goblin_walk',
    deathAnim: 'orc_death',
    config: {
      speed: 48,
      health: 2,
      damage: 1,
      acceleration: 550,
      bodyWidth: 12,
      bodyHeight: 20,
      aggroRange: 95,
      chaseSpeedMult: 1.7,
      deathColor: 0x55bb33,  // goblin green
      deathParticles: 8,
    },
  },

  // ── Skeleton — fragile, relentless, medium speed ──
  skeleton: {
    walkAnim: 'skeleton_walk',
    deathAnim: 'orc_death',
    config: {
      speed: 42,
      health: 2,
      damage: 1,
      acceleration: 500,
      bodyWidth: 10,
      bodyHeight: 14,
      aggroRange: 100,
      chaseSpeedMult: 1.6,
      deathColor: 0xccccaa,  // bone white
      deathParticles: 10,
    },
    scale: 0.9,
  },
};

/**
 * Factory: create an enemy of the given type at (x, y).
 * Automatically sets walk animation, scale, and depth.
 */
export function createEnemy(
  scene: Phaser.Scene,
  x: number,
  y: number,
  type: EnemyTypeKey,
): Enemy {
  const def = ENEMY_TYPES[type];
  const firstFrame = `${type === 'bigZombie' ? 'bigzombie' : type}_walk_0`;

  const enemy = new Enemy(scene, x, y, firstFrame, {
    ...def.config,
    walkAnim: def.walkAnim,
    deathAnim: def.deathAnim,
  });

  if (def.scale) {
    enemy.setScale(def.scale);
  }

  enemy.play(def.walkAnim);
  enemy.setDepth(1);

  return enemy;
}
