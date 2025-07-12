# Parallax Background System

This document describes the parallax scrolling background system implemented in the game.

## Overview

The parallax background system creates a depth effect by scrolling multiple background layers at different speeds when the player moves. This creates an immersive 3D-like effect where distant objects appear to move slower than closer ones.

## Features

### Multiple Background Layers
- **6 different background layers** with varying scroll speeds
- **Layered depth effect** with proper z-index ordering
- **Seamless scrolling** with texture repetition
- **Configurable scroll speeds** for each layer

### Background Assets Used
1. **Background.png** - Base background (speed: 0.1)
2. **Background_Wall.png** - Wall elements (speed: 0.2)
3. **Background_Pillars.png** - Pillar structures (speed: 0.3)
4. **Background_Arches.png** - Arch elements (speed: 0.4)
5. **Fog.png** - Atmospheric fog (speed: 0.6)
6. **Fog_Top.png** - Top fog layer (speed: 0.7)

## Implementation

### Files Created/Modified

#### New Files:
- **`Scripts/ParallaxBackground.gd`** - Main parallax system script
- **`Scenes/ParallaxBackground.tscn`** - Parallax background scene
- **`PARALLAX_SYSTEM_README.md`** - This documentation

#### Modified Files:
- **`Scenes/Main.tscn`** - Added ParallaxBackground as camera child
- **`Scripts/Main.gd`** - Added parallax background setup

### How It Works

1. **Scene Setup**: ParallaxBackground is added as a child of the player's camera
2. **Layer Creation**: Each background texture is loaded and converted to a ParallaxLayer
3. **Speed Configuration**: Each layer has a different `motion_scale` for scroll speed
4. **Automatic Scrolling**: Godot's ParallaxBackground handles the scrolling automatically
5. **Texture Repetition**: Each sprite is made 3x wider to ensure seamless scrolling

### Technical Details

#### ParallaxLayer Configuration
```gdscript
var layer_configs = [
    {
        "texture_path": "res://Assets/Environment/Background.png",
        "scroll_speed": 0.1,  # Slowest layer (farthest)
        "y_offset": 0,
        "z_index": -10
    },
    # ... more layers with increasing speeds
]
```

#### Scroll Speed Logic
- **Lower speeds (0.1-0.3)**: Distant background elements
- **Medium speeds (0.4-0.5)**: Mid-ground elements  
- **Higher speeds (0.6-0.7)**: Foreground atmospheric effects

## Usage

### Automatic Setup
The parallax system is automatically set up when the game starts. The Main script connects the player and camera references to the ParallaxBackground.

### Manual Control
You can control the parallax system programmatically:

```gdscript
# Add a custom background layer
parallax_background.add_background_layer("path/to/texture.png", 0.5, 0, -1)

# Change scroll speed of a layer
parallax_background.set_layer_scroll_speed(0, 0.2)

# Remove a layer
parallax_background.remove_background_layer(0)

# Enable/disable parallax
parallax_background.set_parallax_enabled(false)
```

## Performance Considerations

- **Texture Loading**: Textures are loaded once at startup
- **Memory Usage**: Each layer uses additional memory for the repeated textures
- **Rendering**: Multiple layers may impact performance on lower-end devices
- **Optimization**: Consider reducing layer count or texture sizes for better performance

## Customization

### Adding New Background Layers
1. Add your texture to the `Assets/Environment/` folder
2. Add a new entry to `layer_configs` in `ParallaxBackground.gd`
3. Configure the scroll speed, y_offset, and z_index as needed

### Adjusting Scroll Speeds
- **0.0**: No movement (static background)
- **0.1-0.3**: Slow movement (distant objects)
- **0.4-0.6**: Medium movement (mid-ground)
- **0.7-1.0**: Fast movement (close objects)

### Layer Ordering
- **Lower z_index values**: Appear behind other elements
- **Higher z_index values**: Appear in front of other elements
- **Recommended range**: -10 to -1 for background layers

## Troubleshooting

### Common Issues

1. **Background not visible**: Check if ParallaxBackground is properly added to the camera
2. **No scrolling**: Verify that the camera is moving and ParallaxBackground is a child of the camera
3. **Texture not loading**: Ensure the texture path is correct and the file exists
4. **Performance issues**: Reduce the number of layers or texture sizes

### Debug Output
The system includes debug output to help troubleshoot issues:
- Layer creation messages
- Texture loading warnings
- Setup completion confirmation

## Future Enhancements

Potential improvements to consider:
- **Dynamic layer loading** based on player position
- **Weather effects** with animated parallax layers
- **Day/night cycle** with different background sets
- **Performance optimization** with texture atlasing
- **Custom shader effects** for atmospheric layers 