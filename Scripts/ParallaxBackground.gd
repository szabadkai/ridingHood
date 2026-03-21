extends ParallaxBackground

# Simple and reliable parallax background system
# Uses Godot's built-in ParallaxBackground with ParallaxLayers

@export var player: CharacterBody2D
@export var camera: Camera2D
@export var filter_color: Color = Color(0.2, 0.2, 0.3, 0.3)  # Dark blue-gray with 30% opacity
@export var enable_filter: bool = true

# Background layer configurations
var layer_configs = [
	{
		"texture_path": "res://Assets/Background/1.png",
		"scroll_speed": 0.1,
		"z_index": -10
	},
	{
		"texture_path": "res://Assets/Background/2.png",
		"scroll_speed": 0.2,
		"z_index": -9
	},
	{
		"texture_path": "res://Assets/Background/3.png",
		"scroll_speed": 0.3,
		"z_index": -8
	},
	{
		"texture_path": "res://Assets/Background/4.png",
		"scroll_speed": 0.4,
		"z_index": -7
	},
	{
		"texture_path": "res://Assets/Background/5.png",
		"scroll_speed": 0.6,
		"z_index": -6
	},
	{
		"texture_path": "res://Assets/Background/6.png",
		"scroll_speed": 0.7,
		"z_index": -5
	}
]

func _ready():
	print("ParallaxBackground: _ready() called")
	
	# Wait a frame to ensure everything is loaded
	await get_tree().process_frame
	
	if not player or not camera:
		print("Warning: Player or Camera not assigned to ParallaxBackground")
		print("Player: ", player)
		print("Camera: ", camera)
		return
	
	print("ParallaxBackground: Setting up layers...")
	setup_parallax_layers()
	setup_filter()

func setup_parallax_layers():
	# Clear existing layers
	for child in get_children():
		if child is ParallaxLayer:
			child.queue_free()
	
	print("ParallaxBackground: Creating ", layer_configs.size(), " layers...")
	
	# Create new layers based on configuration
	for i in range(layer_configs.size()):
		var config = layer_configs[i]
		var texture = load(config.texture_path)
		if not texture:
			print("Warning: Could not load texture: ", config.texture_path)
			continue
			
		var parallax_layer = ParallaxLayer.new()
		parallax_layer.motion_scale = Vector2(config.scroll_speed, 0)
		parallax_layer.z_index = config.z_index
		
		# Get viewport and texture dimensions
		var viewport_size = get_viewport().get_visible_rect().size
		var texture_size = texture.get_size()
		
		# Calculate scale to fill the entire viewport
		var scale_x = viewport_size.x / texture_size.x
		var scale_y = viewport_size.y / texture_size.y
		
		# Use the larger scale to ensure full coverage
		var scale_factor = max(scale_x, scale_y)
		
		# Calculate how many sprites we need to tile horizontally
		# We need enough sprites to cover the viewport width plus extra for seamless scrolling
		var scaled_texture_width = texture_size.x * scale_factor
		var sprites_needed = int(ceil(viewport_size.x / scaled_texture_width)) + 4
		
		print("Layer ", i, " texture size: ", texture_size, " scale: ", scale_factor, " sprites needed: ", sprites_needed)
		
		# Create multiple sprites to tile horizontally
		for j in range(sprites_needed):
			var sprite = Sprite2D.new()
			sprite.texture = texture
			sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
			
			# Position sprites side by side to tile horizontally, centered vertically
			sprite.position = Vector2(j * scaled_texture_width, viewport_size.y / 2)
			
			# Scale sprite to fill the entire viewport
			sprite.scale = Vector2(scale_factor, scale_factor)
			
			parallax_layer.add_child(sprite)
		
		add_child(parallax_layer)
		
		print("Added parallax layer ", i, ": ", config.texture_path, " with speed: ", config.scroll_speed, " (", sprites_needed, " sprites)")
	
	print("ParallaxBackground: Setup complete. Total layers: ", get_child_count())

func setup_filter():
	if not enable_filter:
		return
		
	# Remove existing filter if any
	for child in get_children():
		if child.name == "BackgroundFilter":
			child.queue_free()
	
	# Create filter overlay
	var filter = ColorRect.new()
	filter.name = "BackgroundFilter"
	filter.color = filter_color
	filter.z_index = -1  # Above all background layers
  filter.mouse_filter = Control.MOUSE_FILTER_IGNORE  # Don't block mouse input
  
  # Position and size to cover entire viewport
  var viewport_size = get_viewport().get_visible_rect().size
  filter.position = Vector2(-viewport_size.x, -viewport_size.y)
  filter.size = viewport_size * 3  # Make it larger to cover any movement
  
  add_child(filter)
  print("Added background filter with color: ", filter_color)

# Function to add a custom background layer
func add_background_layer(texture_path: String, scroll_speed: float, z_index: int = -1):
  var texture = load(texture_path)
  if not texture:
    print("Warning: Could not load texture: ", texture_path)
    return
    
  var parallax_layer = ParallaxLayer.new()
  parallax_layer.motion_scale = Vector2(scroll_speed, 0)
  parallax_layer.z_index = z_index
  
  var viewport_size = get_viewport().get_visible_rect().size
  var texture_size = texture.get_size()
  
  var scale_x = viewport_size.x / texture_size.x
  var scale_y = viewport_size.y / texture_size.y
  var scale_factor = max(scale_x, scale_y)
  
  var scaled_texture_width = texture_size.x * scale_factor
  var sprites_needed = int(ceil(viewport_size.x / scaled_texture_width)) + 4
  
  for j in range(sprites_needed):
    var sprite = Sprite2D.new()
    sprite.texture = texture
    sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
    
    sprite.position = Vector2(j * scaled_texture_width, viewport_size.y / 2)
    sprite.scale = Vector2(scale_factor, scale_factor)
    
    parallax_layer.add_child(sprite)
  
  add_child(parallax_layer)
  
  print("Added custom parallax layer: ", texture_path, " with speed: ", scroll_speed)

# Function to remove a background layer by index
func remove_background_layer(index: int):
  var layers = []
  for child in get_children():
    if child is ParallaxLayer:
      layers.append(child)
  
  if index >= 0 and index < layers.size():
    layers[index].queue_free()
    print("Removed parallax layer at index: ", index)

# Function to change scroll speed of a layer
func set_layer_scroll_speed(index: int, new_speed: float):
  var layers = []
  for child in get_children():
    if child is ParallaxLayer:
      layers.append(child)
  
  if index >= 0 and index < layers.size():
    layers[index].motion_scale.x = new_speed
    print("Changed layer ", index, " speed to: ", new_speed)

# Function to get current layer count
func get_layer_count() -> int:
  var count = 0
  for child in get_children():
    if child is ParallaxLayer:
      count += 1
  return count

# Function to change filter color
func set_filter_color(color: Color):
  filter_color = color
  if enable_filter:
    setup_filter()

# Function to enable/disable filter
func set_filter_enabled(enabled: bool):
  enable_filter = enabled
  setup_filter()
