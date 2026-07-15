import Blade from '../objects/Blade.js';
import Fruit from '../objects/Fruit.js';
import ParticleManager from '../objects/ParticleManager.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        // 1. Add background
        this.add.image(640, 360, 'wood_bg');

        // Initialize audio synthesizer on menu interaction
        this.input.once('pointerdown', () => {
            this.game.soundEffects.init();
        });

        // 2. Initialize Blade and Particle System for Interactive Menu
        this.particleManager = new ParticleManager(this);
        this.blade = new Blade(this);

        // Physics group for floating decorative fruits
        this.floatingFruits = this.physics.add.group();

        // 3. Game Title Design (High Impact Outfit Typography)
        const titleGlow = this.add.text(640, 140, 'NINJA FRUIT', {
            fontFamily: 'Outfit',
            fontSize: '96px',
            color: '#ffdd00',
            fontWeight: '900',
            stroke: '#d4aa00',
            strokeThickness: 12,
            shadow: { color: '#ff2d55', blur: 30, stroke: true, fill: true }
        }).setOrigin(0.5);

        const subTitle = this.add.text(640, 220, 'SLICER', {
            fontFamily: 'Outfit',
            fontSize: '48px',
            color: '#ffffff',
            fontWeight: '600',
            letterSpacing: 10,
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        // Add float animation to the title
        this.tweens.add({
            targets: [titleGlow, subTitle],
            y: '+=12',
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 4. "Slice to Play" Interactive Button
        this.createPlayButton();

        // 5. Best Score Display
        const bestScore = localStorage.getItem('fruit_slice_best') || 0;
        this.add.text(640, 650, `★ BEST SCORE: ${bestScore} ★`, {
            fontFamily: 'Outfit',
            fontSize: '28px',
            color: '#ffe680',
            fontWeight: 'bold',
            stroke: '#3a231b',
            strokeThickness: 4
        }).setOrigin(0.5);

        // 6. Sound Toggle Button (Mute/Unmute)
        this.createMuteButton();

        // 6b. Camera Mode Toggle Button & Hand Cursor
        this.handCursor = this.add.graphics();
        this.handCursor.setDepth(60);
        this.createCameraToggle();

        // 7. Spawner for floating interactive background fruits
        this.spawnTimer = this.time.addEvent({
            delay: 1500,
            callback: this.spawnFloatingMenuFruit,
            callbackScope: this,
            loop: true
        });

        // Register pointer inputs for blade swiping
        this.input.on('pointerdown', (pointer) => {
            this.game.soundEffects.resume();
            this.blade.start(pointer);
        });

        this.input.on('pointermove', (pointer) => {
            this.blade.updateBlade(pointer, this.time.now, this.sys.game.loop.delta);
        });
    }

    update(time, delta) {
        // Update blade trail based on camera hand tracking vs mouse pointer
        const tracker = this.game.cameraTracking;
        if (tracker && tracker.isTrackingActive) {
            if (tracker.isHandVisible) {
                // Draw hand tracking cursor dot
                this.handCursor.clear();
                this.handCursor.fillStyle(0xffffff, 0.85);
                this.handCursor.fillCircle(tracker.handX, tracker.handY, 7);
                this.handCursor.lineStyle(2.5, 0x00dfff, 1);
                this.handCursor.strokeCircle(tracker.handX, tracker.handY, 14);
                this.handCursor.setVisible(true);

                const virtualPointer = { x: tracker.handX, y: tracker.handY, isDown: true };
                this.blade.updateBlade(virtualPointer, time, delta);
            } else {
                this.handCursor.setVisible(false);
                const virtualPointer = { x: tracker.handX, y: tracker.handY, isDown: false };
                this.blade.updateBlade(virtualPointer, time, delta);
            }
        } else {
            this.handCursor.setVisible(false);
            this.blade.updateBlade(this.input.activePointer, time, delta);
        }

        // Check slices on background decorative fruits
        this.floatingFruits.getChildren().forEach((fruit) => {
            if (fruit && fruit.active) {
                const intersection = this.blade.checkIntersection(fruit);
                if (intersection) {
                    this.game.soundEffects.playSlice();
                    
                    const sliceResult = fruit.slice(intersection);
                    if (sliceResult) {
                        this.particleManager.emitJuice(intersection.x, intersection.y, sliceResult.juiceColor);
                        this.particleManager.spawnWallSplat(intersection.x, intersection.y, sliceResult.juiceColor);
                    }
                }
                
                // Destroy if they fall out of bounds
                if (fruit.checkOutOfBounds()) {
                    fruit.destroy();
                }
            }
        });

        // Check slice on the big "Slice to Play" button
        if (this.playButton && this.playButton.active) {
            const intersection = this.blade.checkIntersection(this.playButton);
            if (intersection) {
                this.slicePlayButton(intersection);
            }
        }
    }

    createPlayButton() {
        const px = 640;
        const py = 430;

        // Giant Watermelon Sprite (directly in scene)
        this.playButton = this.physics.add.sprite(px, py, 'watermelon');
        this.playButton.setScale(1.3);
        this.playButton.radius = 50 * 1.3; // Collision radius scaled
        this.playButton.body.setAllowGravity(false);
        this.playButton.setAngularVelocity(20);
        this.playButton.setDepth(15);

        // Glowing rotating golden ring in background
        this.playRing = this.add.graphics({ x: px, y: py });
        this.playRing.lineStyle(4, 0xffd700, 0.45);
        this.playRing.strokeCircle(0, 0, 72);
        this.playRing.setDepth(14);

        // Rotation animation for the ring
        this.tweens.add({
            targets: this.playRing,
            angle: 360,
            duration: 10000,
            repeat: -1
        });

        // "SLICE TO PLAY" label
        this.playText = this.add.text(px, py, 'SLICE\nTO PLAY', {
            fontFamily: 'Outfit',
            fontSize: '18px',
            color: '#ffffff',
            fontWeight: '800',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5);
        this.playText.setDepth(16);

        // Soft hovering scaling animation
        this.tweens.add({
            targets: [this.playButton, this.playRing, this.playText],
            scale: '+=0.08',
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    slicePlayButton(intersection) {
        this.game.soundEffects.playSlice();
        this.game.soundEffects.playCombo(3); // Nice arpeggio chime

        // Explode watermelon juice
        this.particleManager.emitJuice(this.playButton.x, this.playButton.y, 0xff1e56);
        this.particleManager.spawnWallSplat(this.playButton.x, this.playButton.y, 0xff1e56);

        // Split watermelon visual halves
        this.createPlayButtonHalf('left', intersection.angle);
        this.createPlayButtonHalf('right', intersection.angle);

        // Hide main button and other items
        this.playButton.destroy();
        this.playRing.destroy();
        this.playText.destroy();
        this.playButton = null;

        // Clean up spawner
        this.spawnTimer.destroy();

        // Screen flash transition
        this.cameras.main.flash(500, 255, 255, 255);
        
        // Start Game Scene after a short delay
        this.time.delayedCall(800, () => {
            this.scene.start('GameScene');
        });
    }

    createPlayButtonHalf(side, sliceAngle) {
        const textureName = `watermelon_${side}`;
        const offsetDist = 18;
        const pushForce = 350;
        
        const dx = Math.cos(sliceAngle + (side === 'left' ? -Math.PI / 2 : Math.PI / 2)) * offsetDist;
        const dy = Math.sin(sliceAngle + (side === 'left' ? -Math.PI / 2 : Math.PI / 2)) * offsetDist;

        const half = this.physics.add.sprite(640 + dx, 430 + dy, textureName);
        half.setDepth(14);
        half.setScale(1.3);

        const pushAngle = sliceAngle + (side === 'left' ? -Math.PI / 2 : Math.PI / 2);
        half.setVelocity(Math.cos(pushAngle) * pushForce, Math.sin(pushAngle) * pushForce - 150);
        half.body.setGravityY(700);

        const spinDir = side === 'left' ? -1 : 1;
        half.setAngularVelocity(spinDir * 400);

        // Fade out
        this.tweens.add({
            targets: half,
            alpha: 0,
            duration: 800,
            delay: 200,
            onComplete: () => {
                half.destroy();
            }
        });
    }

    createMuteButton() {
        const isMuted = this.game.soundEffects.isMuted;
        
        this.muteButton = this.add.container(1220, 50);

        // Button background circle
        const bg = this.add.graphics();
        bg.fillStyle(0x3d2314, 0.9);
        bg.lineStyle(3, 0xff6b4a, 1);
        bg.fillCircle(0, 0, 22);
        bg.strokeCircle(0, 0, 22);
        this.muteButton.add(bg);

        // Sound icon graphic
        this.muteIcon = this.add.text(0, -1, isMuted ? '🔇' : '🔊', {
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.muteButton.add(this.muteIcon);

        // Flat input zone over the mute button
        this.muteButtonZone = this.add.zone(1220, 50, 50, 50);
        this.muteButtonZone.setInteractive({ useHandCursor: true });

        this.muteButtonZone.on('pointerdown', (pointer) => {
            if (pointer.event) pointer.event.stopPropagation(); // Avoid triggering blade trail
            this.game.soundEffects.playClick();
            
            const nowMuted = this.game.soundEffects.toggleMute();
            this.muteIcon.setText(nowMuted ? '🔇' : '🔊');

            // Button bounce effect
            this.tweens.add({
                targets: this.muteButton,
                scale: 0.85,
                duration: 80,
                yoyo: true
            });
        });
    }

    createCameraToggle() {
        this.camButton = this.add.container(1100, 50);

        const bg = this.add.graphics();
        this.camButton.add(bg);
        this.camButton.bg = bg;

        const txt = this.add.text(0, 0, '📷 CAM: OFF', {
            fontFamily: 'Outfit',
            fontSize: '14px',
            color: '#ffffff',
            fontWeight: 'bold'
        }).setOrigin(0.5);
        this.camButton.add(txt);
        this.camButton.txt = txt;

        this.updateCamButtonVisuals();

        // Flat input zone over the camera button
        this.camButtonZone = this.add.zone(1100, 50, 120, 44);
        this.camButtonZone.setInteractive({ useHandCursor: true });

        this.camButtonZone.on('pointerdown', async (pointer) => {
            if (pointer.event) pointer.event.stopPropagation();
            this.game.soundEffects.playClick();
            
            try {
                // Toggle state
                await this.game.cameraTracking.toggleTracking();
                this.updateCamButtonVisuals();
            } catch (err) {
                console.error("Camera toggle failed:", err);
                alert("Camera mode error: " + err.message);
            }
            
            // Add a little button bounce
            this.tweens.add({
                targets: this.camButton,
                scale: 0.85,
                duration: 80,
                yoyo: true
            });
        });
    }

    updateCamButtonVisuals() {
        if (!this.camButton) return;
        const active = this.game.cameraTracking.isTrackingActive;
        const bg = this.camButton.bg;
        bg.clear();
        bg.fillStyle(0x3d2314, 0.9);
        bg.lineStyle(3, active ? 0x00dfff : 0xff6b4a, 1);
        bg.fillRoundedRect(-60, -22, 120, 44, 10);
        bg.strokeRoundedRect(-60, -22, 120, 44, 10);
        this.camButton.txt.setText(active ? '📷 CAM: ON' : '📷 CAM: OFF');
    }

    spawnFloatingMenuFruit() {
        const fruitsList = ['apple', 'orange', 'watermelon', 'banana', 'kiwi', 'pineapple', 'strawberry'];
        const randomType = Phaser.Utils.Array.GetRandom(fruitsList);
        
        // Spawn randomly across the horizontal bottom
        const startX = Phaser.Math.Between(200, 1080);
        const fruit = new Fruit(this, startX, 750, randomType);
        
        this.floatingFruits.add(fruit);
        fruit.launch(0.65); // Launch with reduced X velocity for menu
    }
}
