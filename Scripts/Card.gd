extends TextureRect


# Called when the node enters the scene tree for the first time.
func _ready():
	add_to_group("DRAGGABLE")


# Called every frame. 'delta' is the elapsed time since the previous frame.
func _get_drag_data(at_position):
	print(at_position)
	set_drag_preview(_get_preview_control())
	return self

func _get_preview_control() -> Control:
	var preview = TextureRect.new()
	preview.size = size
	preview.texture = texture
	visible = false
	return preview

