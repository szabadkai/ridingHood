extends HBoxContainer

@onready var timer = $Timer

var cards = []


func _ready():
	cards = [$TextureRect, $TextureRect2, $TextureRect3, $TextureRect4, $TextureRect5]


func _process(delta):
	if timer.time_left <= 0.01:
		timer.start(2)
		var tween = create_tween().set_trans(Tween.TRANS_BOUNCE)
		var rand_index:int = randi() % cards.size()
		var card = cards[rand_index]
		card.set_pivot_offset(Vector2(16,24))
		tween.tween_property(card, "rotation", deg_to_rad(10), .2)
		tween.tween_property(card, "rotation", deg_to_rad(-10), .2)
		tween.tween_property(card, "rotation", deg_to_rad(0), .1)

