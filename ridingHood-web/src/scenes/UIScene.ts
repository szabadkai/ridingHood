import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PLAYER, DARKNESS_METER } from '../config/GameConfig';
import { EventBus, Events } from '../utils/EventBus';

// Persist across scene restarts — only show onboarding once per session
let hasShownDarkFormOnboarding = false;

export class UIScene extends Phaser.Scene {
  private hearts: Phaser.GameObjects.Text[] = [];
  private meterBar!: Phaser.GameObjects.Graphics;
  private meterBg!: Phaser.GameObjects.Graphics;
  private formText!: Phaser.GameObjects.Text;
  private modalGroup: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    // Hearts display
    this.hearts = [];
    for (let i = 0; i < PLAYER.MAX_HEALTH; i++) {
      const heart = this.add.text(4 + i * 10, 4, '\u2665', {
        fontSize: '8px',
        color: '#cc3333',
        fontFamily: 'monospace',
      });
      this.hearts.push(heart);
    }

    // Darkness meter background
    this.meterBg = this.add.graphics();
    this.meterBg.fillStyle(0x222222, 0.8);
    this.meterBg.fillRect(4, 14, 52, 4);

    // Darkness meter fill
    this.meterBar = this.add.graphics();
    this.updateMeter(0);

    // Form indicator
    this.formText = this.add.text(58, 13, 'LIGHT', {
      fontSize: '5px',
      color: '#ffffff',
      fontFamily: 'monospace',
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

  private updateHealth = (current: number, _max: number): void => {
    for (let i = 0; i < this.hearts.length; i++) {
      this.hearts[i].setColor(i < current ? '#cc3333' : '#333333');
    }
  };

  private updateMeter = (value: number): void => {
    this.meterBar.clear();
    const fillWidth = (value / DARKNESS_METER.MAX) * 50;
    const color = value >= DARKNESS_METER.TRANSFORM_THRESHOLD ? 0x9933cc : 0x663399;
    this.meterBar.fillStyle(color, 1);
    this.meterBar.fillRect(5, 15, fillWidth, 2);
  };

  private updateForm = (form: 'light' | 'dark'): void => {
    this.formText.setText(form.toUpperCase());
    this.formText.setColor(form === 'dark' ? '#9933cc' : '#ffffff');
  };

  // ── Dark Form Onboarding Modal ──────────────────────────────

  private onMeterReachedThreshold = (): void => {
    if (hasShownDarkFormOnboarding) return;
    hasShownDarkFormOnboarding = true;
    this.showDarkFormModal();
  };

  private showDarkFormModal(): void {
    // Pause the game scene
    this.scene.pause('GameScene');

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Dim overlay
    const overlay = this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);
    overlay.setDepth(100);

    // Modal background
    const modalW = 260;
    const modalH = 145;
    const modalBg = this.add.graphics();
    modalBg.setDepth(101);
    // Border
    modalBg.lineStyle(1, 0x9933cc, 1);
    modalBg.fillStyle(0x1a0a2e, 0.95);
    modalBg.fillRoundedRect(cx - modalW / 2, cy - modalH / 2, modalW, modalH, 4);
    modalBg.strokeRoundedRect(cx - modalW / 2, cy - modalH / 2, modalW, modalH, 4);

    // Title
    const title = this.add.text(cx, cy - modalH / 2 + 16, 'Dark Riding Hood', {
      fontSize: '12px',
      color: '#cc66ff',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(102);

    // Divider
    const divider = this.add.graphics().setDepth(102);
    divider.lineStyle(1, 0x663399, 0.5);
    divider.lineBetween(cx - modalW / 2 + 10, cy - modalH / 2 + 28, cx + modalW / 2 - 10, cy - modalH / 2 + 28);

    // Body text
    const bodyText = this.add.text(cx, cy - 4, [
      'Your darkness meter is full!',
      '',
      'Press [C] to transform into',
      'Dark Riding Hood.',
      '',
      'Stronger attacks & dash ability',
      'but you take 1.5x damage.',
      'Meter drains over time.',
    ].join('\n'), {
      fontSize: '8px',
      color: '#ccbbdd',
      fontFamily: 'monospace',
      align: 'center',
      lineSpacing: 2,
    }).setOrigin(0.5).setDepth(102);

    // Dismiss prompt
    const dismiss = this.add.text(cx, cy + modalH / 2 - 14, '[ Press any key to continue ]', {
      fontSize: '8px',
      color: '#9966cc',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(102);

    // Blink the dismiss prompt
    this.tweens.add({
      targets: dismiss,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.modalGroup = [overlay, modalBg, title, divider, bodyText, dismiss];

    // Dismiss on any key press or mouse click (after a brief delay to avoid instant dismiss)
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
