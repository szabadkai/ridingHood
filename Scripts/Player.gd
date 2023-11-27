### Player.gd

extends CharacterBody2D

#player movement variables
@export var speed = 200
@export var gravity = 100
@export var jump_height = -150

#movement states
var is_attacking = false
var is_climbing = false

#movement and physics
func _physics_process(delta):
	# vertical movement velocity (down)
	velocity.y += gravity * delta
	# horizontal movement processing (left, right)
	horizontal_movement()
	
	#applies movement
	move_and_slide() 
	
	player_animations()   
		
#horizontal movement calculation
func horizontal_movement():
	# if keys are pressed it will return 1 for ui_right, -1 for ui_left, and 0 for neither
	var horizontal_input = Input.get_action_strength("ui_right") - Input.get_action_strength("ui_left")
	# horizontal velocity which moves player left or right based on input
	velocity.x = horizontal_input * speed

#animations
func player_animations():
	if velocity.y == 0:
		$AnimatedSprite2D.play("default")
	#on left (add is_action_just_released so you continue running after jumping)
	if Input.is_action_pressed("ui_left") || Input.is_action_just_released("ui_jump"):
		$AnimatedSprite2D.flip_h = true
		$AnimatedSprite2D.play("run")
	#on right (add is_action_just_released so you continue running after jumping)
	if Input.is_action_pressed("ui_right") || Input.is_action_just_released("ui_jump"):
		$AnimatedSprite2D.flip_h = false
		$AnimatedSprite2D.play("run")
	
	if !Input.is_anything_pressed():
		$AnimatedSprite2D.play("default")
		
	if velocity.y < 0:
		$AnimatedSprite2D.play("jump")
	
	if velocity.y > 0:
		$AnimatedSprite2D.play("fall")
		


#singular input captures
func _input(event):
	#on attack
	if event.is_action_pressed("ui_attack"):
		is_attacking = true


	#on jump
	if event.is_action_pressed("ui_jump") and is_on_floor():
		velocity.y = jump_height
	

#reset our animation variables
func _on_animated_sprite_2d_animation_finished():
	is_attacking = false
	is_climbing = false	

