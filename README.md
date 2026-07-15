# 📷 Premium Fruit Ninja: Webcam Hand-Tracking Edition

A production-quality, high-performance Fruit Ninja-inspired game built using **HTML5 Canvas**, **Phaser 3**, and **MediaPipe Hands**.

> [!IMPORTANT]
> **This is not your usual Fruit Ninja game!** In addition to standard mouse/touch controls, this edition features **real-time Webcam Hand-Tracking**. You can play the game completely hands-free by waving your index finger in front of your camera to slice fruit and navigate menus!

---

## 🌟 Key Features

* **Webcam Hand-Tracking**: Powered by MediaPipe. Tracks the normalized coordinates of your index finger tip and maps them onto the `1280x720` Phaser canvas.
* **Mirrored Floating Viewport**: The webcam feed is displayed as a small floating box in the top-left corner, mirrored horizontally (`transform: scaleX(-1)`) to ensure natural left-to-right hand movements.
* **Hands-Free Hover UI**: Play the game entirely without a mouse. When Camera Mode is active, hovering your hand cursor over any button for **1.2 seconds** draws a circular progress ring and triggers a "click" automatically.
* **Interactive Watermelon Start**: Slice through the rotating watermelon button using your hand or mouse to launch the game!
* **Zero Asset Dependency**: All textures, sliced fruit halves, splat decals, and particles are drawn programmatically via HTML5 Canvas. All sound effects (slices, chimes, explosions) are synthesized using the browser's **Web Audio API**. This prevents CORS or resource load errors on any local server!

---

## 🎮 How to Play

### 📷 Camera Controls (Hands-Free)
1. On the main menu, click or hover over the **📷 CAM: OFF** button in the top-right.
2. Grant the browser camera permission.
3. Stand a comfortable distance back and **hold up your index finger**.
4. A glowing cyan cursor and white sword trail will follow your finger.
5. **Slice to Play**: Swipe your hand across the center watermelon to start the game!
6. **Slice Fruits**: Wave your hand to slice flying fruits and score combos.
7. **Pause/Quit/Replay**: Hover your finger cursor over any HUD button for **1.2 seconds** to activate it.

### 🖱️ Mouse & Touch Controls
* **Mouse Left Click & Drag / Touch Swipe**: Swipes the sword blade to slice fruits.
* **Standard Clicks**: Click any button on screen to activate it instantly.

### 📜 Gameplay Rules
* **Slice Fruit**: Awards points.
* **Avoid Bombs**: Slicing a bomb triggers a screen flash and causes an immediate **Game Over**.
* **Don't Miss Fruits**: Letting standard fruits fall uncut past the bottom of the screen costs **1 Life**. You start with **3 Lives**. Missed power-up fruits or bombs do not deduct lives.
* **Combos**: Slicing 2, 3, or 4+ fruits in a single swipe awards combo bonuses (+20, +50, or +100 points) and triggers melodic chime arpeggios.

---

## ❄️ Special Power-Ups
* 🍍 **Golden Fruit**: Spawns rarely. Slicing it awards an instant **+100 Points** and golden sparks.
* ❄️ **Freeze Fruit**: Spawns rarely. Slicing it slows down time to **40% speed** for 6 seconds. The screen gets a frosty ice overlay and fruit spawns slow down.
* 🟣 **Double Score Fruit**: Spawns rarely. Slicing it doubles all score awards (+20 for apples, etc.) for 6 seconds, displaying purple neon floating scores.

---

## 📁 Folder Structure

```
FruitNinja/
│
├── index.html            # Web application entry point with MediaPipe CDN scripts
├── style.css             # Glassmorphism, floating webcam preview widget, and centering styles
├── main.js               # Phaser configuration & CameraTracking instantiation
│
├── objects/
│   ├── CameraTracking.js  # Manages MediaPipe Hands model, getUserMedia webcam stream, & smoothing
│   ├── Blade.js          # Sword trail renderer and line-to-circle collision math
│   ├── Fruit.js          # Fruit physics, properties, and splitting logic
│   ├── Bomb.js           # Bomb fuses, flight trajectory, and explosion triggers
│   ├── ParticleManager.js# Splash emitters and background splat decals
│   └── SoundEffects.js   # Programmatic synthesizer for sounds
│
├── scenes/
│   ├── BootScene.js      # Texture generation & sound setup
│   ├── MenuScene.js      # Main menu with floating interactive fruits
│   ├── GameScene.js      # Core gameplay loop & wave manager
│   └── GameOverScene.js  # Score panels & restart options
│
└── README.md             # Documentation and instructions
```

---

## 🛠️ Project Setup & How to Run

### Step 1: Run a Local Web Server
Because the game uses ES Modules (`type="module"`), the browser requires files to be served via HTTP/HTTPS. Running directly via `file://index.html` will trigger CORS errors.

You can launch a server instantly in the root folder using:
```bash
npx serve
```
Open your browser and navigate to: **[http://localhost:3000](http://localhost:3000)**.

### Step 2: Deploying to Vercel (HTTPS Required for Camera)
Since webcams require a secure connection (`HTTPS`), deploying the game to Vercel is the best way to share and play it on any device.

1. Push your project to a GitHub repository.
2. Log into your **[Vercel Dashboard](https://vercel.com/dashboard)**.
3. Import the GitHub repository and click **Deploy**.
4. Vercel automatically sets up free SSL certificates so your camera works out-of-the-box!
