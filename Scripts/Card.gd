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
	return preview


func dir_contents(path):
	var dir = DirAccess.open(path)
	var files = []
	if dir:
		dir.list_dir_begin()
		var file_name = dir.get_next()
		while file_name != "":
			if not dir.current_is_dir():
				files.append(file_name)
	print(files)
	return files
