import Phaser from 'phaser';

/**
 * Preset styles for pixel-crisp text at 640x360 native resolution.
 * Uses 'Courier New' which renders well at small pixel sizes.
 */

export type PixelStyle = 'title' | 'heading' | 'body' | 'dim' | 'bright' | 'accent' | 'red' | 'gold';

const STYLE_MAP: Record<PixelStyle, Phaser.Types.GameObjects.Text.TextStyle> = {
  title: {
    fontSize: '24px',
    color: '#cc3333',
    fontFamily: '"Courier New", Courier, monospace',
    fontStyle: 'bold',
  },
  heading: {
    fontSize: '20px',
    color: '#cc66ff',
    fontFamily: '"Courier New", Courier, monospace',
    fontStyle: 'bold',
  },
  body: {
    fontSize: '16px',
    color: '#ccbbdd',
    fontFamily: '"Courier New", Courier, monospace',
  },
  dim: {
    fontSize: '16px',
    color: '#665577',
    fontFamily: '"Courier New", Courier, monospace',
  },
  bright: {
    fontSize: '16px',
    color: '#ffffff',
    fontFamily: '"Courier New", Courier, monospace',
    fontStyle: 'bold',
  },
  accent: {
    fontSize: '16px',
    color: '#cc66ff',
    fontFamily: '"Courier New", Courier, monospace',
  },
  red: {
    fontSize: '20px',
    color: '#ff4444',
    fontFamily: '"Courier New", Courier, monospace',
    fontStyle: 'bold',
  },
  gold: {
    fontSize: '20px',
    color: '#ffcc44',
    fontFamily: '"Courier New", Courier, monospace',
    fontStyle: 'bold',
  },
};

/**
 * Create a pixel-styled text object. Uses standard Phaser Text with
 * consistent styling that looks sharp at 320x180 with pixelArt scaling.
 */
export function pixelText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  style: PixelStyle = 'body',
  depth: number = 10,
): Phaser.GameObjects.Text {
  const baseStyle = { ...STYLE_MAP[style] };
  return scene.add.text(x, y, text, baseStyle)
    .setOrigin(0.5)
    .setDepth(depth);
}
