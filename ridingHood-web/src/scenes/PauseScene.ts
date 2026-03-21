import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { getSoundManager } from '../systems/SoundManager';
import { COLORS, drawPanel, createMenuButtons, createTitle, createDivider, createOverlay, MenuNav } from '../ui/MenuHelper';

export class PauseScene extends Phaser.Scene {
  private nav!: MenuNav;

  constructor() {
    super({ key: 'PauseScene' });
  }

  create(): void {
    const sound = getSoundManager();
    sound.setScene(this);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Dim overlay
    createOverlay(this, 0x000000, 0.6, 50);

    // Panel
    drawPanel(this, cx, cy, 160, 130, 51);

    // Title
    createTitle(this, cx, cy - 48, 'Paused', '12px', COLORS.highlightAlt, 52);

    // Divider
    createDivider(this, cy - 34, 120, 52);

    // All buttons including sound toggle via createMenuButtons for unified nav
    const soundLabel = () => `Sound: ${sound.isMuted() ? 'OFF' : 'ON'}`;

    this.nav = createMenuButtons(this, cx, cy - 12, 18, [
      { label: 'Resume', onClick: () => this.resumeGame() },
      { label: soundLabel(), onClick: () => this.toggleSound() },
      { label: 'Restart Level', onClick: () => this.restartLevel() },
      { label: 'Main Menu', onClick: () => this.goToMainMenu(), color: COLORS.textDim },
    ], 52);

    // Controls hint
    this.add.text(cx, cy + 56, 'ESC resume / M toggle sound', {
      fontSize: '7px',
      color: COLORS.textDim,
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(52);

    // Extra keyboard shortcuts (ESC/P to resume, M to toggle)
    this.input.keyboard!.on('keydown-ESC', () => this.resumeGame());
    this.input.keyboard!.on('keydown-P', () => this.resumeGame());
    this.input.keyboard!.on('keydown-M', () => this.toggleSound());
  }

  private toggleSound(): void {
    const muted = getSoundManager().toggleMute();
    // Update the sound toggle button label (index 1)
    this.nav.texts[1].setText(`Sound: ${muted ? 'OFF' : 'ON'}`);
  }

  private resumeGame(): void {
    this.scene.resume('GameScene');
    this.scene.resume('UIScene');
    this.scene.stop();
  }

  private restartLevel(): void {
    const gameScene = this.scene.get('GameScene');
    const level = (gameScene as { currentLevel?: number }).currentLevel ?? 1;
    this.scene.stop('UIScene');
    this.scene.stop('GameScene');
    getSoundManager().stopMusic(0);
    this.scene.start('GameScene', { level });
  }

  private goToMainMenu(): void {
    this.scene.stop('UIScene');
    this.scene.stop('GameScene');
    getSoundManager().stopMusic(0);
    this.scene.start('MainMenuScene');
  }
}
