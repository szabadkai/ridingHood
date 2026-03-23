import Phaser from 'phaser';

/**
 * Sound keys and asset paths for preloading.
 * All volumes are normalized so sounds from different packs
 * sit at a consistent level relative to each other.
 */
export const SOUND_ASSETS = {
  // Player SFX
  jump:            { path: 'assets/audio/sfx/jump.wav',            volume: 0.35 },
  land:            { path: 'assets/audio/sfx/land.wav',            volume: 0.2  },
  attack1:         { path: 'assets/audio/sfx/attack1.ogg',         volume: 0.4  },
  attack2:         { path: 'assets/audio/sfx/attack2.ogg',         volume: 0.4  },
  attack3:         { path: 'assets/audio/sfx/attack3.ogg',         volume: 0.4  },
  player_hurt:     { path: 'assets/audio/sfx/player_hurt.wav',     volume: 0.45 },
  player_death:    { path: 'assets/audio/sfx/player_death.ogg',    volume: 0.5  },

  // Transform
  transform_dark:  { path: 'assets/audio/sfx/transform_dark.ogg',  volume: 0.5  },
  transform_light: { path: 'assets/audio/sfx/transform_light.ogg', volume: 0.45 },

  // Evasion
  dash:            { path: 'assets/audio/sfx/dash.ogg',            volume: 0.3  },
  roll:            { path: 'assets/audio/sfx/roll.ogg',            volume: 0.3  },

  // Enemy
  enemy_hurt:      { path: 'assets/audio/sfx/enemy_hurt.ogg',      volume: 0.35 },
  enemy_death:     { path: 'assets/audio/sfx/enemy_death.ogg',     volume: 0.4  },

  // Boss
  boss_roar:       { path: 'assets/audio/sfx/boss_roar.ogg',       volume: 0.5  },
  boss_attack:     { path: 'assets/audio/sfx/boss_attack.ogg',     volume: 0.45 },

  // Pickups
  pickup_food:     { path: 'assets/audio/sfx/pickup_food.ogg',     volume: 0.35 },
  pickup_essence:  { path: 'assets/audio/sfx/pickup_essence.ogg',  volume: 0.4  },

  // World
  checkpoint:      { path: 'assets/audio/sfx/checkpoint.ogg',      volume: 0.4  },
  meter_full:      { path: 'assets/audio/sfx/meter_full.ogg',      volume: 0.45 },

  // UI
  ui_select:       { path: 'assets/audio/sfx/ui_select.ogg',       volume: 0.25 },
  ui_confirm:      { path: 'assets/audio/sfx/ui_confirm.ogg',      volume: 0.3  },

  // Music
  music_forest:    { path: 'assets/audio/music/forest_theme.ogg',   volume: 0.25 },
  music_boss:      { path: 'assets/audio/music/boss_theme.ogg',     volume: 0.3  },
} as const;

export type SoundKey = keyof typeof SOUND_ASSETS;

/**
 * Centralized sound manager that uses Phaser's audio system.
 * Handles volume normalization across different audio packs.
 */
export class SoundManager {
  private scene: Phaser.Scene | null = null;
  private muted: boolean = false;
  private masterVolume: number = 1.0;
  private currentMusic: Phaser.Sound.BaseSound | null = null;
  private currentMusicKey: string = '';
  private attackCombo: number = 0;

  /** Call in PreloadScene.preload() to load all audio assets */
  static preloadAll(scene: Phaser.Scene): void {
    for (const [key, asset] of Object.entries(SOUND_ASSETS)) {
      scene.load.audio(key, asset.path);
    }
  }

  /** Bind to an active scene so we can play sounds through it */
  setScene(scene: Phaser.Scene): void {
    this.scene = scene;
  }

  private play(key: SoundKey, extraConfig?: Phaser.Types.Sound.SoundConfig): void {
    if (!this.scene || this.muted) return;
    const asset = SOUND_ASSETS[key];
    const volume = asset.volume * this.masterVolume;
    this.scene.sound.play(key, { volume, ...extraConfig });
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.muted) {
      this.scene?.sound.setMute(true);
    } else {
      this.scene?.sound.setMute(false);
    }
    return this.muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  setMasterVolume(vol: number): void {
    this.masterVolume = Phaser.Math.Clamp(vol, 0, 1);
    // Update running music volume
    if (this.currentMusic && this.currentMusicKey) {
      const asset = SOUND_ASSETS[this.currentMusicKey as SoundKey];
      if (asset && 'setVolume' in this.currentMusic) {
        (this.currentMusic as Phaser.Sound.WebAudioSound).setVolume(asset.volume * this.masterVolume);
      }
    }
  }

  // ── Music ───────────────────────────────────────────────────

  playMusic(key: 'music_forest' | 'music_boss'): void {
    if (!this.scene) return;
    if (this.currentMusicKey === key && this.currentMusic?.isPlaying) return;
    this.stopMusic();
    const asset = SOUND_ASSETS[key];
    this.currentMusic = this.scene.sound.add(key, {
      volume: asset.volume * this.masterVolume,
      loop: true,
    });
    this.currentMusic.play();
    this.currentMusicKey = key;
  }

  stopMusic(fadeMs: number = 500): void {
    if (!this.currentMusic || !this.scene) {
      this.currentMusic = null;
      this.currentMusicKey = '';
      return;
    }
    if (fadeMs > 0 && this.currentMusic.isPlaying) {
      this.scene.tweens.add({
        targets: this.currentMusic,
        volume: 0,
        duration: fadeMs,
        onComplete: () => {
          this.currentMusic?.stop();
          this.currentMusic?.destroy();
          this.currentMusic = null;
          this.currentMusicKey = '';
        },
      });
    } else {
      this.currentMusic.stop();
      this.currentMusic.destroy();
      this.currentMusic = null;
      this.currentMusicKey = '';
    }
  }

  crossfadeMusic(key: 'music_forest' | 'music_boss'): void {
    if (this.currentMusicKey === key) return;
    this.stopMusic(400);
    // Start new track slightly delayed so fade-out has started
    this.scene?.time.delayedCall(200, () => {
      this.playMusic(key);
    });
  }

  // ── Player SFX ──────────────────────────────────────────────

  playJump(): void { this.play('jump'); }
  playLand(): void { this.play('land'); }

  playAttack(): void {
    this.attackCombo = (this.attackCombo % 3) + 1;
    const key = `attack${this.attackCombo}` as SoundKey;
    this.play(key);
  }

  playPlayerHurt(): void { this.play('player_hurt'); }
  playDeath(): void { this.play('player_death'); }

  // ── Transform ───────────────────────────────────────────────

  playTransformToDark(): void { this.play('transform_dark'); }
  playTransformToLight(): void { this.play('transform_light'); }

  // ── Evasion ─────────────────────────────────────────────────

  playDash(): void { this.play('dash'); }
  playRoll(): void { this.play('roll'); }

  // ── Enemy ───────────────────────────────────────────────────

  playEnemyHit(): void { this.play('enemy_hurt'); }
  playEnemyDeath(): void { this.play('enemy_death'); }

  // ── Boss ────────────────────────────────────────────────────

  playBossRoar(): void { this.play('boss_roar'); }
  playBossAttack(): void { this.play('boss_attack'); }

  // ── Pickups & World ─────────────────────────────────────────

  playPickupFood(): void { this.play('pickup_food'); }
  playPickupEssence(): void { this.play('pickup_essence'); }
  playCheckpoint(): void { this.play('checkpoint'); }
  playMeterFull(): void { this.play('meter_full'); }

  // ── UI ──────────────────────────────────────────────────────

  playMenuSelect(): void { this.play('ui_select'); }
  playMenuConfirm(): void { this.play('ui_confirm'); }
}

// Singleton
let instance: SoundManager | null = null;

export function getSoundManager(): SoundManager {
  if (!instance) {
    instance = new SoundManager();
  }
  return instance;
}
