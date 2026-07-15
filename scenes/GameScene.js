import Blade from '../objects/Blade.js';
import Fruit from '../objects/Fruit.js';
import Bomb from '../objects/Bomb.js';
import ParticleManager from '../objects/ParticleManager.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init() {
        // Core game state
        this.score = 0;
        this.lives = 3;
        this.isGameOver = false;
        this.isPaused = false;
        this.difficultyLevel = 1; // Scales 1 to 10
        this.gameTimeElapsed = 0; // ms

        // Power-up states
        this.freezeActive = false;
        this.freezeTimer = 0;
        this.doubleActive = false;
        this.doubleTimer = 0;

        // Statistics for game over screen
        this.stats = {
            slicedCount: 0,
            maxCombo: 0
        };

        // Frame slice accumulator (combos)
        this.slicedThisFrame = [];

        // Hand hover click timers
        this.buttonHoverTimers = {
            pause: 0,
            resume: 0,
            restart: 0,
            exit: 0
        };
    }

    create() {
        // 1. Add background
        this.add.image(640, 360, 'wood_bg');

        // Frost overlay (for freeze mode) - hidden by default
        this.frostOverlay = this.add.rectangle(640, 360, 1280, 720, 0x00aaff, 0.15);
        this.frostOverlay.setDepth(4); // Behind fruits, above wood background
        this.frostOverlay.setVisible(false);

        // 2. Initialize Blade and Particles
        this.particleManager = new ParticleManager(this);
        this.blade = new Blade(this);
        this.handCursor = this.add.graphics();
        this.handCursor.setDepth(60);

        // 3. Physics Groups
        this.fruitsGroup = this.physics.add.group();
        this.bombsGroup = this.physics.add.group();

        // 4. Create HUD
        this.createHUD();

        // 5. Create Pause Overlay Menu
        this.createPauseMenu();

        // 6. Start Wave Spawner
        this.spawnTimerEvent = this.time.addEvent({
            delay: 1500, // Starts at 1.5 seconds
            callback: this.spawnWave,
            callbackScope: this,
            loop: true
        });

        // 7. Input Events for Blade Swiping
        this.input.on('pointerdown', (pointer) => {
            if (this.isPaused || this.isGameOver) return;
            this.blade.start(pointer);
        });

        this.input.on('pointermove', (pointer) => {
            if (this.isPaused || this.isGameOver) return;
            this.blade.updateBlade(pointer, this.time.now, this.sys.game.loop.delta);
        });

        // Start background music or resume audio system
        this.game.soundEffects.resume();
    }

    update(time, delta) {
        if (this.isGameOver) {
            this.blade.resetTrail();
            return;
        }

        if (this.isPaused) {
            this.updatePauseMenuInteraction(time, delta);
            return;
        }

        // Track game time and scale difficulty
        this.gameTimeElapsed += delta;
        this.updateDifficulty(delta);

        // Update active timers for power-ups
        this.updatePowerUpTimers(delta);

        // Update blade trail graphics based on camera hand tracking vs mouse pointer
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

                // Check Pause button hover when playing
                this.checkButtonHover(this.pauseBtn, 'pause', () => {
                    this.toggleGamePause();
                }, tracker.handX, tracker.handY, delta);
            } else {
                this.handCursor.setVisible(false);
                const virtualPointer = { x: tracker.handX, y: tracker.handY, isDown: false };
                this.blade.updateBlade(virtualPointer, time, delta);
            }
        } else {
            this.handCursor.setVisible(false);
            this.blade.updateBlade(this.input.activePointer, time, delta);
        }

        // Update bomb fuse particles
        this.bombsGroup.getChildren().forEach((bomb) => {
            bomb.updateBomb(this.particleManager);
        });

        // Reset frame slice accumulator
        this.slicedThisFrame = [];

        // Check intersections with fruits
        this.fruitsGroup.getChildren().forEach((fruit) => {
            if (fruit && fruit.active) {
                const intersection = this.blade.checkIntersection(fruit);
                if (intersection) {
                    const sliceResult = fruit.slice(intersection);
                    if (sliceResult) {
                        this.slicedThisFrame.push({ result: sliceResult, x: intersection.x, y: intersection.y });
                    }
                } else if (fruit.checkOutOfBounds()) {
                    // Penalty if player missed a standard fruit
                    if (!fruit.isPowerUp) {
                        this.loseLife(fruit.x);
                    }
                    fruit.destroy();
                }
            }
        });

        // Check intersections with bombs
        this.bombsGroup.getChildren().forEach((bomb) => {
            if (bomb && bomb.active) {
                const intersection = this.blade.checkIntersection(bomb);
                if (intersection) {
                    this.sliceBomb(bomb, intersection);
                } else if (bomb.checkOutOfBounds()) {
                    bomb.destroy();
                }
            }
        });

        // Resolve slices accumulated in this frame for Combo math
        if (this.slicedThisFrame.length > 0) {
            this.resolveSlicesThisFrame();
        }
    }

    // ==========================================
    // SPARK / BOMB / SLICE RESOLUTION
    // ==========================================

    resolveSlicesThisFrame() {
        const sliceCount = this.slicedThisFrame.length;

        // Apply point calculations
        let totalPointsEarned = 0;
        let playChime = false;

        this.slicedThisFrame.forEach((slice) => {
            const { result, x, y } = slice;
            
            // Basic Points
            let earned = result.score;
            
            // Check double score power-up
            if (this.doubleActive) {
                earned *= 2;
            }

            totalPointsEarned += earned;
            this.stats.slicedCount++;

            // Trigger Power-up events
            if (result.isPowerUp) {
                this.triggerPowerUp(result.powerUpType, x, y);
                playChime = true;
            }

            // Visual Juice and Sparks
            this.particleManager.emitJuice(x, y, result.juiceColor);
            this.particleManager.spawnWallSplat(x, y, result.juiceColor);
            
            // Award floating text
            this.showFloatingText(x, y, `+${earned}`, result.isPowerUp ? '#ffd700' : (this.doubleActive ? '#e000ff' : '#ffffff'));
        });

        // Combo check (2 or more fruits sliced at the exact same instant)
        if (sizeOf(this.slicedThisFrame.filter(s => !s.result.isPowerUp)) >= 2 || sliceCount >= 2) {
            const nonPowerUpSlices = this.slicedThisFrame.filter(s => !s.result.isPowerUp);
            const comboCount = nonPowerUpSlices.length || sliceCount;
            
            if (comboCount >= 2) {
                let comboBonus = 20;
                if (comboCount === 3) comboBonus = 50;
                else if (comboCount >= 4) comboBonus = 100;

                totalPointsEarned += comboBonus;
                this.stats.maxCombo = Math.max(this.stats.maxCombo, comboCount);

                // Play combo sound
                this.game.soundEffects.playCombo(comboCount);

                // Show Combo Notification Splash on screen
                const midX = this.slicedThisFrame[0].x;
                const midY = this.slicedThisFrame[0].y - 40;
                this.showComboSplash(midX, midY, comboCount, comboBonus);
            } else {
                this.game.soundEffects.playSlice();
            }
        } else {
            // Standard slice sound
            if (!playChime) {
                this.game.soundEffects.playSlice();
            }
        }

        // Add to main score
        this.addScore(totalPointsEarned);
    }

    sliceBomb(bomb, intersection) {
        this.isGameOver = true;
        
        // Disable blade
        this.blade.resetTrail();

        // Shaking effect
        this.cameras.main.shake(600, 0.04);
        
        // Play explosion sound
        this.game.soundEffects.playExplosion();

        // Spawn particles
        this.particleManager.emitBombExplosion(intersection.x, intersection.y);
        bomb.slice();

        // Pause physics world immediately
        this.physics.world.pause();

        // Delay GameOverScene loading to let explosion complete
        this.time.delayedCall(1200, () => {
            this.scene.start('GameOverScene', {
                score: this.score,
                stats: this.stats
            });
        });
    }

    // Helper because JS Array length is standard, but keeping code readable
    triggerPowerUp(type, x, y) {
        if (type === 'golden') {
            this.game.soundEffects.playCombo(4); // Sparkly arpeggio
            this.particleManager.emitSparks(x, y, 0xffd700);
        } else if (type === 'freeze') {
            this.game.soundEffects.playFreeze();
            this.particleManager.emitSparks(x, y, 0x00dfff);

            this.freezeActive = true;
            this.freezeTimer = 6000; // 6 seconds
            this.physics.world.timeScale = 2.5; // Physics slows down to 40%
            this.frostOverlay.setVisible(true);
            this.frostOverlay.setAlpha(0.15);
            this.freezeBadge.setVisible(true);

            // Re-scale spawn timer delay if freeze activated
            this.updateSpawnDelay();
        } else if (type === 'double') {
            this.game.soundEffects.playCombo(3);
            this.particleManager.emitSparks(x, y, 0xe000ff);

            this.doubleActive = true;
            this.doubleTimer = 6000; // 6 seconds
            this.doubleBadge.setVisible(true);
        }
    }

    updatePowerUpTimers(delta) {
        // Freeze Mode
        if (this.freezeActive) {
            this.freezeTimer -= delta;
            if (this.freezeTimer <= 0) {
                this.freezeActive = false;
                this.physics.world.timeScale = 1.0; // Restore physics
                this.frostOverlay.setVisible(false);
                this.freezeBadge.setVisible(false);
                this.updateSpawnDelay();
            } else {
                // Frost pulse
                const pulse = 0.12 + Math.sin(this.time.now / 200) * 0.04;
                this.frostOverlay.setAlpha(pulse);
            }
        }

        // Double Score Mode
        if (this.doubleActive) {
            this.doubleTimer -= delta;
            if (this.doubleTimer <= 0) {
                this.doubleActive = false;
                this.doubleBadge.setVisible(false);
            }
        }
    }

    // ==========================================
    // SPAWNING MECHANICS & DIFFICULTY
    // ==========================================

    updateDifficulty(delta) {
        // Scaled every 20 seconds
        const currentSecond = Math.floor(this.gameTimeElapsed / 1000);
        const newLevel = Math.min(1 + Math.floor(currentSecond / 20), 10); // Caps at level 10 after 3 minutes (180s)
        
        if (newLevel !== this.difficultyLevel) {
            this.difficultyLevel = newLevel;

            // Flash screen lightly to notify difficulty increase
            this.showFloatingText(640, 200, `DIFFICULTY INCREASED (Lvl ${this.difficultyLevel})`, '#ff884d', 20);
            
            // Adjust wave timers and spawner
            this.updateSpawnDelay();
        }
    }

    updateSpawnDelay() {
        // Spawn delay starts at 1500ms and reduces down to 750ms at Lvl 10
        // If freeze is active, we double the delay to reduce spawning frequency in slow-motion
        let baseDelay = 1550 - (this.difficultyLevel * 80); // range 1470ms to 750ms
        if (this.freezeActive) {
            baseDelay *= 2.0;
        }

        this.spawnTimerEvent.delay = baseDelay;
    }

    spawnWave() {
        if (this.isPaused || this.isGameOver) return;

        // Number of elements to throw based on level (1 to 4)
        const maxSpawn = this.difficultyLevel >= 8 ? 4 : (this.difficultyLevel >= 4 ? 3 : 2);
        const spawnCount = Phaser.Math.Between(1, maxSpawn);

        // Speed multiplier increases with difficulty level
        const speedMultiplier = 1.0 + (this.difficultyLevel * 0.04); // Lvl 10 = 1.4x

        for (let i = 0; i < spawnCount; i++) {
            // Offset spawns horizontally to avoid stacking overlap
            const xOffset = (i - (spawnCount - 1) / 2) * 120;
            const startX = Phaser.Math.Between(200, 1080) + xOffset;

            // Decide item: Bomb vs Fruit
            // Bomb probability starts at 5% (Lvl 1) and scales up to 25% (Lvl 10)
            const bombChance = 0.04 + (this.difficultyLevel * 0.021);
            const isBomb = Math.random() < bombChance;

            if (isBomb) {
                const bomb = new Bomb(this, startX, 750);
                this.bombsGroup.add(bomb);
                bomb.launch(speedMultiplier);
            } else {
                // Select Fruit type
                const fruitsList = ['apple', 'orange', 'watermelon', 'banana', 'kiwi', 'pineapple', 'strawberry'];
                
                // Add power-ups with low probability
                let finalType = Phaser.Utils.Array.GetRandom(fruitsList);
                const rand = Math.random();
                
                if (rand < 0.03) {
                    finalType = 'golden';
                } else if (rand < 0.07) {
                    finalType = 'freeze';
                } else if (rand < 0.11) {
                    finalType = 'double';
                }

                const fruit = new Fruit(this, startX, 750, finalType);
                this.fruitsGroup.add(fruit);
                fruit.launch(speedMultiplier);
            }
        }
    }

    loseLife(xPos) {
        if (this.isGameOver) return;

        this.lives--;
        this.game.soundEffects.playSplash();

        // 1. Create a floating red "X" marking at the bottom where fruit fell
        const redCross = this.add.text(xPos, 680, '✘', {
            fontFamily: 'Outfit',
            fontSize: '48px',
            color: '#ff2d55',
            fontWeight: '900',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.tweens.add({
            targets: redCross,
            scale: 1.5,
            y: 650,
            alpha: 0,
            duration: 1000,
            onComplete: () => redCross.destroy()
        });

        // 2. Re-draw HUD hearts
        this.drawHearts();

        // 3. Game Over check
        if (this.lives <= 0) {
            this.triggerGameOver();
        }
    }

    triggerGameOver() {
        this.isGameOver = true;
        this.blade.resetTrail();
        this.physics.world.pause();

        // Show giant floating GAME OVER message before transition
        const goText = this.add.text(640, 360, 'GAME OVER', {
            fontFamily: 'Outfit',
            fontSize: '96px',
            color: '#ff2d55',
            fontWeight: '900',
            stroke: '#000000',
            strokeThickness: 10
        }).setOrigin(0.5);

        goText.setScale(0.1);

        this.tweens.add({
            targets: goText,
            scale: 1.2,
            duration: 800,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.time.delayedCall(800, () => {
                    this.scene.start('GameOverScene', {
                        score: this.score,
                        stats: this.stats
                    });
                });
            }
        });
    }

    // ==========================================
    // UI & DISPLAY ELEMENTS
    // ==========================================

    createHUD() {
        // 1. Score HUD Card
        const scoreBg = this.add.graphics();
        scoreBg.fillStyle(0x1a0f0d, 0.6);
        scoreBg.fillRoundedRect(20, 20, 200, 70, 10);
        
        this.scoreLabel = this.add.text(35, 27, 'SCORE', {
            fontFamily: 'Outfit',
            fontSize: '14px',
            color: '#8e756c',
            fontWeight: 'bold',
            letterSpacing: 1
        });

        this.scoreValText = this.add.text(35, 43, '0', {
            fontFamily: 'Outfit',
            fontSize: '38px',
            color: '#ffffff',
            fontWeight: '900'
        });

        // 2. High Score Card
        const storedBest = localStorage.getItem('fruit_slice_best') || 0;
        this.bestScoreText = this.add.text(240, 27, `BEST: ${storedBest}`, {
            fontFamily: 'Outfit',
            fontSize: '18px',
            color: '#ffe680',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        });

        // 3. Lives Hearts HUD Container
        this.heartsContainer = this.add.container(1050, 45);
        this.drawHearts();

        // 4. Power-up Badge Indicators (Top Left under Score)
        // Double Score badge
        this.doubleBadge = this.add.container(35, 105);
        const dBadgeBg = this.add.graphics();
        dBadgeBg.fillStyle(0xbf00ff, 0.95);
        dBadgeBg.fillRoundedRect(0, 0, 140, 28, 6);
        this.doubleBadge.add(dBadgeBg);
        this.doubleBadge.add(this.add.text(70, 14, '2X DOUBLE SCORE', {
            fontFamily: 'Outfit', fontSize: '11px', color: '#ffffff', fontWeight: 'bold'
        }).setOrigin(0.5));
        this.doubleBadge.setVisible(false);

        // Freeze badge
        this.freezeBadge = this.add.container(190, 105);
        const fBadgeBg = this.add.graphics();
        fBadgeBg.fillStyle(0x00bfff, 0.95);
        fBadgeBg.fillRoundedRect(0, 0, 140, 28, 6);
        this.freezeBadge.add(fBadgeBg);
        this.freezeBadge.add(this.add.text(70, 14, '❄ SLOW MOTION', {
            fontFamily: 'Outfit', fontSize: '11px', color: '#ffffff', fontWeight: 'bold'
        }).setOrigin(0.5));
        this.freezeBadge.setVisible(false);

        // 5. Pause Button in top right (next to hearts)
        this.pauseBtn = this.add.container(1220, 45);

        const pBg = this.add.graphics();
        pBg.fillStyle(0x3d2314, 0.85);
        pBg.lineStyle(2, 0xff6b4a, 1);
        pBg.fillCircle(0, 0, 20);
        pBg.strokeCircle(0, 0, 20);
        this.pauseBtn.add(pBg);

        const pIcon = this.add.text(0, 0, '⏸', { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
        this.pauseBtn.add(pIcon);

        // Flat input zone for pause button
        this.pauseBtnZone = this.add.zone(1220, 45, 44, 44);
        this.pauseBtnZone.setInteractive({ useHandCursor: true });
        this.pauseBtnZone.on('pointerdown', (pointer) => {
            if (pointer.event) pointer.event.stopPropagation();
            this.game.soundEffects.playClick();
            this.toggleGamePause();
        });
    }

    drawHearts() {
        this.heartsContainer.removeAll(true);

        const spacing = 45;
        for (let i = 0; i < 3; i++) {
            const textureName = i < this.lives ? 'heart' : 'heart_empty';
            const heart = this.add.image(i * spacing, 0, textureName);
            heart.setScale(0.8);
            this.heartsContainer.add(heart);
        }
    }

    addScore(val) {
        this.score += val;
        this.scoreValText.setText(this.score.toString());

        // Punch scaling effect on score text
        this.tweens.add({
            targets: this.scoreValText,
            scale: 1.15,
            duration: 80,
            yoyo: true
        });
    }

    showFloatingText(x, y, textString, colorHex, fontSize = 28) {
        const floatText = this.add.text(x, y, textString, {
            fontFamily: 'Outfit',
            fontSize: `${fontSize}px`,
            color: colorHex,
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5);

        floatText.setDepth(30);

        this.tweens.add({
            targets: floatText,
            y: y - 60,
            alpha: 0,
            scale: 1.25,
            duration: 900,
            ease: 'Cubic.easeOut',
            onComplete: () => floatText.destroy()
        });
    }

    showComboSplash(x, y, count, bonusPoints) {
        const comboGroup = this.add.container(x, y);
        comboGroup.setDepth(28);

        // Glowing combo text
        const comboText = this.add.text(0, -15, `${count} FRUIT COMBO!`, {
            fontFamily: 'Outfit',
            fontSize: '34px',
            color: '#ffdd00',
            fontWeight: '900',
            stroke: '#b35900',
            strokeThickness: 6,
            shadow: { color: '#ff2200', blur: 15, stroke: true, fill: true }
        }).setOrigin(0.5);

        const bonusText = this.add.text(0, 18, `+${bonusPoints} Bonus!`, {
            fontFamily: 'Outfit',
            fontSize: '20px',
            color: '#ffffff',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        comboGroup.add(comboText);
        comboGroup.add(bonusText);
        comboGroup.setScale(0.2);

        this.tweens.add({
            targets: comboGroup,
            scale: 1.15,
            duration: 250,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.tweens.add({
                    targets: comboGroup,
                    y: y - 45,
                    alpha: 0,
                    scale: 0.9,
                    duration: 750,
                    delay: 400,
                    onComplete: () => comboGroup.destroy()
                });
            }
        });
    }

    // ==========================================
    // PAUSE OVERLAY CONTROL
    // ==========================================

    createPauseMenu() {
        this.pauseMenuContainer = this.add.container(640, 360);
        this.pauseMenuContainer.setDepth(60);
        this.pauseMenuContainer.setVisible(false);

        // Translucent backdrop shading the game screen
        const backdrop = this.add.rectangle(0, 0, 1280, 720, 0x000000, 0.65);
        this.pauseMenuContainer.add(backdrop);

        // Wooden dialogue board
        const board = this.add.graphics();
        board.fillStyle(0x241411, 0.95);
        board.lineStyle(4, 0xff6b4a, 1);
        board.fillRoundedRect(-180, -120, 360, 240, 16);
        board.strokeRoundedRect(-180, -120, 360, 240, 16);
        this.pauseMenuContainer.add(board);

        // Paused label
        const pText = this.add.text(0, -75, 'PAUSED', {
            fontFamily: 'Outfit', fontSize: '38px', color: '#ff6b4a', fontWeight: 'bold', letterSpacing: 2
        }).setOrigin(0.5);
        this.pauseMenuContainer.add(pText);

        // Button actions
        this.resumeBtnHUD = this.add.container(0, -15);
        this.restartBtnHUD = this.add.container(0, 35);
        this.exitBtnHUD = this.add.container(0, 85);

        this.createHUDButton(this.resumeBtnHUD, 'RESUME', 0x4cd964);
        this.createHUDButton(this.restartBtnHUD, 'REPLAY', 0xffb700);
        this.createHUDButton(this.exitBtnHUD, 'QUIT', 0xff2d55);

        this.pauseMenuContainer.add([this.resumeBtnHUD, this.restartBtnHUD, this.exitBtnHUD]);

        // Wire click triggers
        this.setupHUDButtonInteractive(this.resumeBtnHUD, () => {
            this.toggleGamePause();
        });

        this.setupHUDButtonInteractive(this.restartBtnHUD, () => {
            this.scene.start('GameScene');
        });

        this.setupHUDButtonInteractive(this.exitBtnHUD, () => {
            this.scene.start('MenuScene');
        });
    }

    createHUDButton(container, textStr, borderHex) {
        const bg = this.add.graphics();
        bg.fillStyle(0x3a231d, 0.9);
        bg.lineStyle(2, borderHex, 1);
        bg.fillRoundedRect(-90, -18, 180, 36, 8);
        bg.strokeRoundedRect(-90, -18, 180, 36, 8);
        container.add(bg);

        const lbl = this.add.text(0, 0, textStr, {
            fontFamily: 'Outfit', fontSize: '16px', color: '#ffffff', fontWeight: 'bold'
        }).setOrigin(0.5);
        container.add(lbl);
    }

    setupHUDButtonInteractive(container, callback) {
        // Compute global coordinates relative to parent container if nested
        const parentX = container.parentContainer ? container.parentContainer.x : 0;
        const parentY = container.parentContainer ? container.parentContainer.y : 0;
        const globalX = parentX + container.x;
        const globalY = parentY + container.y;

        // Create standard zone overlay at global position
        const zone = this.add.zone(globalX, globalY, 180, 38);
        zone.setInteractive({ useHandCursor: true });

        zone.on('pointerover', () => {
            container.setScale(1.05);
        });

        zone.on('pointerout', () => {
            container.setScale(1.0);
        });

        zone.on('pointerdown', (pointer) => {
            if (pointer.event) pointer.event.stopPropagation();
            this.game.soundEffects.playClick();
            callback();
        });

        // Store reference on the container
        container.inputZone = zone;
        
        // Disabled initially if it's part of the hidden pause menu
        if (container.parentContainer && !container.parentContainer.visible) {
            zone.setActive(false).setVisible(false);
        }
    }

    toggleGamePause() {
        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            // Pause physics and active timers
            this.physics.world.pause();
            this.spawnTimerEvent.paused = true;
            this.pauseMenuContainer.setVisible(true);

            // Enable input zones for the pause menu buttons
            if (this.resumeBtnHUD.inputZone) this.resumeBtnHUD.inputZone.setActive(true).setVisible(true);
            if (this.restartBtnHUD.inputZone) this.restartBtnHUD.inputZone.setActive(true).setVisible(true);
            if (this.exitBtnHUD.inputZone) this.exitBtnHUD.inputZone.setActive(true).setVisible(true);
        } else {
            // Resume
            this.physics.world.resume();
            this.spawnTimerEvent.paused = false;
            this.pauseMenuContainer.setVisible(false);
            
            // Disable input zones for the pause menu buttons
            if (this.resumeBtnHUD.inputZone) this.resumeBtnHUD.inputZone.setActive(false).setVisible(false);
            if (this.restartBtnHUD.inputZone) this.restartBtnHUD.inputZone.setActive(false).setVisible(false);
            if (this.exitBtnHUD.inputZone) this.exitBtnHUD.inputZone.setActive(false).setVisible(false);
            
            // Resume Audio Context just in case
            this.game.soundEffects.resume();
        }
    }

    updatePauseMenuInteraction(time, delta) {
        const tracker = this.game.cameraTracking;
        if (tracker && tracker.isTrackingActive) {
            if (tracker.isHandVisible) {
                // Render hand cursor dot
                this.handCursor.clear();
                this.handCursor.fillStyle(0xffffff, 0.85);
                this.handCursor.fillCircle(tracker.handX, tracker.handY, 7);
                this.handCursor.lineStyle(2.5, 0x00dfff, 1);
                this.handCursor.strokeCircle(tracker.handX, tracker.handY, 14);
                this.handCursor.setVisible(true);

                const virtualPointer = { x: tracker.handX, y: tracker.handY, isDown: true };
                this.blade.updateBlade(virtualPointer, time, delta);

                // Check Pause Menu buttons
                this.checkButtonHover(this.resumeBtnHUD, 'resume', () => {
                    this.toggleGamePause();
                }, tracker.handX, tracker.handY, delta);

                this.checkButtonHover(this.restartBtnHUD, 'restart', () => {
                    this.scene.start('GameScene');
                }, tracker.handX, tracker.handY, delta);

                this.checkButtonHover(this.exitBtnHUD, 'exit', () => {
                    this.scene.start('MenuScene');
                }, tracker.handX, tracker.handY, delta);
            } else {
                this.handCursor.setVisible(false);
                const virtualPointer = { x: tracker.handX, y: tracker.handY, isDown: false };
                this.blade.updateBlade(virtualPointer, time, delta);
            }
        } else {
            this.handCursor.setVisible(false);
        }
    }

    checkButtonHover(btn, key, callback, hx, hy, delta) {
        if (!btn) return;
        const bounds = btn.getBounds();
        const isHover = bounds.contains(hx, hy);
        
        if (isHover) {
            if (btn.scale === 1.0) {
                this.tweens.add({ targets: btn, scale: 1.08, duration: 100 });
            }
            if (this.buttonHoverTimers[key] !== -99999) {
                this.buttonHoverTimers[key] += delta;
                
                // Draw loading ring on handCursor
                const pct = Math.min(this.buttonHoverTimers[key] / 1200, 1.0);
                this.handCursor.lineStyle(3, 0xffea00, 1);
                this.handCursor.beginPath();
                this.handCursor.arc(hx, hy, 18, -Math.PI/2, -Math.PI/2 + pct * Math.PI * 2);
                this.handCursor.strokePath();
                
                if (pct >= 1.0) {
                    this.buttonHoverTimers[key] = -99999; // Prevent multiple triggers
                    this.game.soundEffects.playClick();
                    callback();
                }
            }
        } else {
            if (btn.scale > 1.0) {
                this.tweens.add({ targets: btn, scale: 1.0, duration: 100 });
            }
            this.buttonHoverTimers[key] = 0;
        }
    }
}

// Custom size check helper for array validation
function sizeOf(arr) {
    return arr ? arr.length : 0;
}
