extends TextureRect


@export var idx = 0

func _ready():
	texture = load( "res://Assets/cards/tile%03d.png" % idx)

func _get_drag_data(at_position):
	set_drag_preview(_get_preview_control())
	return self
	
func _get_preview_control() -> Control:
	var preview = TextureRect.new()

	preview.size = size
	preview.texture = texture
	visible = false
	return preview
