extends Control

func _ready():
	# Connect button signals
	$VBoxContainer/StartButton.pressed.connect(_on_start_button_pressed)
	$VBoxContainer/ExitButton.pressed.connect(_on_exit_button_pressed)

func _on_start_button_pressed():
	print("Starting game...")
	# Change to the main game scene
	get_tree().change_scene_to_file("res://Scenes/Main.tscn")

func _on_exit_button_pressed():
	print("Exiting game...")
	# Quit the game
	get_tree().quit() 
