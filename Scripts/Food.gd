extends Area2D

func _ready():
	pass

func _physics_process(delta):
	var bodies = get_overlapping_bodies()
	if bodies.size() > 0: 
		queue_free()
