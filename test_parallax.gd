# Test script to verify background textures can be loaded
extends Node

func _ready():
	print("Testing background texture loading...")
	
	var texture_paths = [
		"res://Assets/Background/1.png",
		"res://Assets/Background/2.png",
		"res://Assets/Background/3.png",
		"res://Assets/Background/4.png",
		"res://Assets/Background/5.png",
		"res://Assets/Background/6.png"
	]
	
	for path in texture_paths:
		var texture = load(path)
		if texture:
			print("✓ Loaded: ", path, " (", texture.get_size(), ")")
		else:
			print("✗ Failed to load: ", path)
	
	print("Texture loading test complete!") 