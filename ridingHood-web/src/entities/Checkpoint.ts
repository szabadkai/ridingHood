import Phaser from 'phaser';
import { EventBus, Events } from '../utils/EventBus';

export class Checkpoint extends Phaser.Physics.Arcade.Sprite {
  private isActivated: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Generate checkpoint texture if needed
    if (!scene.textures.exists('checkpoint_inactive')) {
      Checkpoint.generateTextures(scene);
    }

    super(scene, x, y, 'checkpoint_inactive');
    scene.add.existing(this as Phaser.GameObjects.GameObject);
    scene.physics.add.existing(this as unknown as Phaser.GameObjects.GameObject, true); // static body

    this.setOrigin(0.5, 1.0);
    this.setDepth(1);
  }

  activate(): void {
    if (this.isActivated) return;
    this.isActivated = true;
    this.setTexture('checkpoint_active');

    // Activation flash
    this.setTint(0xffff00);
    this.scene.time.delayedCall(200, () => this.clearTint());

    EventBus.emit(Events.CHECKPOINT_ACTIVATED);
  }

  getIsActivated(): boolean {
    return this.isActivated;
  }

  static generateTextures(scene: Phaser.Scene): void {
    // Inactive checkpoint — gray flag/post
    const g1 = scene.add.graphics();
    g1.setVisible(false);
    // Post
    g1.fillStyle(0x666666, 1);
    g1.fillRect(3, 0, 2, 20);
    // Flag
    g1.fillStyle(0x888888, 1);
    g1.fillRect(5, 0, 8, 6);
    g1.fillStyle(0x777777, 1);
    g1.fillRect(5, 2, 8, 2);
    // Base
    g1.fillStyle(0x555555, 1);
    g1.fillRect(1, 18, 6, 2);
    g1.generateTexture('checkpoint_inactive', 14, 20);
    g1.destroy();

    // Active checkpoint — red/golden flag
    const g2 = scene.add.graphics();
    g2.setVisible(false);
    // Post
    g2.fillStyle(0xccaa44, 1);
    g2.fillRect(3, 0, 2, 20);
    // Flag
    g2.fillStyle(0xcc3333, 1);
    g2.fillRect(5, 0, 8, 6);
    g2.fillStyle(0xee4444, 1);
    g2.fillRect(5, 1, 6, 2);
    // Emblem
    g2.fillStyle(0xffcc00, 1);
    g2.fillRect(7, 2, 2, 2);
    // Base
    g2.fillStyle(0xccaa44, 1);
    g2.fillRect(1, 18, 6, 2);
    g2.generateTexture('checkpoint_active', 14, 20);
    g2.destroy();
  }
}
