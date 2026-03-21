import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PARALLAX_LAYERS } from '../config/GameConfig';

interface ParallaxLayer {
  tileSprite: Phaser.GameObjects.TileSprite;
  scrollSpeed: number;
}

export class ParallaxManager {
  private scene: Phaser.Scene;
  private layers: ParallaxLayer[] = [];
  private filterOverlay?: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(): void {
    // Create each parallax layer as a TileSprite
    for (const config of PARALLAX_LAYERS) {
      const texture = this.scene.textures.get(config.key);
      if (!texture || texture.key === '__MISSING') continue;

      const frame = texture.getSourceImage();
      const texW = frame.width;
      const texH = frame.height;

      // Scale to fill viewport height
      const scaleY = GAME_HEIGHT / texH;
      const scaledW = texW * scaleY;

      // Create TileSprite covering the game width (and beyond for scrolling)
      const tileSprite = this.scene.add.tileSprite(
        0, 0,
        GAME_WIDTH * 3, // wide enough for camera movement
        texH,
        config.key,
      );
      tileSprite.setOrigin(0, 0);
      tileSprite.setScale(scaleY);
      tileSprite.setScrollFactor(0); // We manage scrolling manually
      tileSprite.setDepth(-10 + PARALLAX_LAYERS.indexOf(config));
      tileSprite.setPosition(-GAME_WIDTH, 0);

      this.layers.push({
        tileSprite,
        scrollSpeed: config.scrollSpeed,
      });
    }

    // Optional dark filter overlay
    this.filterOverlay = this.scene.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x333355, 0.3,
    );
    this.filterOverlay.setScrollFactor(0);
    this.filterOverlay.setDepth(-1);
  }

  update(): void {
    const camX = this.scene.cameras.main.scrollX;

    for (const layer of this.layers) {
      layer.tileSprite.tilePositionX = camX * layer.scrollSpeed;
    }
  }

  setDarkTint(enabled: boolean): void {
    if (!this.filterOverlay) return;
    if (enabled) {
      this.scene.tweens.add({
        targets: this.filterOverlay,
        fillAlpha: 0.5,
        duration: 500,
      });
      this.filterOverlay.setFillStyle(0x220022, 0.5);
    } else {
      this.scene.tweens.add({
        targets: this.filterOverlay,
        fillAlpha: 0.3,
        duration: 500,
      });
      this.filterOverlay.setFillStyle(0x333355, 0.3);
    }
  }

  setThemeTint(color: number, alpha: number): void {
    if (!this.filterOverlay) return;
    this.filterOverlay.setFillStyle(color, alpha);
    this.scene.tweens.add({
      targets: this.filterOverlay,
      fillAlpha: alpha,
      duration: 400,
    });
  }
}
