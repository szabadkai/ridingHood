### Player.gd

extends CharacterBody2D

# Add player to a group for easy access by enemies
func _ready():
	add_to_group("player")

signal health_changed(current_health, max_health)
signal player_died

@export var gravity = 700.0
@export var speed = 100.0
@export var acceleration = 800.0
@export var friction = 1000.0
@export var jump_velocity = -250.0
@export var gravity_scale = 1.0
@export var air_resistance = 200.0
@export var air_acceleration = 400.0
@export var max_health = 3
@export var knockback_force = 300.0
@export var invincibility_duration = .3
@onready var default_animation = $AnimatedSprite2D
@onready var attack_animation = $AttackAnimation

#movement states
var is_attacking = false
var is_climbing = false
var is_invincible = false
var current_health = max_health

#movement and physics
func _physics_process(delta):
	is_attacking = Input.is_action_pressed("ui_attack")
	apply_gravity(delta)
	handle_jump()
	handle_attack()
	var input_axis = Input.get_axis("ui_left", "ui_right")
	handle_acceleration(input_axis, delta)
	handle_air_acceleration(input_axis, delta)
	apply_friction(input_axis, delta)
	apply_air_resistance(input_axis, delta)
	var was_on_floor = is_on_floor()

	move_and_slide()
	var just_left_ledge = was_on_floor and not is_on_floor() and velocity.y >= 0

	if just_left_ledge:
		$Timer.start()
	
	update_animations(input_axis)
	
# Damage and knockback system
func take_damage(damage_amount: int, knockback_direction: Vector2):
	if is_invincible:
		return
		
	current_health -= damage_amount
	current_health = max(0, current_health)
	
	# Apply knockback
	velocity = knockback_direction * knockback_force
	
	# Start invincibility frames
	start_invincibility()
	
	# Visual feedback (flash effect)
	flash_effect()
	
	# Emit health changed signal
	health_changed.emit(current_health, max_health)
	
	print("Player took damage! Health: ", current_health)
	
	if current_health <= 0:
		die()

func start_invincibility():
	is_invincible = true
	$InvincibilityTimer.start(invincibility_duration)

func _on_invincibility_timer_timeout():
	is_invincible = false

func flash_effect():
	if not is_invincible:
		return
	
	# Create a more robust flash effect
	var tween = create_tween()
	tween.set_parallel(true)
	
	# Flash both animations
	tween.tween_property(default_animation, "modulate", Color.RED, 0.1)
	tween.tween_property(attack_animation, "modulate", Color.RED, 0.1)
	
	await tween.finished
	
	tween = create_tween()
	tween.set_parallel(true)
	tween.tween_property(default_animation, "modulate", Color.WHITE, 0.1)
	tween.tween_property(attack_animation, "modulate", Color.WHITE, 0.1)
	
	# Repeat the flash effect during invincibility
	if is_invincible:
		await get_tree().create_timer(0.2).timeout
		if is_invincible:  # Check again in case invincibility ended
			flash_effect()

func die():
	print("Player died!")
	player_died.emit()
	# Add death logic here (restart level, game over screen, etc.)
	# For now, just respawn at origin
	position = Vector2.ZERO
	current_health = max_health
	health_changed.emit(current_health, max_health)

func get_health():
	return current_health

func get_max_health():
	return max_health
		
func handle_attack():
	if  is_attacking:
		default_animation.visible = false
		attack_animation.visible = true	
	else:
		default_animation.visible = true
		attack_animation.visible = false
		attack_animation.play('attack2')
	
func handle_acceleration(input_axis, delta):
	if not is_on_floor(): return
	if input_axis != 0:
		velocity.x = move_toward(velocity.x, speed * input_axis, acceleration * delta)

func handle_air_acceleration(input_axis, delta):
	if is_on_floor(): return
	if input_axis != 0:
		velocity.x = move_toward(velocity.x, speed * input_axis, air_acceleration * delta)

func apply_friction(input_axis, delta):
	if input_axis == 0 and is_on_floor():
		velocity.x = move_toward(velocity.x, 0, friction * delta)

func apply_air_resistance(input_axis, delta):
	if input_axis == 0 and not is_on_floor():
		velocity.x = move_toward(velocity.x, 0, air_resistance * delta)


func handle_jump():
	if is_on_floor() or $Timer.time_left > 0.0:
		if Input.is_action_just_pressed("ui_jump"):
			velocity.y = jump_velocity
			$Timer.stop()
	elif not is_on_floor():
		if Input.is_action_just_released("ui_jump") and velocity.y < jump_velocity / 2:
			velocity.y =jump_velocity / 2

func apply_gravity(delta):
	if not is_on_floor():
		velocity.y += gravity * delta
		
		
#horizontal movement calculation
func horizontal_movement():
	# if keys are pressed it will return 1 for ui_right, -1 for ui_left, and 0 for neither
	var horizontal_input = Input.get_action_strength("ui_right") - Input.get_action_strength("ui_left")
	# horizontal velocity which moves player left or right based on input
	velocity.x = horizontal_input * speed

func update_animations(input_axis):
	if input_axis != 0:
		default_animation.flip_h = (input_axis < 0)
		attack_animation.flip_h = (input_axis < 0)
		attack_animation.offset =   Vector2(-12,0) if input_axis < 0 else Vector2(0,0)
		default_animation.play("run")
	else:
		default_animation.play("default")
	
	if not is_on_floor():
		if velocity.y < 0:
			default_animation.play("jump")
		else: 
			default_animation.play("fall")
		
	
