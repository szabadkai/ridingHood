# Damage and Knockback System

This document describes the damage and knockback mechanics implemented in the game.

## Overview

When the player touches an enemy, the player takes damage and gets knocked back. The system includes:

- Health system with visual feedback
- Invincibility frames after taking damage
- Knockback physics
- Health UI display

## Components

### Player Script (`Scripts/Player.gd`)

**New Properties:**
- `max_health`: Maximum health points (default: 100)
- `knockback_force`: Strength of knockback (default: 300.0)
- `invincibility_duration`: Duration of invincibility frames (default: 1.0)

**New Functions:**
- `take_damage(damage_amount, knockback_direction)`: Handles damage and knockback
- `start_invincibility()`: Activates invincibility frames
- `flash_effect()`: Visual feedback when taking damage
- `die()`: Handles player death
- `get_health()` / `get_max_health()`: Health getters

**New Signals:**
- `health_changed(current_health, max_health)`: Emitted when health changes
- `player_died`: Emitted when player dies

### Enemy Script (`Scripts/Orc.gd`)

**New Properties:**
- `damage_amount`: Damage dealt to player (default: 20)

**New Signal:**
- `damage_player(damage_amount, knockback_direction)`: Emitted when touching player

**Enhanced Functions:**
- `_on_area_2d_body_entered()`: Now calculates knockback direction and emits damage signal

### Main Script (`Scripts/Main.gd`)

**New Functions:**
- `update_health_display()`: Updates the health UI
- `_on_player_health_changed()`: Handles health UI updates
- `_on_player_died()`: Handles player death (restarts scene)

## How It Works

1. **Collision Detection**: The enemy's Area2D detects when the player enters
2. **Damage Calculation**: Enemy calculates knockback direction (away from enemy + upward force)
3. **Signal Emission**: Enemy emits `damage_player` signal with damage amount and knockback direction
4. **Damage Application**: Main script receives signal and calls player's `take_damage()` function
5. **Health Update**: Player updates health and emits `health_changed` signal
6. **UI Update**: Main script updates health display
7. **Invincibility**: Player becomes invincible for a short duration
8. **Visual Feedback**: Player flashes red during invincibility

## Features

### Health System
- Player starts with 100 health
- Health is displayed as hearts in the UI
- When health reaches 0, player dies and scene restarts

### Knockback System
- Knockback direction is calculated from enemy to player
- Includes upward force for better visual effect
- Knockback force is configurable

### Invincibility Frames
- Player becomes invincible for 1 second after taking damage
- Prevents rapid damage from continuous contact
- Visual feedback with red flashing effect

### Visual Feedback
- Player sprite flashes red when taking damage
- Health UI updates in real-time
- Camera zoom effect when near enemies

## Configuration

You can adjust the following values in the Player script:
- `max_health`: Change starting health
- `knockback_force`: Adjust knockback strength
- `invincibility_duration`: Change invincibility duration

You can adjust damage amount in the Orc script:
- `damage_amount`: Change how much damage enemies deal

## Future Enhancements

Potential improvements to consider:
- Different damage types (fire, ice, etc.)
- Armor system to reduce damage
- Health potions or healing items
- More sophisticated death/respawn system
- Sound effects for damage and knockback
- Particle effects for damage
- Screen shake effect 