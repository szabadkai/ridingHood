### Playerge.gd

extends CharacterBody2D

@export var gravity = 700.0
@export var speed = 100.0
@export var acceleration = 800.0
@export var friction = 1000.0
@export var jump_velocity = -250.0
@export var gravity_scale = 1.0
@export var air_resistance = 200.0
@export var air_acceleration = 400.0


#movement states
var is_attacking = false
var is_climbing = false

#movement and physics
func _physics_process(delta):
    apply_gravity(delta)
    handle_jump()

    var input_axis = Input.get_axis("ui_left", "ui_right")
    handle_acceleration(input_axis, delta)
    handle_air_acceleration(input_axis, delta)
    apply_friction(input_axis, delta)
    apply_air_resistance(input_axis, delta)
    var was_on_floor = is_on_floor()


    move_and_slide()
    var just_left_ledge = was_on_floor and not is_on_floor() and velocity.y >= 0

    if just_left_ledge:
        $Timer.start()
    
    update_animations(input_axis)
        
func handle_acceleration(input_axis, delta):
    if not is_on_floor(): return
    if input_axis != 0:
        velocity.x = move_toward(velocity.x, speed * input_axis, acceleration * delta)

func handle_air_acceleration(input_axis, delta):
    if is_on_floor(): return
    if input_axis != 0:
        velocity.x = move_toward(velocity.x, speed * input_axis, air_acceleration * delta)

func apply_friction(input_axis, delta):
    if input_axis == 0 and is_on_floor():
        velocity.x = move_toward(velocity.x, 0, friction * delta)

func apply_air_resistance(input_axis, delta):
    if input_axis == 0 and not is_on_floor():
        velocity.x = move_toward(velocity.x, 0, air_resistance * delta)


func handle_jump():
    if is_on_floor() or $Timer.time_left > 0.0:
        if Input.is_action_just_pressed("ui_jump"):
            velocity.y = jump_velocity
            $Timer.stop()
    elif not is_on_floor():
        if Input.is_action_just_released("ui_jump") and velocity.y < jump_velocity / 2:
            velocity.y =jump_velocity / 2

func apply_gravity(delta):
    if not is_on_floor():
        velocity.y += gravity * delta
        
        
#horizontal movement calculation
func horizontal_movement():
    # if keys are pressed it will return 1 for ui_right, -1 for ui_left, and 0 for neither
    var horizontal_input = Input.get_action_strength("ui_right") - Input.get_action_strength("ui_left")
    # horizontal velocity which moves player left or right based on input
    velocity.x = horizontal_input * speed

func update_animations(input_axis):
    if input_axis != 0:
        $AnimatedSprite2D.flip_h = (input_axis < 0)
        $AnimatedSprite2D.play("run")
    else:
        $AnimatedSprite2D.play("default")
    
    if not is_on_floor():
        if velocity.y < 0:
            $AnimatedSprite2D.play("jump")
        else: 
            $AnimatedSprite2D.play("fall")
        
    
