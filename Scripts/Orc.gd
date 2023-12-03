extends CharacterBody2D
var direction = 1 
@onready var timer = $Timer

# Called when the node enters the scene tree for the first time.
func _ready():
	timer.start()


# Called every frame. 'delta' is the elapsed time since the previous frame.
func _physics_process(delta):
	apply_gravity(delta)
	apply_ai()
	velocity.x = move_toward(velocity.x, 10 * direction, 200 * delta)
	move_and_slide()


	
func apply_gravity(delta):
	if not is_on_floor():
		velocity.y += 700 * delta

func apply_ai():
	if timer.time_left <= .01:
		timer.start()
		direction *= -1
		$AnimatedSprite2D.scale.x = direction
 
