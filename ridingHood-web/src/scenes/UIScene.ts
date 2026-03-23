import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PLAYER, DARKNESS_METER } from '../config/GameConfig';
import { EventBus, Events } from '../utils/EventBus';
import { pixelText } from '../ui/PixelText';

// Persist across scene restarts — only show onboarding once per session
let hasShownDarkFormOnboarding = false;

const FONT = '"Courier New", Courier, monospace';

export class UIScene extends Phaser.Scene {
  private heartGraphics!: Phaser.GameObjects.Graphics;
  private meterBar!: Phaser.GameObjects.Graphics;
  private meterBg!: Phaser.GameObjects.Graphics;
  private formText!: Phaser.GameObjects.Text;
  private modalGroup: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    // Hearts drawn as pixel graphics
    this.heartGraphics = this.add.graphics();
    this.drawHearts(PLAYER.MAX_HEALTH);

    // Darkness meter background
    this.meterBg = this.add.graphics();
    this.meterBg.fillStyle(0x222222, 0.8);
    this.meterBg.fillRect(8, 28, 104, 8);

    // Darkness meter fill
    this.meterBar = this.add.graphics();
    this.updateMeter(0);

    // Form indicator
    this.formText = this.add.text(116, 28, 'LIGHT', {
      fontSize: '12px',
      color: '#888888',
      fontFamily: FONT,
    });

    // Listen for events
    EventBus.on(Events.HEALTH_CHANGED, this.updateHealth, this);
    EventBus.on(Events.METER_CHANGED, this.updateMeter, this);
    EventBus.on(Events.FORM_CHANGED, this.updateForm, this);
    EventBus.on(Events.METER_REACHED_THRESHOLD, this.onMeterReachedThreshold, this);

    this.events.on('shutdown', () => {
      EventBus.off(Events.HEALTH_CHANGED, this.updateHealth, this);
      EventBus.off(Events.METER_CHANGED, this.updateMeter, this);
      EventBus.off(Events.FORM_CHANGED, this.updateForm, this);
      EventBus.off(Events.METER_REACHED_THRESHOLD, this.onMeterReachedThreshold, this);
    });
  }

  private drawHearts(current: number): void {
    this.heartGraphics.clear();
    for (let i = 0; i < PLAYER.MAX_HEALTH; i++) {
      const x = 10 + i * 20;
      const y = 12;
      const filled = i < current;
      this.heartGraphics.fillStyle(filled ? 0xcc3333 : 0x333333, 1);
      // Pixel heart: 10x8
      this.heartGraphics.fillRect(x + 2, y, 2, 2);
      this.heartGraphics.fillRect(x + 6, y, 2, 2);
      this.heartGraphics.fillRect(x, y + 2, 10, 2);
      this.heartGraphics.fillRect(x + 2, y + 4, 6, 2);
      this.heartGraphics.fillRect(x + 4, y + 6, 2, 2);
    }
  }

  private updateHealth = (current: number, _max: number): void => {
    this.drawHearts(current);
  };

  private updateMeter = (value: number): void => {
    this.meterBar.clear();
    const fillWidth = (value / DARKNESS_METER.MAX) * 100;
    const color = value >= DARKNESS_METER.TRANSFORM_THRESHOLD ? 0x9933cc : 0x663399;
    this.meterBar.fillStyle(color, 1);
    this.meterBar.fillRect(10, 30, fillWidth, 4);
  };

  private updateForm = (form: 'light' | 'dark'): void => {
    this.formText.setText(form.toUpperCase());
    this.formText.setColor(form === 'dark' ? '#9933cc' : '#888888');
  };

  // ── Dark Form Onboarding Modal ──────────────────────────────

  private onMeterReachedThreshold = (): void => {
    if (hasShownDarkFormOnboarding) return;
    hasShownDarkFormOnboarding = true;
    this.showDarkFormModal();
  };

  private showDarkFormModal(): void {
    this.scene.pause('GameScene');

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const overlay = this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7).setDepth(100);

    const modalW = 520;
    const modalH = 290;
    const modalBg = this.add.graphics().setDepth(101);
    modalBg.lineStyle(2, 0x9933cc, 1);
    modalBg.fillStyle(0x1a0a2e, 0.95);
    modalBg.fillRoundedRect(cx - modalW / 2, cy - modalH / 2, modalW, modalH, 8);
    modalBg.strokeRoundedRect(cx - modalW / 2, cy - modalH / 2, modalW, modalH, 8);

    const title = pixelText(this, cx, cy - modalH / 2 + 32, 'Dark Riding Hood', 'heading', 102);

    const divider = this.add.graphics().setDepth(102);
    divider.lineStyle(2, 0x663399, 0.5);
    divider.lineBetween(cx - modalW / 2 + 20, cy - modalH / 2 + 56, cx + modalW / 2 - 20, cy - modalH / 2 + 56);

    const bodyText = this.add.text(cx, cy - 8, [
      'Your darkness meter is full!',
      '',
      'Hold [L] to transform into',
      'Dark Riding Hood.',
      '',
      'Stronger attacks & dash ability',
      'but you take 1.5x damage.',
      'Meter drains over time.',
    ].join('\n'), {
      fontSize: '16px',
      color: '#ccbbdd',
      fontFamily: FONT,
      align: 'center',
      lineSpacing: 4,
    }).setOrigin(0.5).setDepth(102);

    const dismiss = pixelText(this, cx, cy + modalH / 2 - 28, '[ Press any key to continue ]', 'accent', 102);

    this.tweens.add({
      targets: dismiss,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.modalGroup = [overlay, modalBg, title, divider, bodyText, dismiss];

    this.time.delayedCall(300, () => {
      const dismissHandler = () => {
        this.dismissModal();
        this.input.keyboard!.off('keydown', dismissHandler);
        this.input.off('pointerdown', dismissHandler);
      };
      this.input.keyboard!.on('keydown', dismissHandler);
      this.input.on('pointerdown', dismissHandler);
    });
  }

  private dismissModal(): void {
    for (const obj of this.modalGroup) {
      obj.destroy();
    }
    this.modalGroup = [];
    this.scene.resume('GameScene');
  }
}
