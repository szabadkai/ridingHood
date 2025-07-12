extends Node2D

@onready var player = $Player
@onready var orc = $Orc
@onready var camera = $Player/Camera2D
@onready var enemies = $Enemies
@onready var hearts_container = $CanvasLayer/Control/MarginContainer/Hearts/HBoxContainer
@onready var parallax_background = $Player/Camera2D/ParallaxBackground

func _ready():
	print("Main: _ready() called")
	
	for enemy in enemies.get_children():
		enemy.fight.connect(_on_enemy_fight)
		enemy.flee.connect(_on_enemy_flee)
		enemy.damage_player.connect(_on_enemy_damage_player)
	
	# Connect player signals
	player.health_changed.connect(_on_player_health_changed)
	player.player_died.connect(_on_player_died)
	
	# Setup parallax background
	print("Main: Setting up parallax background...")
	print("Player: ", player)
	print("Camera: ", camera)
	print("ParallaxBackground: ", parallax_background)
	
	if parallax_background:
		parallax_background.player = player
		parallax_background.camera = camera
		print("Main: Parallax background references set")
	else:
		print("Main: Warning - ParallaxBackground not found!")
	
	# Show the UI
	$CanvasLayer.visible = true
	
	# Initialize health display
	update_health_display()
	
	print("Main: Setup complete")
		
func _physics_process(delta):
	if player.position.y >180:
		get_tree().reload_current_scene()

func update_health_display():
	var current_health = player.get_health()
	var max_health = player.get_max_health()
	var heart_count = hearts_container.get_child_count()
	
	# Calculate how many hearts should be visible
	var visible_hearts = int(ceil(float(current_health) / float(max_health) * heart_count))
	
	for i in range(heart_count):
		var heart = hearts_container.get_child(i)
		heart.visible = (i < visible_hearts)

func _on_player_health_changed(current_health: int, max_health: int):
	update_health_display()

func _on_player_died():
	print("Player died - restarting scene...")
	get_tree().paused = true
	await get_tree().create_timer(1).timeout
	get_tree().paused = false
	get_tree().reload_current_scene()

func _on_enemy_fight():
	camera.zoom = Vector2(2,2)

func _on_enemy_flee():
	camera.zoom= Vector2.ONE

func _on_enemy_damage_player(damage_amount: int, knockback_direction: Vector2):
	player.take_damage(damage_amount, knockback_direction)
