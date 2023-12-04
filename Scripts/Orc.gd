extends CharacterBody2D
var direction = 1 

@onready var ray_cast_2d = $RayCast2D



# Called when the node enters the scene tree for the first time.
func _ready():
	set_up_direction(Vector2.UP)

func _physics_process(delta):
	apply_gravity(delta)
	apply_ai()
	velocity.x = move_toward(velocity.x, 10 * direction, 200 * delta)
	move_and_slide()

func apply_gravity(delta):
	if not is_on_floor():
		velocity.y += 700 * delta

func apply_ai():
	if is_on_wall() or not ray_cast_2d.is_colliding():
		flip()
		
 
func flip():
	direction *= -1
	scale.x *= -1
