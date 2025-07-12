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

func _physics_process(delta):
	if not is_alive:
		return
	
	attack_timer -= delta
	
	match current_state:
		BossState.IDLE:
			handle_idle_state()
		BossState.CHASE:
			handle_chase_state(delta)
		BossState.ATTACK:
			handle_attack_state(delta)
		BossState.RETREAT:
			handle_retreat_state(delta)
	
	super._physics_process(delta)

func handle_idle_state():
	if player and global_position.distance_to(player.global_position) < 200:
		current_state = BossState.CHASE

func handle_chase_state(delta):
	if not player:
		current_state = BossState.IDLE
		return
	
	var distance_to_player = global_position.distance_to(player.global_position)
	
	if distance_to_player < 50 and attack_timer <= 0:
		current_state = BossState.ATTACK
		attack_timer = attack_cooldown
	elif distance_to_player > 300:
		current_state = BossState.IDLE
	else:
		# Move towards player
		var direction_to_player = (player.global_position - global_position).normalized()
		velocity.x = move_toward(velocity.x, speed * direction_to_player.x, acceleration * delta)
		
		# Flip sprite based on movement direction
		if velocity.x != 0:
			scale.x = boss_scale * sign(velocity.x)

func handle_attack_state(delta):
	if not player:
		current_state = BossState.IDLE
		return
	
	# Stop moving during attack
	velocity.x = move_toward(velocity.x, 0, acceleration * delta)
	
	# Attack animation or effect could go here
	if animated_sprite and animated_sprite.sprite_frames:
		if animated_sprite.sprite_frames.has_animation("attack"):
			animated_sprite.play("attack")
	
	# After attack, retreat
	if attack_timer <= 0:
		current_state = BossState.RETREAT

func handle_retreat_state(delta):
	if not player:
		current_state = BossState.IDLE
		return
	
	var distance_to_player = global_position.distance_to(player.global_position)
	
	if distance_to_player > 150:
		current_state = BossState.CHASE
	else:
		# Move away from player
		var direction_away = (global_position - player.global_position).normalized()
		velocity.x = move_toward(velocity.x, speed * direction_away.x, acceleration * delta)
		
		# Flip sprite based on movement direction
		if velocity.x != 0:
			scale.x = boss_scale * sign(velocity.x)

# Override the base damage function to add boss-specific behavior
func take_damage(damage: int):
	super.take_damage(damage)
	
	# Boss gets more aggressive when damaged
	if health < max_health / 2:
		speed = boss_speed * 1.5
		attack_cooldown = 1.0
	
	# Boss enrages at low health
	if health < max_health / 4:
		speed = boss_speed * 2.0
		attack_cooldown = 0.5
		damage_amount = boss_damage * 2

# Override the base death function for boss-specific death behavior
func die():
	is_alive = false
	enemy_died.emit()
	
	# Boss death effect
	if animated_sprite:
		animated_sprite.modulate = Color.RED
	
	# Wait a moment before disappearing
	await get_tree().create_timer(1.0).timeout
	
	# Remove from scene
	queue_free() 
