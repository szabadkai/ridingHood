import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { EventBus, Events } from '../utils/EventBus';

export class CameraManager {
  private scene: Phaser.Scene;
  private camera: Phaser.Cameras.Scene2D.Camera;
  private followTarget: Phaser.GameObjects.GameObject | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.camera = scene.cameras.main;

    // Set up camera properties
    this.camera.setRoundPixels(true);

    // Listen for events
    EventBus.on(Events.CAMERA_SHAKE, this.shake, this);
    EventBus.on(Events.CAMERA_ZOOM, this.zoomTo, this);

    scene.events.on('shutdown', () => {
      EventBus.off(Events.CAMERA_SHAKE, this.shake, this);
      EventBus.off(Events.CAMERA_ZOOM, this.zoomTo, this);
    });
  }

  follow(target: Phaser.GameObjects.GameObject): void {
    this.followTarget = target;
    this.camera.startFollow(target, true, 0.1, 0.1);
    this.camera.setDeadzone(20, 10);
  }

  setBounds(x: number, y: number, width: number, height: number): void {
    this.camera.setBounds(x, y, width, height);
  }

  /**
   * Smoothly pan camera to a world position, then call onComplete.
   * Temporarily stops following the target during the pan.
   */
  panTo(
    worldX: number,
    worldY: number,
    durationMs: number,
    onComplete?: () => void,
  ): void {
    // Stop following so we can manually scroll
    this.camera.stopFollow();

    // Target scroll position (camera shows GAME_WIDTH x GAME_HEIGHT centered on target)
    const targetScrollX = worldX - GAME_WIDTH / 2;
    const targetScrollY = worldY - GAME_HEIGHT / 2;

    this.scene.tweens.add({
      targets: this.camera,
      scrollX: targetScrollX,
      scrollY: targetScrollY,
      duration: durationMs,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });
  }

  /** Resume following the previously set target */
  resumeFollow(): void {
    if (this.followTarget) {
      this.camera.startFollow(this.followTarget, true, 0.1, 0.1);
      this.camera.setDeadzone(20, 10);
    }
  }

  private shake = (intensity: number = 0.005, duration: number = 100): void => {
    this.camera.shake(duration, intensity);
  };

  private zoomTo = (zoom: number, duration: number = 300): void => {
    this.scene.tweens.add({
      targets: this.camera,
      zoom,
      duration,
      ease: 'Sine.easeInOut',
    });
  };
}
