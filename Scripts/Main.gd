extends Node2D

@onready var player = $Player
@onready var orc = $Orc


func _physics_process(delta):
	if player.position.y >180:
		get_tree().reload_current_scene()

