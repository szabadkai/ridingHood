extends HBoxContainer

@onready var timer = $Timer
var Card = load("res://Scenes/Card.tscn")

var cards = []


func _ready():
  var deck=[]
  for i in range(55):
    deck.append(i)
  
  deck.shuffle()
  
  for i in deck.slice(0,5):
    var card = Card.instantiate()
    card.idx = i
    add_child(card)
    cards.append(card)



func _process(delta):
  jiggle()


func jiggle():
  if timer.time_left <= 0.01:
    timer.start(2)
    var tween = create_tween().set_trans(Tween.TRANS_BOUNCE)
    var rand_index:int = randi() % cards.size()
    var card = cards[rand_index]
    card.set_pivot_offset(Vector2(16,24))
    tween.tween_property(card, "rotation", deg_to_rad(10), .2)
    tween.tween_property(card, "rotation", deg_to_rad(-10), .2)
    tween.tween_property(card, "rotation", deg_to_rad(0), .1)
