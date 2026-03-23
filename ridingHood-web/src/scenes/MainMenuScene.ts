import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { getSoundManager } from '../systems/SoundManager';
import { pixelText } from '../ui/PixelText';
import { COLORS, createMenuButtons, type MenuNav } from '../ui/MenuHelper';

const BG = 0x0a0812;
const PANEL_BG = 0x140e1e;
const PANEL_BORDER = 0x3a2255;
const ACCENT = 0x9933cc;
const FONT = '"Courier New", Courier, monospace';

export class MainMenuScene extends Phaser.Scene {
  private settingsOpen: boolean = false;
  private settingsGroup: Phaser.GameObjects.GameObject[] = [];
  private mainNav!: MenuNav;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    this.settingsOpen = false;
    this.settingsGroup = [];

    const sound = getSoundManager();
    sound.setScene(this);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Background
    this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, BG);

    // Floating ember particles
    for (let i = 0; i < 30; i++) {
      const px = Phaser.Math.Between(10, GAME_WIDTH - 10);
      const py = Phaser.Math.Between(60, GAME_HEIGHT);
      const dot = this.add.circle(px, py, 2, ACCENT, 0.4);
      this.tweens.add({
        targets: dot,
        y: py - Phaser.Math.Between(30, 80),
        alpha: 0,
        duration: Phaser.Math.Between(2500, 5000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 3000),
        onRepeat: () => {
          dot.setPosition(
            Phaser.Math.Between(10, GAME_WIDTH - 10),
            Phaser.Math.Between(160, GAME_HEIGHT),
          );
          dot.setAlpha(0.4);
        },
      });
    }

    // Panel background
    const panelW = 440;
    const panelH = 260;
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(PANEL_BG, 0.92);
    g.fillRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 8);
    g.lineStyle(2, PANEL_BORDER, 0.7);
    g.strokeRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 8);

    // Title
    const title = pixelText(this, cx, cy - 96, 'Dark Riding Hood', 'title');
    this.tweens.add({
      targets: title,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Subtitle
    pixelText(this, cx, cy - 60, 'A Tale of Light & Shadow', 'dim');

    // Divider
    const divG = this.add.graphics().setDepth(10);
    divG.lineStyle(2, PANEL_BORDER, 0.5);
    divG.lineBetween(cx - 200, cy - 36, cx + 200, cy - 36);

    // Menu buttons
    this.mainNav = createMenuButtons(this, cx, cy, 32, [
      { label: 'Start Game', onClick: () => this.startGame() },
      { label: 'Settings', onClick: () => this.openSettings(), color: COLORS.text },
    ]);

    // Controls hint (below panel)
    pixelText(this, cx, cy + panelH / 2 + 16, 'ENTER / SPACE to select', 'dim');
    pixelText(this, cx, cy + panelH / 2 + 40, 'J/X:Attack  K/Z:Dodge  Hold L/C:Transform', 'dim');

    // Version
    this.add.text(GAME_WIDTH - 8, GAME_HEIGHT - 8, 'v0.2', {
      fontSize: '14px',
      color: '#555555',
      fontFamily: FONT,
    }).setOrigin(1, 1);
  }

  private startGame(): void {
    this.scene.start('OverworldScene');
  }

  private openSettings(): void {
    if (this.settingsOpen) return;
    this.settingsOpen = true;

    const sound = getSoundManager();
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Dim overlay
    const overlay = this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6)
      .setDepth(50).setInteractive(); // blocks clicks behind

    // Settings panel
    const panelW = 400;
    const panelH = 240;
    const pg = this.add.graphics().setDepth(51);
    pg.fillStyle(PANEL_BG, 0.95);
    pg.fillRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 8);
    pg.lineStyle(2, PANEL_BORDER, 0.9);
    pg.strokeRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 8);

    // Title
    const settingsTitle = this.add.text(cx, cy - 92, 'Settings', {
      fontSize: '20px',
      color: '#cc66ff',
      fontFamily: FONT,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(52);

    // Divider
    const divG = this.add.graphics().setDepth(52);
    divG.lineStyle(2, PANEL_BORDER, 0.5);
    divG.lineBetween(cx - 160, cy - 68, cx + 160, cy - 68);

    // Sound toggle
    const soundLabel = this.add.text(cx, cy - 40, `Sound: ${sound.isMuted() ? 'OFF' : 'ON'}`, {
      fontSize: '16px',
      color: '#ccbbdd',
      fontFamily: FONT,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(52).setInteractive({ useHandCursor: true });

    soundLabel.on('pointerdown', () => {
      sound.toggleMute();
      soundLabel.setText(`Sound: ${sound.isMuted() ? 'OFF' : 'ON'}`);
      sound.playMenuSelect();
    });

    // Volume bar
    const volLabel = this.add.text(cx - 120, cy, 'Volume:', {
      fontSize: '16px',
      color: '#ccbbdd',
      fontFamily: FONT,
    }).setOrigin(0, 0.5).setDepth(52);

    const barX = cx - 20;
    const barW = 120;
    const barH = 12;
    const barY = cy;

    // Volume bar background
    const volBg = this.add.graphics().setDepth(52);
    volBg.fillStyle(0x222222, 0.8);
    volBg.fillRect(barX, barY - barH / 2, barW, barH);
    volBg.lineStyle(2, PANEL_BORDER, 0.5);
    volBg.strokeRect(barX, barY - barH / 2, barW, barH);

    // Volume bar fill
    const volFill = this.add.graphics().setDepth(52);
    const drawVolFill = () => {
      volFill.clear();
      const vol = sound.getMasterVolume();
      volFill.fillStyle(ACCENT, 1);
      volFill.fillRect(barX + 2, barY - barH / 2 + 2, (barW - 4) * vol, barH - 4);
    };
    drawVolFill();

    // Volume decrease button
    const volDown = this.add.text(barX - 20, barY, '-', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: FONT,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(52).setInteractive({ useHandCursor: true });

    volDown.on('pointerdown', () => {
      sound.setMasterVolume(sound.getMasterVolume() - 0.1);
      drawVolFill();
      sound.playMenuSelect();
    });

    // Volume increase button
    const volUp = this.add.text(barX + barW + 20, barY, '+', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: FONT,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(52).setInteractive({ useHandCursor: true });

    volUp.on('pointerdown', () => {
      sound.setMasterVolume(sound.getMasterVolume() + 0.1);
      drawVolFill();
      sound.playMenuSelect();
    });

    // Clear progress button
    const clearBtn = this.add.text(cx, cy + 44, 'Clear Save Data', {
      fontSize: '16px',
      color: '#cc4444',
      fontFamily: FONT,
    }).setOrigin(0.5).setDepth(52).setInteractive({ useHandCursor: true });

    clearBtn.on('pointerdown', () => {
      try { localStorage.removeItem('darkRidingHood_progress'); } catch { /* ok */ }
      clearBtn.setText('Save Data Cleared!');
      clearBtn.setColor('#44cc44');
      sound.playMenuConfirm();
    });

    // Back button
    const backBtn = this.add.text(cx, cy + 84, 'Back', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: FONT,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(52).setInteractive({ useHandCursor: true });

    backBtn.on('pointerover', () => backBtn.setColor('#cc66ff'));
    backBtn.on('pointerout', () => backBtn.setColor('#ffffff'));
    backBtn.on('pointerdown', () => {
      sound.playMenuConfirm();
      this.closeSettings();
    });

    // ESC to close
    const escHandler = () => {
      this.closeSettings();
    };
    this.input.keyboard!.on('keydown-ESC', escHandler);

    // Keyboard nav for settings
    let settingsFocus = 0;
    const focusables = [soundLabel, volDown, volUp, clearBtn, backBtn];
    const highlightFocus = () => {
      for (let i = 0; i < focusables.length; i++) {
        if (i === settingsFocus) {
          focusables[i].setColor('#cc66ff');
        } else {
          // Restore default colors
          if (i === 0) focusables[i].setColor('#ccbbdd');
          else if (i === 1 || i === 2) focusables[i].setColor('#ffffff');
          else if (i === 3) focusables[i].setColor('#cc4444');
          else focusables[i].setColor('#ffffff');
        }
      }
    };

    const upHandler = () => {
      settingsFocus = Math.max(0, settingsFocus - 1);
      sound.playMenuSelect();
      highlightFocus();
    };
    const downHandler = () => {
      settingsFocus = Math.min(focusables.length - 1, settingsFocus + 1);
      sound.playMenuSelect();
      highlightFocus();
    };
    const enterHandler = () => {
      sound.playMenuConfirm();
      focusables[settingsFocus].emit('pointerdown');
    };
    const leftHandler = () => {
      if (settingsFocus === 1 || settingsFocus === 2) {
        volDown.emit('pointerdown');
      }
    };
    const rightHandler = () => {
      if (settingsFocus === 1 || settingsFocus === 2) {
        volUp.emit('pointerdown');
      }
    };

    this.input.keyboard!.on('keydown-UP', upHandler);
    this.input.keyboard!.on('keydown-DOWN', downHandler);
    this.input.keyboard!.on('keydown-W', upHandler);
    this.input.keyboard!.on('keydown-S', downHandler);
    this.input.keyboard!.on('keydown-ENTER', enterHandler);
    this.input.keyboard!.on('keydown-SPACE', enterHandler);
    this.input.keyboard!.on('keydown-LEFT', leftHandler);
    this.input.keyboard!.on('keydown-RIGHT', rightHandler);
    this.input.keyboard!.on('keydown-A', leftHandler);
    this.input.keyboard!.on('keydown-D', rightHandler);

    this.settingsGroup = [
      overlay, pg, settingsTitle, divG, soundLabel, volLabel,
      volBg, volFill, volDown, volUp, clearBtn, backBtn,
    ];

    // Store cleanup handlers
    (this as unknown as Record<string, unknown>)._settingsCleanup = () => {
      this.input.keyboard!.off('keydown-ESC', escHandler);
      this.input.keyboard!.off('keydown-UP', upHandler);
      this.input.keyboard!.off('keydown-DOWN', downHandler);
      this.input.keyboard!.off('keydown-W', upHandler);
      this.input.keyboard!.off('keydown-S', downHandler);
      this.input.keyboard!.off('keydown-ENTER', enterHandler);
      this.input.keyboard!.off('keydown-SPACE', enterHandler);
      this.input.keyboard!.off('keydown-LEFT', leftHandler);
      this.input.keyboard!.off('keydown-RIGHT', rightHandler);
      this.input.keyboard!.off('keydown-A', leftHandler);
      this.input.keyboard!.off('keydown-D', rightHandler);
    };
  }

  private closeSettings(): void {
    if (!this.settingsOpen) return;
    this.settingsOpen = false;

    for (const obj of this.settingsGroup) {
      obj.destroy();
    }
    this.settingsGroup = [];

    // Clean up keyboard handlers
    const cleanup = (this as unknown as Record<string, unknown>)._settingsCleanup as (() => void) | undefined;
    if (cleanup) cleanup();
  }
}
