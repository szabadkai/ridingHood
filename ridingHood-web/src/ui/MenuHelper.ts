import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { getSoundManager } from '../systems/SoundManager';

// Font family used throughout menus
const FONT = '"Courier New", Courier, monospace';

// Consistent color palette for all menus
export const COLORS = {
  bg: 0x0a0812,
  panelBg: 0x140e1e,
  panelBorder: 0x3a2255,
  title: '#cc3333',
  subtitle: '#887799',
  text: '#ccbbdd',
  textDim: '#665577',
  highlight: '#cc3333',
  highlightAlt: '#cc66ff',
  buttonText: '#ccbbdd',
  buttonHover: '#ffffff',
  accent: 0x9933cc,
  accentDim: 0x663399,
  muted: '#555555',
} as const;

export interface MenuButtonConfig {
  label: string;
  onClick: () => void;
  color?: string;
  hoverColor?: string;
}

export interface MenuNav {
  texts: Phaser.GameObjects.Text[];
  focusIndex: number;
  setFocus: (index: number) => void;
}

/**
 * Creates a styled panel with optional border.
 */
export function drawPanel(
  scene: Phaser.Scene,
  x: number, y: number,
  w: number, h: number,
  depth: number = 0,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setDepth(depth);
  g.fillStyle(COLORS.panelBg, 0.95);
  g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 6);
  g.lineStyle(2, COLORS.panelBorder, 0.8);
  g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 6);
  return g;
}

/**
 * Creates a row of menu buttons with hover effects, sounds,
 * and full keyboard (UP/DOWN/ENTER) + mouse navigation.
 */
export function createMenuButtons(
  scene: Phaser.Scene,
  cx: number,
  startY: number,
  spacing: number,
  buttons: MenuButtonConfig[],
  depth: number = 10,
): MenuNav {
  const sound = getSoundManager();
  const texts: Phaser.GameObjects.Text[] = [];
  const baseColors: string[] = [];
  const hoverColors: string[] = [];
  let focusIndex = 0;

  const setFocus = (index: number) => {
    if (focusIndex >= 0 && focusIndex < texts.length) {
      texts[focusIndex].setColor(baseColors[focusIndex]);
      texts[focusIndex].setScale(1);
    }
    focusIndex = index;
    texts[focusIndex].setColor(hoverColors[focusIndex]);
    texts[focusIndex].setScale(1);
  };

  for (let i = 0; i < buttons.length; i++) {
    const btn = buttons[i];
    const y = startY + i * spacing;
    const baseColor = btn.color ?? COLORS.buttonText;
    const hoverColor = btn.hoverColor ?? COLORS.buttonHover;
    baseColors.push(baseColor);
    hoverColors.push(hoverColor);

    const text = scene.add.text(cx, y, btn.label, {
      fontSize: '16px',
      color: baseColor,
      fontFamily: FONT,
      fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(depth);

    text.on('pointerover', () => {
      if (focusIndex !== i) {
        sound.playMenuSelect();
      }
      setFocus(i);
    });
    text.on('pointerout', () => {
      text.setColor(baseColor);
      text.setScale(1);
    });
    text.on('pointerdown', () => {
      sound.playMenuConfirm();
      btn.onClick();
    });

    texts.push(text);
  }

  setFocus(0);

  // Keyboard navigation
  scene.input.keyboard!.on('keydown-UP', () => {
    if (focusIndex > 0) { sound.playMenuSelect(); setFocus(focusIndex - 1); }
  });
  scene.input.keyboard!.on('keydown-DOWN', () => {
    if (focusIndex < buttons.length - 1) { sound.playMenuSelect(); setFocus(focusIndex + 1); }
  });
  scene.input.keyboard!.on('keydown-W', () => {
    if (focusIndex > 0) { sound.playMenuSelect(); setFocus(focusIndex - 1); }
  });
  scene.input.keyboard!.on('keydown-S', () => {
    if (focusIndex < buttons.length - 1) { sound.playMenuSelect(); setFocus(focusIndex + 1); }
  });
  scene.input.keyboard!.on('keydown-ENTER', () => {
    sound.playMenuConfirm();
    buttons[focusIndex].onClick();
  });
  scene.input.keyboard!.on('keydown-SPACE', () => {
    sound.playMenuConfirm();
    buttons[focusIndex].onClick();
  });

  return { texts, focusIndex, setFocus };
}

/**
 * Full-screen dim overlay.
 */
export function createOverlay(
  scene: Phaser.Scene,
  color: number = 0x000000,
  alpha: number = 0.7,
  depth: number = 0,
): Phaser.GameObjects.Rectangle {
  return scene.add.rectangle(
    GAME_WIDTH / 2, GAME_HEIGHT / 2,
    GAME_WIDTH, GAME_HEIGHT,
    color, alpha,
  ).setDepth(depth);
}

/**
 * Creates a styled title text.
 */
export function createTitle(
  scene: Phaser.Scene,
  x: number, y: number,
  text: string,
  fontSize: string = '24px',
  color: string = COLORS.title,
  depth: number = 10,
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    fontSize,
    color,
    fontFamily: FONT,
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(depth);
}

/**
 * Creates a subtle divider line.
 */
export function createDivider(
  scene: Phaser.Scene,
  y: number,
  width: number = 180,
  depth: number = 10,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setDepth(depth);
  const cx = GAME_WIDTH / 2;
  g.lineStyle(2, COLORS.panelBorder, 0.5);
  g.lineBetween(cx - width / 2, y, cx + width / 2, y);
  return g;
}
