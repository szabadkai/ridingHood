extends CharacterBody2D
class_name Enemy

# Common enemy properties
@export var damage_amount: int = 1
@export var speed: float = 40.0
@export var acceleration: float = 5.0
@export var gravity: float = 700.0
@export var health: int = 1
@export var max_health: int = 3

# Movement and AI
var direction: int = 1
var is_alive: bool = true

# Signals
signal fight
signal flee
signal damage_player(damage_amount: int, knockback_direction: Vector2)
signal enemy_died

@onready var ray_cast_2d: RayCast2D = $RayCast2D
@onready var animated_sprite: AnimatedSprite2D = $AnimatedSprite2D

func _ready():
	set_up_direction(Vector2.UP)
	health = max_health
	add_to_group("enemy")

func _physics_process(delta):
	if not is_alive:
		return
		
	apply_gravity(delta)
	apply_ai()
	handle_movement(delta)
	move_and_slide()

func apply_gravity(delta):
	if not is_on_floor():
		velocity.y += gravity * delta

func apply_ai():
	if is_on_wall() or (ray_cast_2d and not ray_cast_2d.is_colliding()):
		flip()

func handle_movement(delta):
	velocity.x = move_toward(velocity.x, speed * direction, acceleration * delta)

func flip():
	direction *= -1
	scale.x *= -1
	# Reset horizontal velocity when changing direction to prevent flying off ledges
	velocity.x = 0

func apply_knockback(knockback_force: Vector2):
	velocity = knockback_force

func take_damage(damage: int):
	if not is_alive:
		return
		
	health -= damage
	health = max(0, health)
	
	# Visual feedback
	flash_effect()
	
	if health <= 0:
		die()

func flash_effect():
	if animated_sprite:
		var tween = create_tween()
		tween.tween_property(animated_sprite, "modulate", Color.RED, 0.1)
		await tween.finished
		tween = create_tween()
		tween.tween_property(animated_sprite, "modulate", Color.WHITE, 0.1)

func die():
	if not is_alive:
		return
		
	is_alive = false
	enemy_died.emit()
	
	print("Enemy died: ", name)
	
	# Stop movement and disable collisions
	velocity = Vector2.ZERO
	set_physics_process(false)
	
	# Disable collision detection
	if has_node("Area2D"):
		$Area2D.set_deferred("monitoring", false)
		$Area2D.set_deferred("monitorable", false)
	
	# Play death animation if available
	if animated_sprite and animated_sprite.sprite_frames:
		if animated_sprite.sprite_frames.has_animation("death"):
			print("Playing death animation")
			animated_sprite.play("death")
			await animated_sprite.animation_finished
		else:
			print("No death animation found, using fallback")
			# Fallback: fade out effect
			var tween = create_tween()
			tween.tween_property(animated_sprite, "modulate", Color.TRANSPARENT, 0.5)
			await tween.finished
	else:
		print("No animated sprite found, using fallback")
		# Fallback: wait a moment then disappear
		await get_tree().create_timer(0.5).timeout
	
	# Remove from scene
	print("Removing enemy from scene: ", name)
	queue_free()

func _on_area_2d_body_entered(body):
	if body.name == "Player" and is_alive:
		fight.emit()
		# Calculate knockback direction (away from enemy)
		var knockback_direction = (body.global_position - global_position).normalized()
		# Add some upward force for better knockback effect
		knockback_direction.y = -0.5
		knockback_direction = knockback_direction.normalized()
		
		# Emit damage signal
		damage_player.emit(damage_amount, knockback_direction)

func _on_area_2d_body_exited(body):
	if body.name == "Player":
		flee.emit()
