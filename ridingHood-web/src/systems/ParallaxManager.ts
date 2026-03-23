import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import type { ParallaxLayerDef } from '../levels/LevelData';

/**
 * Parallax background rendered in its own scene so it is NOT affected
 * by the GameScene camera zoom (which doubles everything).
 *
 * GameScene launches ParallaxBgScene underneath itself; ParallaxManager
 * acts as a thin controller that delegates to that scene.
 */

interface ParallaxLayer {
  tileSprite: Phaser.GameObjects.TileSprite;
  scrollSpeed: number;
}

// ── Background Scene ────────────────────────────────────────────
export class ParallaxBgScene extends Phaser.Scene {
  layers: ParallaxLayer[] = [];
  filterOverlay?: Phaser.GameObjects.Rectangle;
  /** Zoom level of the GameScene camera — used to convert scroll values */
  gameZoom: number = 1;

  constructor() {
    super({ key: 'ParallaxBgScene' });
  }

  create(data: { layerDefs: ParallaxLayerDef[]; gameZoom: number }): void {
    this.layers = [];
    this.gameZoom = data.gameZoom;

    for (const config of data.layerDefs) {
      const texture = this.textures.get(config.key);
      if (!texture || texture.key === '__MISSING') continue;

      const frame = texture.getSourceImage();
      const texH = frame.height;

      // Scale to fill the full 640×360 canvas (this scene has zoom 1)
      const scaleY = GAME_HEIGHT / texH;

      const tileSprite = this.add.tileSprite(
        0, 0,
        GAME_WIDTH * 3,
        texH,
        config.key,
      );
      tileSprite.setOrigin(0, 0);
      tileSprite.setScale(scaleY);
      tileSprite.setScrollFactor(0);
      tileSprite.setDepth(-10 + data.layerDefs.indexOf(config));
      tileSprite.setPosition(-GAME_WIDTH, 0);

      this.layers.push({ tileSprite, scrollSpeed: config.scrollSpeed });
    }

    // Dark filter overlay
    this.filterOverlay = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x333355, 0.3,
    );
    this.filterOverlay.setScrollFactor(0);
    this.filterOverlay.setDepth(-1);
  }

  /** Called every frame by ParallaxManager with the GameScene camera scroll */
  scrollUpdate(gameCamScrollX: number): void {
    for (const layer of this.layers) {
      // GameScene scroll is in world units (320×180 viewport).
      // Our tile sprites are sized for 640×360, so scale the scroll offset.
      layer.tileSprite.tilePositionX = gameCamScrollX * layer.scrollSpeed;
    }
  }
}

// ── Manager (lives in GameScene) ────────────────────────────────
export class ParallaxManager {
  private scene: Phaser.Scene;
  private bgScene: ParallaxBgScene | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create(layerDefs: ParallaxLayerDef[], gameZoom: number = 2): void {
    // Launch background scene and send it to the back of the render order
    this.scene.scene.launch('ParallaxBgScene', { layerDefs, gameZoom });
    this.scene.scene.sendToBack('ParallaxBgScene');

    // Grab reference once it's created
    this.bgScene = this.scene.scene.get('ParallaxBgScene') as ParallaxBgScene;

    // Clean up when GameScene shuts down
    this.scene.events.on('shutdown', () => {
      this.scene.scene.stop('ParallaxBgScene');
      this.bgScene = null;
    });
  }

  update(): void {
    if (!this.bgScene) return;
    this.bgScene.scrollUpdate(this.scene.cameras.main.scrollX);
  }

  setDarkTint(enabled: boolean): void {
    const overlay = this.bgScene?.filterOverlay;
    if (!overlay) return;
    const bgScene = this.bgScene!;

    if (enabled) {
      bgScene.tweens.add({ targets: overlay, fillAlpha: 0.5, duration: 500 });
      overlay.setFillStyle(0x220022, 0.5);
    } else {
      bgScene.tweens.add({ targets: overlay, fillAlpha: 0.3, duration: 500 });
      overlay.setFillStyle(0x333355, 0.3);
    }
  }

  setThemeTint(color: number, alpha: number): void {
    const overlay = this.bgScene?.filterOverlay;
    if (!overlay) return;
    overlay.setFillStyle(color, alpha);
    this.bgScene!.tweens.add({ targets: overlay, fillAlpha: alpha, duration: 400 });
  }
}
