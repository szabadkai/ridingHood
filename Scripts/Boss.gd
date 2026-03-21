extends Enemy

# Boss-specific properties
@export var boss_speed: float = 50.0
@export var boss_damage: int = 2
@export var boss_health: int = 10
@export var boss_max_health: int = 10
@export var boss_scale: float = 1.2

# Boss AI states
enum BossState {IDLE, CHASE, ATTACK, RETREAT}
var current_state: BossState = BossState.IDLE
var player: CharacterBody2D = null
var attack_cooldown: float = 2.0
var attack_timer: float = 0.0

func _ready():
  super._ready()
  # Override base properties for boss
  speed = boss_speed
  damage_amount = boss_damage
  health = boss_health
  max_health = boss_health
  
  # Scale the boss to be larger
  scale = Vector2(boss_scale, boss_scale)
  
  # Find the player
  player = get_tree().get_first_node_in_group("player")
  if not player:
    # Fallback: search for player by name
    player = get_tree().get_first_node_in_group("Player")
    if not player:
      # Final fallback: search by node name
      player = get_tree().get_first_node_in_group("Player")
  
  print("Boss initialized: ", name)
  print("Boss health: ", health, "/", max_health)
  print("Boss speed: ", speed)
  print("Boss damage: ", damage_amount)
  print("Player found: ", player != null)

func _physics_process(delta):
  if not is_alive:
    return
  
  attack_timer -= delta
  
  var previous_state = current_state
  
  match current_state:
    BossState.IDLE:
      handle_idle_state()
    BossState.CHASE:
      handle_chase_state(delta)
    BossState.ATTACK:
      handle_attack_state(delta)
    BossState.RETREAT:
      handle_retreat_state(delta)
  
  # Log state changes
  if previous_state != current_state:
    print("Boss state changed from ", BossState.keys()[previous_state], " to ", BossState.keys()[current_state])
  
  super._physics_process(delta)

func handle_idle_state():
  if player and global_position.distance_to(player.global_position) < 200:
    current_state = BossState.CHASE
    print("Boss detected player nearby, switching to CHASE")
  elif player:
    var distance = global_position.distance_to(player.global_position)
    print("Boss IDLE - Distance to player: ", distance)

func handle_chase_state(delta):
  if not player:
    current_state = BossState.IDLE
    print("Boss lost player reference, switching to IDLE")
    return
  
  var distance_to_player = global_position.distance_to(player.global_position)
  print("Boss CHASE - Distance to player: ", distance_to_player, " Attack timer: ", attack_timer)
  
  if distance_to_player < 50 and attack_timer <= 0:
    current_state = BossState.ATTACK
    attack_timer = attack_cooldown
    print("Boss in attack range, switching to ATTACK")
  elif distance_to_player > 300:
    current_state = BossState.IDLE
    print("Player too far, switching to IDLE")
  else:
    # Move towards player
    var direction_to_player = (player.global_position - global_position).normalized()
    velocity.x = move_toward(velocity.x, speed * direction_to_player.x, acceleration * delta)
    print("Boss moving towards player, velocity: ", velocity.x)
    
    # Flip sprite based on movement direction
    if velocity.x != 0:
      scale.x = boss_scale * sign(velocity.x)

func handle_attack_state(delta):
  if not player:
    current_state = BossState.IDLE
    print("Boss lost player during attack, switching to IDLE")
    return
  
  # Stop moving during attack
  velocity.x = move_toward(velocity.x, 0, acceleration * delta)
  print("Boss ATTACK - Attack timer: ", attack_timer)
  
  # Attack animation or effect could go here
  if animated_sprite and animated_sprite.sprite_frames:
    if animated_sprite.sprite_frames.has_animation("attack"):
      animated_sprite.play("attack")
      print("Boss playing attack animation")
  
  # After attack, retreat
  if attack_timer <= 0:
    current_state = BossState.RETREAT
    print("Boss attack finished, switching to RETREAT")

func handle_retreat_state(delta):
  if not player:
    current_state = BossState.IDLE
    print("Boss lost player during retreat, switching to IDLE")
    return
  
  var distance_to_player = global_position.distance_to(player.global_position)
  print("Boss RETREAT - Distance to player: ", distance_to_player)
  
  if distance_to_player > 150:
    current_state = BossState.CHASE
    print("Boss retreated far enough, switching to CHASE")
  else:
    # Move away from player
    var direction_away = (global_position - player.global_position).normalized()
    velocity.x = move_toward(velocity.x, speed * direction_away.x, acceleration * delta)
    print("Boss moving away from player, velocity: ", velocity.x)
    
    # Flip sprite based on movement direction
    if velocity.x != 0:
      scale.x = boss_scale * sign(velocity.x)

# Override the base damage function to add boss-specific behavior
func take_damage(damage: int):
  print("Boss took damage: ", damage, " Health: ", health, " -> ", health - damage)
  super.take_damage(damage)
  
  # Boss gets more aggressive when damaged
  if health < max_health / 2.0:
    speed = boss_speed * 1.5
    attack_cooldown = 1.0
    print("Boss enraged! Speed increased to: ", speed, " Attack cooldown: ", attack_cooldown)
  
  # Boss enrages at low health
  if health < max_health / 4.0:
    speed = boss_speed * 2.0
    attack_cooldown = 0.5
    damage_amount = boss_damage * 2
    print("Boss berserk! Speed: ", speed, " Damage: ", damage_amount, " Attack cooldown: ", attack_cooldown)

# Override the base death function for boss-specific death behavior
func die():
  if not is_alive:
    return
    
  is_alive = false
  enemy_died.emit()
  
  print("Boss died: ", name)
  
  # Stop movement and disable collisions
  velocity = Vector2.ZERO
  set_physics_process(false)
  
  # Disable collision detection
  if has_node("Area2D"):
    $Area2D.monitoring = false
    $Area2D.monitorable = false
  
  # Boss death effect - red flash then death animation
  if animated_sprite:
    animated_sprite.modulate = Color.RED
    await get_tree().create_timer(0.2).timeout
    animated_sprite.modulate = Color.WHITE
  
  # Play death animation if available
  if animated_sprite and animated_sprite.sprite_frames:
    if animated_sprite.sprite_frames.has_animation("death"):
      print("Playing boss death animation")
      animated_sprite.play("death")
      await animated_sprite.animation_finished
    else:
      print("No boss death animation found, using fallback")
      # Fallback: fade out effect
      var tween = create_tween()
      tween.tween_property(animated_sprite, "modulate", Color.TRANSPARENT, 1.0)
      await tween.finished
  else:
    print("No boss animated sprite found, using fallback")
    # Fallback: wait a moment then disappear
    await get_tree().create_timer(1.0).timeout
  
  # Remove from scene
  print("Removing boss from scene: ", name)
  queue_free()

# Area2D collision detection for player damage - using same method as base Enemy class
func _on_area_2d_body_entered(body):
  print("Boss Area2D detected body: ", body.name, " - Is alive: ", is_alive)
  if body.name == "Player" and is_alive:
    print("Boss damaging player! Damage: ", damage_amount)
    fight.emit()
    # Calculate knockback direction (away from boss)
    var knockback_direction = (body.global_position - global_position).normalized()
    # Add some upward force for better knockback effect
    knockback_direction.y = -0.5
    knockback_direction = knockback_direction.normalized()
    
    # Apply damage directly to player (same as base Enemy class)
    body.take_damage(damage_amount, knockback_direction)

func _on_area_2d_body_exited(body):
  print("Boss Area2D body exited: ", body.name)
  if body.name == "Player":
    flee.emit() 
