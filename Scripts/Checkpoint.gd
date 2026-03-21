extends Area2D

signal checkpoint_activated(checkpoint: Area2D)

@export var respawn_offset := Vector2.ZERO
@export var restore_full_health := true

var is_active := false

func _ready():
	body_entered.connect(_on_body_entered)

func _on_body_entered(body: Node):
	if not body or not body.is_in_group("player"):
		return
	_activate(body)

func _activate(player):
	var target_position = global_position + respawn_offset
	if player.has_method("set_checkpoint"):
		player.set_checkpoint(target_position)
	if restore_full_health and player.has_method("restore_health") and player.has_method("get_max_health"):
		player.restore_health(player.get_max_health())
	var was_active = is_active
	is_active = true
	if not was_active:
		checkpoint_activated.emit(self)
