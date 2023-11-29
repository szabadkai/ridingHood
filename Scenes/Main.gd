extends Node2D

@onready var player = $Player


func _physics_process(delta):
	#c(amera_2d.position.x = player.position.x
	if player.position.y >180:
		get_tree().reload_current_scene()
