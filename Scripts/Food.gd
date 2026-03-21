extends Area2D

@export var health_restore_amount: int = 1

func _ready():
  # Connect to body entered signal for better collision detection
  body_entered.connect(_on_body_entered)
  
  # Start floating animation
  start_floating_animation()

func _on_body_entered(body):
  # Check if the body is the player
  if body.name == "Player" and body.has_method("restore_health"):
    # Restore health to the player
    body.restore_health(health_restore_amount)
    print("Player picked up food! Health restored by: ", health_restore_amount)
    
    # Play pickup effect (optional)
    play_pickup_effect()
    
    # Remove the food
    queue_free()

func play_pickup_effect():
  # Create a simple pickup effect
  var tween = create_tween()
  tween.set_parallel(true)
  
  # Scale up slightly then disappear
  tween.tween_property($Sprite2D, "scale", Vector2(1.5, 1.5), 0.1)
  tween.tween_property($Sprite2D, "modulate", Color.TRANSPARENT, 0.2)
  
  await tween.finished

func start_floating_animation():
  # Create a gentle floating animation
  var tween = create_tween()
  tween.set_loops()  # Loop forever
  
  # Move up and down slightly
  tween.tween_property($Sprite2D, "position:y", $Sprite2D.position.y - 3, 1.0)
  tween.tween_property($Sprite2D, "position:y", $Sprite2D.position.y, 1.0)
