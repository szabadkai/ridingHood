extends Control

func _ready():
	print("Death screen loaded!")
	# Connect button signals
	$VBoxContainer/RestartButton.pressed.connect(_on_restart_button_pressed)
	$VBoxContainer/MainMenuButton.pressed.connect(_on_main_menu_button_pressed)
	print("Death screen buttons connected")

func _on_restart_button_pressed():
	print("Restarting game...")
	# Unpause the game
	get_tree().paused = false
	# Change to the main game scene
	get_tree().change_scene_to_file("res://Scenes/Main.tscn")

func _on_main_menu_button_pressed():
	print("Going to main menu...")
	# Unpause the game
	get_tree().paused = false
	# Change to the main menu scene
	get_tree().change_scene_to_file("res://Scenes/MainMenu.tscn") 
