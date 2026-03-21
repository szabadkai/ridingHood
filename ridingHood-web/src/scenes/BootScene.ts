import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Nothing to preload for boot — go straight to preload scene
  }

  create(): void {
    this.scene.start('PreloadScene');
  }
}
