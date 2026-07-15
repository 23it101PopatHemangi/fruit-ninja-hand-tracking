import Blade from '../objects/Blade.js';

export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    create(data) {
        this.finalScore = data.score || 0;
        this.stats = data.stats || { slicedCount: 0, maxCombo: 0 };
        
        // Track hand hover click timers
        this.buttonHoverTimers = {
            restart: 0,
            menu: 0
        };

        // Play game over sound
        this.game.soundEffects.playGameOver();

        // 1. Wood Background
        this.add.image(640, 360, 'wood_bg');

        // Initialize blade so the player can swipe on GameOver screen
        this.blade = new Blade(this);
        this.handCursor = this.add.graphics();
        this.handCursor.setDepth(60);

        // 2. High Score Check & Save
        const previousBest = parseInt(localStorage.getItem('fruit_slice_best') || '0', 10);
        let isNewBest = false;
        
        if (this.finalScore > previousBest) {
            localStorage.setItem('fruit_slice_best', this.finalScore.toString());
            isNewBest = true;
        }
        
        const bestScore = localStorage.getItem('fruit_slice_best') || '0';

        // 3. Giant "GAME OVER" Title
        const title = this.add.text(640, 120, 'GAME OVER', {
            fontFamily: 'Outfit',
            fontSize: '84px',
            color: '#ff2d55',
            fontWeight: '900',
            stroke: '#000000',
            strokeThickness: 10,
            shadow: { color: '#000000', blur: 20, fill: true }
        }).setOrigin(0.5);

        // Gentle scale pulsing on title
        this.tweens.add({
            targets: title,
            scale: 1.05,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 4. Score Showcase Panel (Translucent dark rounded rectangle)
        this.createStatsPanel(bestScore, isNewBest);

        // 5. Playback & Menu Buttons
        this.createActionButtons();

        // Register pointer inputs for blade swiping
        this.input.on('pointerdown', (pointer) => {
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

                // Check button hovering with virtual hand cursor
                this.checkButtonHover(this.restartBtn, 'restart', () => {
                    this.scene.start('GameScene');
                }, tracker.handX, tracker.handY, delta);

                this.checkButtonHover(this.menuBtn, 'menu', () => {
                    this.scene.start('MenuScene');
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

    createStatsPanel(bestScore, isNewBest) {
        const panelX = 640;
        const panelY = 340;

        // Card Graphic Background
        const panelBg = this.add.graphics();
        panelBg.fillStyle(0x1a0f0d, 0.85);
        panelBg.lineStyle(3, isNewBest ? 0xffd700 : 0x4f3731, 1);
        panelBg.fillRoundedRect(panelX - 220, panelY - 110, 440, 220, 16);
        panelBg.strokeRoundedRect(panelX - 220, panelY - 110, 440, 220, 16);

        // Score Label
        this.add.text(panelX, panelY - 80, 'FINAL SCORE', {
            fontFamily: 'Outfit',
            fontSize: '20px',
            color: '#8e756c',
            fontWeight: '600',
            letterSpacing: 2
        }).setOrigin(0.5);

        // Huge Score Number
        this.add.text(panelX, panelY - 35, this.finalScore.toString(), {
            fontFamily: 'Outfit',
            fontSize: '64px',
            color: '#ffffff',
            fontWeight: '900',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Slices & Max Combo Stats
        this.add.text(panelX - 100, panelY + 45, `SLICED: ${this.stats.slicedCount}`, {
            fontFamily: 'Outfit',
            fontSize: '18px',
            color: '#d1bcb2',
            fontWeight: '600'
        }).setOrigin(0.5);

        this.add.text(panelX + 100, panelY + 45, `MAX COMBO: ${this.stats.maxCombo}`, {
            fontFamily: 'Outfit',
            fontSize: '18px',
            color: '#d1bcb2',
            fontWeight: '600'
        }).setOrigin(0.5);

        // Best Score line
        this.add.text(panelX, panelY + 80, `★ BEST SCORE: ${bestScore} ★`, {
            fontFamily: 'Outfit',
            fontSize: '20px',
            color: '#ffe680',
            fontWeight: '700'
        }).setOrigin(0.5);

        // If new High Score achieved, show banner
        if (isNewBest) {
            const banner = this.add.container(panelX, panelY - 125);
            
            const bannerBg = this.add.graphics();
            bannerBg.fillStyle(0xffd700, 1);
            bannerBg.fillRoundedRect(-140, -15, 280, 30, 6);
            banner.add(bannerBg);

            const bannerText = this.add.text(0, 0, 'NEW BEST SCORE!', {
                fontFamily: 'Outfit',
                fontSize: '15px',
                color: '#000000',
                fontWeight: '900',
                letterSpacing: 1
            }).setOrigin(0.5);
            banner.add(bannerText);

            // Pulse bounce banner
            this.tweens.add({
                targets: banner,
                scale: 1.08,
                duration: 600,
                yoyo: true,
                repeat: -1,
                ease: 'Quad.easeInOut'
            });
        }
    }

    createActionButtons() {
        // 1. RESTART BUTTON CARD
        this.restartBtn = this.add.container(480, 520);
        this.createButtonGraphic(this.restartBtn, 'REPLAY', 0xff6b4a);
        
        // 2. MAIN MENU BUTTON CARD
        this.menuBtn = this.add.container(800, 520);
        this.createButtonGraphic(this.menuBtn, 'MENU', 0x4cd964);

        // Interactive configurations
        this.setupButtonInteractive(this.restartBtn, () => {
            this.scene.start('GameScene');
        });

        this.setupButtonInteractive(this.menuBtn, () => {
            this.scene.start('MenuScene');
        });
    }

    createButtonGraphic(container, labelText, borderHex) {
        const bg = this.add.graphics();
        bg.fillStyle(0x2d1b18, 0.95);
        bg.lineStyle(3, borderHex, 1);
        bg.fillRoundedRect(-90, -27, 180, 54, 12);
        bg.strokeRoundedRect(-90, -27, 180, 54, 12);
        container.add(bg);

        const text = this.add.text(0, 0, labelText, {
            fontFamily: 'Outfit',
            fontSize: '22px',
            color: '#ffffff',
            fontWeight: 'bold',
            letterSpacing: 1
        }).setOrigin(0.5);
        container.add(text);

        container.bgGraphic = bg;
        container.borderHex = borderHex;
    }

    setupButtonInteractive(container, callback) {
        // Create standard zone overlay at container position
        const zone = this.add.zone(container.x, container.y, 180, 55);
        zone.setInteractive({ useHandCursor: true });

        zone.on('pointerover', () => {
            this.tweens.add({
                targets: container,
                scale: 1.08,
                duration: 100,
                ease: 'Quad.easeOut'
            });
        });

        zone.on('pointerout', () => {
            this.tweens.add({
                targets: container,
                scale: 1.0,
                duration: 100,
                ease: 'Quad.easeOut'
            });
        });

        zone.on('pointerdown', (pointer) => {
            if (pointer.event) pointer.event.stopPropagation();
            this.game.soundEffects.playClick();
            
            // Pulse click scale down
            this.tweens.add({
                targets: container,
                scale: 0.9,
                duration: 80,
                yoyo: true,
                onComplete: () => {
                    callback();
                }
            });
        });

        // Store reference on the container
        container.inputZone = zone;
    }
}
