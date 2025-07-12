extends Enemy

# Orc-specific properties
@export var orc_speed: float = 50.0
@export var orc_damage: int = 1

func _ready():
	super._ready()
	# Override base properties for orc
	speed = orc_speed
	damage_amount = orc_damage
