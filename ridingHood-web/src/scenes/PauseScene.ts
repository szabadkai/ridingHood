import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { getSoundManager } from '../systems/SoundManager';
import { COLORS, drawPanel, createMenuButtons, createTitle, createDivider, createOverlay, MenuNav } from '../ui/MenuHelper';
import { pixelText } from '../ui/PixelText';

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
    drawPanel(this, cx, cy, 320, 260, 51);

    // Title
    createTitle(this, cx, cy - 96, 'Paused', '20px', COLORS.highlightAlt, 52);

    // Divider
    createDivider(this, cy - 68, 240, 52);

    // Buttons
    const soundLabel = () => `Sound: ${sound.isMuted() ? 'OFF' : 'ON'}`;

    this.nav = createMenuButtons(this, cx, cy - 24, 36, [
      { label: 'Resume', onClick: () => this.resumeGame() },
      { label: soundLabel(), onClick: () => this.toggleSound() },
      { label: 'Restart Level', onClick: () => this.restartLevel() },
      { label: 'Main Menu', onClick: () => this.goToMainMenu(), color: COLORS.textDim },
    ], 52);

    // Controls hint
    pixelText(this, cx, cy + 112, 'ESC resume / M toggle sound', 'dim', 52);

    // Extra keyboard shortcuts
    this.input.keyboard!.on('keydown-ESC', () => this.resumeGame());
    this.input.keyboard!.on('keydown-P', () => this.resumeGame());
    this.input.keyboard!.on('keydown-M', () => this.toggleSound());
  }

  private toggleSound(): void {
    const muted = getSoundManager().toggleMute();
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
