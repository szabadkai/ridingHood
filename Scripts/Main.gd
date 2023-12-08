extends Node2D

@onready var player = $Player
@onready var orc = $Orc
@onready var camera = $Player/Camera2D
@onready var enemies = $Enemies

func _ready():
	for enemy in enemies.get_children():
		enemy.fight.connect(_on_enemy_fight)
		enemy.flee.connect(_on_enemy_flee)
		
func _physics_process(delta):
	if player.position.y >180:
		get_tree().reload_current_scene()


func _on_enemy_fight():
	camera.zoom = Vector2(2,2)

func _on_enemy_flee():
	camera.zoom= Vector2.ONE
