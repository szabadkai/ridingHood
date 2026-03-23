import Phaser from 'phaser';

/**
 * Boot scene — loads a web font for crisp pixel text, then starts PreloadScene.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Nothing to preload for boot
  }

  create(): void {
    this.scene.start('PreloadScene');
  }
}
