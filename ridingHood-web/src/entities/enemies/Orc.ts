import { Enemy } from './Enemy';
import { ENEMY } from '../../config/GameConfig';

export class Orc extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'orc_walk_0', {
      speed: ENEMY.ORC_SPEED,
      health: ENEMY.ORC_HEALTH,
      damage: ENEMY.ORC_DAMAGE,
      acceleration: ENEMY.ORC_ACCELERATION * 100,
      bodyWidth: 12,
      bodyHeight: 20,
      aggroRange: 90,
      chaseSpeedMult: 1.6,
    });

    this.play('orc_walk');
    this.setDepth(1);
  }
}
