# Premium Fruit Ninja Game

A production-quality, high-performance Fruit Ninja-inspired game built using **HTML5 Canvas** and **Phaser 3**. 

This game runs completely out-of-the-box with **zero external dependencies**! It programmatically generates all assets (textures, fruit slices, bombs, splats) via HTML5 Canvas and synthesizes all sound effects using the browser's Web Audio API. This avoids any CORS issues or broken asset errors when loading locally.

---

## 🎮 How to Play

### Controls
* **Mouse Left Click & Drag / Touch Swipe**: Swipes the sword blade to slice fruits.
* **Pause Button (⏸)**: Pauses the game loop.
* **Mute Button (🔊/🔇)**: Toggles audio volume.

### Gameplay Rules
* **Slice Fruit**: Slicing fruits awards points.
* **Avoid Bombs**: Slicing a bomb triggers an explosion and causes an immediate **Game Over**.
* **Don't Miss Fruits**: Letting standard fruits fall uncut past the bottom of the screen costs **1 Life**. You start with **3 Lives**. Missed power-up fruits or bombs do not deduct lives.
* **Combos**: Slicing 2, 3, or 4+ fruits in a single swipe awards massive combo bonuses (+20, +50, or +100 points) and triggers chime arpeggios.

---

## 🌟 Special Power-Ups
* 🍍 **Golden Fruit**: Spawns rarely. Slicing it awards an instant **+100 Points** and golden sparks.
* ❄️ **Freeze Fruit**: Spawns rarely. Slicing it slows down time to **40% speed** for 6 seconds. The screen gets a frosty ice overlay and fruit spawns slow down.
* 🟣 **Double Score Fruit**: Spawns rarely. Slicing it doubles all score awards (+20 for apples, etc.) for 6 seconds, displaying purple neon floating scores.

---

## 📁 Folder Structure

```
FruitNinja/
│
├── index.html          # Web application entry point
├── style.css           # Styling, centering, and typography
├── main.js             # Phaser game configuration
│
├── scenes/
│   ├── BootScene.js      # Texture generation & sound setup
│   ├── MenuScene.js      # Main menu with floating interactive fruits
│   ├── GameScene.js      # Core gameplay loop & wave manager
│   └── GameOverScene.js  # Score panels & restart options
│
├── objects/
│   ├── Fruit.js          # Fruit physics, properties, and splitting logic
│   ├── Bomb.js           # Bomb fuses, flight trajectory, and explosion triggers
│   ├── Blade.js          # Sword trail renderer and line-to-circle collision math
│   ├── ParticleManager.js# Splash emitters and background splat decals
│   └── SoundEffects.js   # Programmatic synthesizer for sounds
│
├── assets/             # Subfolders created for user custom overrides
│   ├── fruits/
│   ├── sounds/
│   ├── ui/
│   └── particles/
│
└── README.md           # Documentation and instructions
```

---

## 🛠️ Project Setup & How to Run

### Step 1: Clone or Copy files
Ensure the folder structure matches the one above. All file references use relative ES Modules.

### Step 2: Run a Local Web Server
Because the game uses ES Modules (`type="module"`), the browser requires files to be served via HTTP/HTTPS. Running directly via `file://index.html` will trigger CORS errors.

You can launch a server instantly in the root folder using any of these methods:
* **NodeJS (npm)**:
  ```bash
  npx serve .
  ```
  or
  ```bash
  npm install -g http-server
  http-server .
  ```
* **Python**:
  ```bash
  python -m http-server 8000
  ```
* **VS Code extension**: Use the popular **Live Server** extension to launch with one click.

### Step 3: Replace Graphics/Sounds (Optional)
If you want to use custom static PNGs and audio MP3s instead of the canvas-generated ones, simply place them in the `assets/` subfolders and modify `BootScene.js` to load them using `this.load.image()` and `this.load.audio()` in the `preload()` method.

---

## ⚡ Performance Optimizations
* **Object Pooling**: Halved fruit slices, splats, and particle emitters are recycled and faded out, keeping drawing counts minimal.
* **Canvas Texture Caching**: Textures are drawn once onto canvases during BootScene and uploaded directly to GPU memory, ensuring 60 FPS drawing speeds during gameplay.
* **Target 60 FPS**: Standard delta time scaling coordinates velocities, ensuring smooth movements across all frame rates.
