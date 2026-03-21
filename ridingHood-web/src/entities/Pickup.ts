import Phaser from 'phaser';

export type PickupType = 'food' | 'wolf_essence';

export class Pickup extends Phaser.Physics.Arcade.Sprite {
  private pickupType: PickupType;
  private collected: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, type: PickupType, texture: string) {
    super(scene, x, y, texture);
    this.pickupType = type;

    scene.add.existing(this as Phaser.GameObjects.GameObject);
    scene.physics.add.existing(this as unknown as Phaser.GameObjects.GameObject, true); // static body

    this.setOrigin(0.5, 1.0);
    this.setDepth(1);

    // Floating animation
    scene.tweens.add({
      targets: this,
      y: y - 4,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  getPickupType(): PickupType {
    return this.pickupType;
  }

  isCollected(): boolean {
    return this.collected;
  }

  collect(): void {
    if (this.collected) return;
    this.collected = true;

    // Scale up + fade out effect
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.destroy();
      },
    });
  }
}
