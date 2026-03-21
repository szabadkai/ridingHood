// Typed event bus - replaces Godot signals for decoupled communication
import Phaser from 'phaser';

export const EventBus = new Phaser.Events.EventEmitter();

// Event name constants
export const Events = {
  PLAYER_DAMAGED: 'player:damaged',
  PLAYER_HEALED: 'player:healed',
  PLAYER_DIED: 'player:died',
  PLAYER_RESPAWNED: 'player:respawned',
  HEALTH_CHANGED: 'health:changed',
  METER_CHANGED: 'meter:changed',
  FORM_CHANGED: 'form:changed',
  ENEMY_DAMAGED: 'enemy:damaged',
  ENEMY_KILLED: 'enemy:killed',
  CHECKPOINT_ACTIVATED: 'checkpoint:activated',
  BOSS_KILLED: 'boss:killed',
  CAMERA_SHAKE: 'camera:shake',
  CAMERA_ZOOM: 'camera:zoom',
  METER_REACHED_THRESHOLD: 'meter:reached_threshold',
} as const;
