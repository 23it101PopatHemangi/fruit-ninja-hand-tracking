import SoundEffects from '../objects/SoundEffects.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Initialize and bind custom sound effects synthesizer to the game instance
        if (!this.game.soundEffects) {
            this.game.soundEffects = new SoundEffects();
        }

        // Show progress bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Background overlay
        this.add.rectangle(0, 0, width, height, 0x0f0908).setOrigin(0);

        // Progress HUD
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x22110e, 0.8);
        progressBox.fillRoundedRect(width / 2 - 200, height / 2 - 20, 400, 40, 8);

        const loadingText = this.add.text(width / 2, height / 2 - 50, 'Crafting Slices...', {
            fontFamily: 'Outfit',
            fontSize: '24px',
            color: '#ff6b4a',
            fontWeight: 'bold'
        }).setOrigin(0.5);

        const percentText = this.add.text(width / 2, height / 2 + 50, '0%', {
            fontFamily: 'Outfit',
            fontSize: '18px',
            color: '#8e756c'
        }).setOrigin(0.5);

        // We will generate assets sequentially to show progress
        this.assetsToGenerate = [
            { name: 'wood_bg', action: () => this.generateWoodBg() },
            { name: 'apple', action: () => this.generateApple() },
            { name: 'orange', action: () => this.generateOrange() },
            { name: 'watermelon', action: () => this.generateWatermelon() },
            { name: 'banana', action: () => this.generateBanana() },
            { name: 'kiwi', action: () => this.generateKiwi() },
            { name: 'pineapple', action: () => this.generatePineapple() },
            { name: 'strawberry', action: () => this.generateStrawberry() },
            { name: 'golden_fruit', action: () => this.generateGolden() },
            { name: 'freeze_fruit', action: () => this.generateFreeze() },
            { name: 'double_fruit', action: () => this.generateDouble() },
            { name: 'bomb', action: () => this.generateBomb() },
            { name: 'particles', action: () => this.generateParticles() },
            { name: 'splats', action: () => this.generateSplats() },
            { name: 'ui', action: () => this.generateUI() }
        ];

        this.currentStep = 0;
    }

    create() {
        // Run the generator loop
        this.generateNextAsset();
    }

    generateNextAsset() {
        if (this.currentStep < this.assetsToGenerate.length) {
            const asset = this.assetsToGenerate[this.currentStep];
            
            // Execute canvas drawing
            asset.action();

            this.currentStep++;

            // Update UI
            const pct = Math.floor((this.currentStep / this.assetsToGenerate.length) * 100);
            
            const width = this.cameras.main.width;
            const height = this.cameras.main.height;
            
            // Re-draw progress bar
            const bar = this.add.graphics();
            bar.fillStyle(0xff6b4a, 1);
            bar.fillRoundedRect(width / 2 - 195, height / 2 - 15, 390 * (this.currentStep / this.assetsToGenerate.length), 30, 6);

            // Wait a brief frame to let UI refresh, then process next texture
            this.time.delayedCall(30, () => {
                this.generateNextAsset();
            });
        } else {
            // Done! Transition to main menu
            this.scene.start('MenuScene');
        }
    }

    // ==========================================
    // GRAPHICS GENERATORS USING CANVAS TEXTURES
    // ==========================================

    generateWoodBg() {
        const canvas = this.textures.createCanvas('wood_bg', 1280, 720);
        const ctx = canvas.context;

        // Base dark wood brown
        ctx.fillStyle = '#22110c';
        ctx.fillRect(0, 0, 1280, 720);

        // Planks separation lines
        ctx.strokeStyle = '#0f0705';
        ctx.lineWidth = 6;
        for (let y = 144; y < 720; y += 144) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(1280, y);
            ctx.stroke();
        }

        // Draw wood grains
        ctx.strokeStyle = '#2d1710';
        ctx.lineWidth = 3;
        for (let i = 0; i < 25; i++) {
            const yStart = Math.random() * 720;
            ctx.beginPath();
            ctx.moveTo(0, yStart);
            ctx.bezierCurveTo(420, yStart + 80 * (Math.random() - 0.5), 840, yStart + 80 * (Math.random() - 0.5), 1280, yStart);
            ctx.stroke();
        }

        // Add some random wood knots
        for (let i = 0; i < 4; i++) {
            const kx = Math.random() * 1280;
            const ky = Math.random() * 720;
            ctx.strokeStyle = '#2a150e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(kx, ky, 25, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(kx, ky, 15, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Vignette Shadow Overlay
        const vignette = ctx.createRadialGradient(640, 360, 200, 640, 360, 800);
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, 1280, 720);

        canvas.refresh();
    }

    generateApple() {
        // Whole Apple
        let canvas = this.textures.createCanvas('apple', 96, 96);
        let ctx = canvas.context;
        this.drawApplePath(ctx, 48, 48, 38, true);
        canvas.refresh();

        // Left Half
        canvas = this.textures.createCanvas('apple_left', 96, 96);
        ctx = canvas.context;
        this.drawAppleHalf(ctx, 'left', 0xff3b30, 0xfffcd3, 0x5e3f19);
        canvas.refresh();

        // Right Half
        canvas = this.textures.createCanvas('apple_right', 96, 96);
        ctx = canvas.context;
        this.drawAppleHalf(ctx, 'right', 0xff3b30, 0xfffcd3, 0x5e3f19);
        canvas.refresh();
    }

    drawApplePath(ctx, x, y, r, drawDetails) {
        // Draw apple body using two circles overlapping with a top/bottom dip
        ctx.save();
        const grad = ctx.createRadialGradient(x - r/3, y - r/3, r/6, x, y, r);
        grad.addColorStop(0, '#ff5e52');
        grad.addColorStop(0.8, '#ff2d55');
        grad.addColorStop(1, '#8b0000');
        ctx.fillStyle = grad;

        // Apple main body
        ctx.beginPath();
        // Top dip left bulb
        ctx.arc(x - r * 0.3, y, r, -Math.PI / 1.5, Math.PI / 1.2);
        // Bottom dip
        ctx.arc(x, y + r * 0.5, r * 0.5, Math.PI / 4, Math.PI * 0.75);
        // Top dip right bulb
        ctx.arc(x + r * 0.3, y, r, -Math.PI / 5, Math.PI * 1.6);
        ctx.closePath();
        ctx.fill();

        if (drawDetails) {
            // Shiny Gloss Highlight
            const gloss = ctx.createLinearGradient(x - r * 0.5, y - r * 0.5, x - r * 0.3, y - r * 0.1);
            gloss.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
            gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gloss;
            ctx.beginPath();
            ctx.ellipse(x - r * 0.4, y - r * 0.4, r * 0.3, r * 0.15, -Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();

            // Stem
            ctx.strokeStyle = '#5e3f19';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x, y - r * 0.8);
            ctx.quadraticCurveTo(x + 5, y - r * 1.2, x + 15, y - r * 1.3);
            ctx.stroke();

            // Leaf
            ctx.fillStyle = '#4cd964';
            ctx.beginPath();
            ctx.ellipse(x + 10, y - r * 1.15, 8, 4, Math.PI / 6, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawAppleHalf(ctx, side, skinColorHex, fleshColorHex, seedColorHex) {
        ctx.save();
        const cx = 48;
        const cy = 48;
        const r = 36;

        // Cut boundary mask: semicircle on the given side
        ctx.beginPath();
        if (side === 'left') {
            ctx.arc(cx, cy, r, -Math.PI/2, Math.PI/2, true); // Semicircle left
            ctx.lineTo(cx, cy - r);
        } else {
            ctx.arc(cx, cy, r, -Math.PI/2, Math.PI/2, false); // Semicircle right
            ctx.lineTo(cx, cy - r);
        }
        ctx.closePath();
        ctx.clip();

        // 1. Draw outer skin base
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(0, 0, 96, 96);
        ctx.fillStyle = '#ff2d55';
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // 2. Inner Flesh (Pale cream)
        ctx.fillStyle = '#fffdd0';
        ctx.beginPath();
        ctx.arc(cx, cy, r - 3, 0, Math.PI * 2); // Leaving skin border
        ctx.fill();

        // 3. Apple Core Outline (Slightly darker yellow-cream)
        ctx.strokeStyle = '#e6dfaf';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (side === 'left') {
            ctx.ellipse(cx - 3, cy, 6, 15, 0, 0, Math.PI * 2);
        } else {
            ctx.ellipse(cx + 3, cy, 6, 15, 0, 0, Math.PI * 2);
        }
        ctx.stroke();

        // 4. Seeds
        ctx.fillStyle = '#4a2f11';
        ctx.beginPath();
        if (side === 'left') {
            ctx.arc(cx - 5, cy, 3, 0, Math.PI * 2);
        } else {
            ctx.arc(cx + 5, cy, 3, 0, Math.PI * 2);
        }
        ctx.fill();

        ctx.restore();
    }

    generateOrange() {
        // Whole Orange
        let canvas = this.textures.createCanvas('orange', 96, 96);
        let ctx = canvas.context;
        ctx.save();
        // Radial gradient for 3D sphere look
        const grad = ctx.createRadialGradient(48 - 10, 48 - 10, 5, 48, 48, 38);
        grad.addColorStop(0, '#ffb833');
        grad.addColorStop(0.7, '#ff9500');
        grad.addColorStop(1, '#cc7600');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(48, 48, 38, 0, Math.PI * 2);
        ctx.fill();

        // Add orange dimples (texture dots)
        ctx.fillStyle = '#cc7600';
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 20; i++) {
            const rx = 48 + (Math.random() - 0.5) * 60;
            const ry = 48 + (Math.random() - 0.5) * 60;
            if (Phaser.Math.Distance.Between(48, 48, rx, ry) < 36) {
                ctx.beginPath();
                ctx.arc(rx, ry, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
        canvas.refresh();

        // Halves
        for (const side of ['left', 'right']) {
            canvas = this.textures.createCanvas(`orange_${side}`, 96, 96);
            ctx = canvas.context;
            ctx.save();
            ctx.beginPath();
            if (side === 'left') {
                ctx.arc(48, 48, 36, -Math.PI/2, Math.PI/2, true);
            } else {
                ctx.arc(48, 48, 36, -Math.PI/2, Math.PI/2, false);
            }
            ctx.closePath();
            ctx.clip();

            // Orange Skin Border
            ctx.fillStyle = '#ff9500';
            ctx.fillRect(0, 0, 96, 96);

            // White Rind Layer
            ctx.fillStyle = '#ffeedd';
            ctx.beginPath();
            ctx.arc(48, 48, 33, 0, Math.PI * 2);
            ctx.fill();

            // Citrus pulp base
            ctx.fillStyle = '#ff9500';
            ctx.beginPath();
            ctx.arc(48, 48, 31, 0, Math.PI * 2);
            ctx.fill();

            // Wedges radiating outward
            ctx.strokeStyle = '#ffeedd';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
                ctx.moveTo(48, 48);
                ctx.lineTo(48 + Math.cos(angle) * 31, 48 + Math.sin(angle) * 31);
            }
            ctx.stroke();

            // Center pith
            ctx.fillStyle = '#ffeedd';
            ctx.beginPath();
            ctx.arc(48, 48, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
            canvas.refresh();
        }
    }

    generateWatermelon() {
        // Whole Watermelon
        let canvas = this.textures.createCanvas('watermelon', 128, 128);
        let ctx = canvas.context;
        ctx.save();
        
        // Base dark green
        ctx.fillStyle = '#1b4a1b';
        ctx.beginPath();
        ctx.arc(64, 64, 55, 0, Math.PI * 2);
        ctx.fill();

        // Wavy stripes (lime green)
        ctx.strokeStyle = '#4cd964';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let xOffset = -40; xOffset <= 40; xOffset += 20) {
            ctx.beginPath();
            ctx.moveTo(64 + xOffset - 10, 15);
            ctx.bezierCurveTo(
                64 + xOffset + 15, 40,
                64 + xOffset - 15, 88,
                64 + xOffset + 10, 113
            );
            ctx.stroke();
        }

        // Add 3D Shading gloss
        const gloss = ctx.createLinearGradient(32, 32, 64, 64);
        gloss.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gloss;
        ctx.beginPath();
        ctx.arc(64, 64, 55, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        canvas.refresh();

        // Halves
        for (const side of ['left', 'right']) {
            canvas = this.textures.createCanvas(`watermelon_${side}`, 128, 128);
            ctx = canvas.context;
            ctx.save();
            ctx.beginPath();
            if (side === 'left') {
                ctx.arc(64, 64, 52, -Math.PI/2, Math.PI/2, true);
            } else {
                ctx.arc(64, 64, 52, -Math.PI/2, Math.PI/2, false);
            }
            ctx.closePath();
            ctx.clip();

            // Dark green skin rind
            ctx.fillStyle = '#1b4a1b';
            ctx.fillRect(0, 0, 128, 128);

            // Light green/white inner rind
            ctx.fillStyle = '#ddffdd';
            ctx.beginPath();
            ctx.arc(64, 64, 48, 0, Math.PI * 2);
            ctx.fill();

            // Pink-Red flesh
            ctx.fillStyle = '#ff2d55';
            ctx.beginPath();
            ctx.arc(64, 64, 44, 0, Math.PI * 2);
            ctx.fill();

            // Black seeds
            ctx.fillStyle = '#1a1a1a';
            const seedOffsets = [
                { dx: 15, dy: 10 }, { dx: 15, dy: -10 },
                { dx: 25, dy: 5 }, { dx: 25, dy: -5 },
                { dx: 32, dy: 18 }, { dx: 32, dy: -18 }
            ];

            seedOffsets.forEach(pos => {
                const targetX = side === 'left' ? 64 - pos.dx : 64 + pos.dx;
                ctx.beginPath();
                ctx.ellipse(targetX, 64 + pos.dy, 2.5, 4, (side === 'left' ? -1 : 1) * Math.PI / 6, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.restore();
            canvas.refresh();
        }
    }

    generateBanana() {
        // Whole Banana (Crescent shape)
        let canvas = this.textures.createCanvas('banana', 96, 96);
        let ctx = canvas.context;
        ctx.save();
        
        ctx.fillStyle = '#ffe600';
        ctx.strokeStyle = '#d4aa00';
        ctx.lineWidth = 1.5;

        // Draw a beautiful curved banana crescent
        ctx.beginPath();
        ctx.moveTo(15, 30);
        ctx.quadraticCurveTo(50, 75, 80, 25); // Outer curve
        ctx.quadraticCurveTo(45, 60, 15, 30); // Inner curve
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Dark brown tip & stem
        ctx.fillStyle = '#5c4308';
        ctx.beginPath();
        ctx.ellipse(15, 30, 3, 4, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(80, 25, 4, 3, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        canvas.refresh();

        // Halves
        for (const side of ['left', 'right']) {
            canvas = this.textures.createCanvas(`banana_${side}`, 96, 96);
            ctx = canvas.context;
            ctx.save();

            ctx.beginPath();
            if (side === 'left') {
                ctx.rect(0, 0, 48, 96);
            } else {
                ctx.rect(48, 0, 48, 96);
            }
            ctx.clip();

            // Re-draw whole banana outline
            ctx.fillStyle = '#ffe600';
            ctx.strokeStyle = '#d4aa00';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(15, 30);
            ctx.quadraticCurveTo(50, 75, 80, 25);
            ctx.quadraticCurveTo(45, 60, 15, 30);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Draw a flat cut slice circle at the cut line (x=48)
            ctx.fillStyle = '#fff9d4';
            ctx.strokeStyle = '#ffe600';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(48, 51, 8, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Tiny seed dots in cut core
            ctx.fillStyle = '#8f7724';
            ctx.beginPath();
            ctx.arc(48, 48, 1.5, 0, Math.PI * 2);
            ctx.arc(47, 53, 1, 0, Math.PI * 2);
            ctx.arc(49, 54, 1, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
            canvas.refresh();
        }
    }

    generateKiwi() {
        // Whole Kiwi (Brown furry circle)
        let canvas = this.textures.createCanvas('kiwi', 80, 80);
        let ctx = canvas.context;
        ctx.save();
        
        const grad = ctx.createRadialGradient(38, 38, 5, 40, 40, 32);
        grad.addColorStop(0, '#a6723c');
        grad.addColorStop(0.8, '#825527');
        grad.addColorStop(1, '#573715');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(40, 40, 32, 0, Math.PI * 2);
        ctx.fill();

        // Furry texture strokes
        ctx.strokeStyle = '#472b10';
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.4;
        for (let i = 0; i < 40; i++) {
            const rx = 40 + (Math.random() - 0.5) * 55;
            const ry = 40 + (Math.random() - 0.5) * 55;
            if (Phaser.Math.Distance.Between(40, 40, rx, ry) < 30) {
                ctx.beginPath();
                ctx.moveTo(rx, ry);
                ctx.lineTo(rx + (Math.random() - 0.5) * 5, ry + (Math.random() - 0.5) * 5);
                ctx.stroke();
            }
        }
        ctx.restore();
        canvas.refresh();

        // Halves
        for (const side of ['left', 'right']) {
            canvas = this.textures.createCanvas(`kiwi_${side}`, 80, 80);
            ctx = canvas.context;
            ctx.save();
            ctx.beginPath();
            if (side === 'left') {
                ctx.arc(40, 40, 30, -Math.PI/2, Math.PI/2, true);
            } else {
                ctx.arc(40, 40, 30, -Math.PI/2, Math.PI/2, false);
            }
            ctx.closePath();
            ctx.clip();

            // Kiwi skin
            ctx.fillStyle = '#825527';
            ctx.fillRect(0, 0, 80, 80);

            // Kiwi lime green flesh
            ctx.fillStyle = '#7cfc00';
            ctx.beginPath();
            ctx.arc(40, 40, 27, 0, Math.PI * 2);
            ctx.fill();

            // White central core
            ctx.fillStyle = '#faffdf';
            ctx.beginPath();
            ctx.ellipse(40, 40, 6, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            // Tiny black seeds arranged radially
            ctx.fillStyle = '#1c1c1c';
            const seedR = 11;
            for (let angle = -Math.PI/2.5; angle < Math.PI/2.5; angle += Math.PI / 10) {
                const targetAngle = side === 'left' ? Math.PI - angle : angle;
                const sx = 40 + Math.cos(targetAngle) * seedR;
                const sy = 40 + Math.sin(targetAngle) * seedR;
                ctx.beginPath();
                ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
            canvas.refresh();
        }
    }

    generatePineapple() {
        // Whole Pineapple (Golden cylinder cross-hatch, green leaf top)
        let canvas = this.textures.createCanvas('pineapple', 110, 110);
        let ctx = canvas.context;
        ctx.save();

        // Draw body (oval)
        const grad = ctx.createRadialGradient(55, 65, 10, 55, 65, 40);
        grad.addColorStop(0, '#ffe066');
        grad.addColorStop(0.7, '#e69900');
        grad.addColorStop(1, '#996600');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(55, 65, 34, 42, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cross-hatch patterns
        ctx.strokeStyle = '#664400';
        ctx.lineWidth = 1.8;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        // Diagonal line grid inside the ellipse bounds
        for (let i = -40; i <= 40; i += 15) {
            // Line tilted 30 deg left
            ctx.moveTo(55 + i - 20, 23);
            ctx.lineTo(55 + i + 20, 107);
            // Line tilted 30 deg right
            ctx.moveTo(55 + i + 20, 23);
            ctx.lineTo(55 + i - 20, 107);
        }
        ctx.stroke();

        // Draw green crown spikes on top
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#2d8a4e';
        ctx.beginPath();
        // Central tall leaf
        ctx.moveTo(55, 25);
        ctx.quadraticCurveTo(55, 5, 55, 0);
        ctx.quadraticCurveTo(60, 15, 60, 25);
        // Left leaf
        ctx.moveTo(50, 25);
        ctx.quadraticCurveTo(35, 10, 30, 8);
        ctx.quadraticCurveTo(42, 20, 48, 26);
        // Right leaf
        ctx.moveTo(60, 25);
        ctx.quadraticCurveTo(75, 10, 80, 8);
        ctx.quadraticCurveTo(68, 20, 62, 26);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
        canvas.refresh();

        // Halves
        for (const side of ['left', 'right']) {
            canvas = this.textures.createCanvas(`pineapple_${side}`, 110, 110);
            ctx = canvas.context;
            ctx.save();
            ctx.beginPath();
            if (side === 'left') {
                ctx.rect(0, 0, 55, 110);
            } else {
                ctx.rect(55, 0, 55, 110);
            }
            ctx.closePath();
            ctx.clip();

            // Re-draw whole body and crown
            ctx.fillStyle = '#e69900';
            ctx.beginPath();
            ctx.ellipse(55, 65, 34, 42, 0, 0, Math.PI * 2);
            ctx.fill();

            // Draw crown leaf
            ctx.fillStyle = '#2d8a4e';
            ctx.beginPath();
            ctx.moveTo(55, 25); ctx.quadraticCurveTo(55, 5, 55, 0); ctx.quadraticCurveTo(60, 15, 60, 25);
            ctx.moveTo(50, 25); ctx.quadraticCurveTo(35, 10, 30, 8); ctx.quadraticCurveTo(42, 20, 48, 26);
            ctx.moveTo(60, 25); ctx.quadraticCurveTo(75, 10, 80, 8); ctx.quadraticCurveTo(68, 20, 62, 26);
            ctx.fill();

            // Inside Flesh
            ctx.fillStyle = '#fff080';
            ctx.beginPath();
            ctx.ellipse(55, 65, 31, 39, 0, 0, Math.PI * 2);
            ctx.fill();

            // Fibrous core
            ctx.strokeStyle = '#ffd11a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(55, 65, 8, 22, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Fibrous radiating rays
            ctx.strokeStyle = '#e6bd00';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 6) {
                const startX = 55 + Math.cos(angle) * 8;
                const startY = 65 + Math.sin(angle) * 22;
                const endX = 55 + Math.cos(angle) * 28;
                const endY = 65 + Math.sin(angle) * 35;
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
            }
            ctx.stroke();

            ctx.restore();
            canvas.refresh();
        }
    }

    generateStrawberry() {
        // Whole Strawberry (Red heart/cone with seeds and green top)
        let canvas = this.textures.createCanvas('strawberry', 72, 72);
        let ctx = canvas.context;
        ctx.save();

        // Strawberry body (cone/heart shape)
        ctx.fillStyle = '#ff1a4a';
        ctx.beginPath();
        ctx.moveTo(36, 18);
        ctx.bezierCurveTo(15, 15, 12, 45, 36, 68); // Left bulb to tip
        ctx.bezierCurveTo(60, 45, 57, 15, 36, 18); // Right bulb to tip
        ctx.closePath();
        
        // Shadow/Glow radial fill
        const grad = ctx.createRadialGradient(28, 28, 5, 36, 40, 28);
        grad.addColorStop(0, '#ff4d6a');
        grad.addColorStop(0.8, '#d9002f');
        grad.addColorStop(1, '#8c001a');
        ctx.fillStyle = grad;
        ctx.fill();

        // Yellow seeds
        ctx.fillStyle = '#ffea79';
        const seedPoints = [
            {x: 36, y: 30}, {x: 28, y: 28}, {x: 44, y: 28},
            {x: 24, y: 38}, {x: 48, y: 38}, {x: 36, y: 42},
            {x: 30, y: 48}, {x: 42, y: 48}, {x: 36, y: 56}
        ];
        seedPoints.forEach(pt => {
            ctx.beginPath();
            ctx.ellipse(pt.x, pt.y, 1.2, 2.2, 0, 0, Math.PI*2);
            ctx.fill();
        });

        // Green leaf cap
        ctx.fillStyle = '#4cd964';
        ctx.beginPath();
        ctx.moveTo(36, 18);
        ctx.lineTo(26, 10);
        ctx.lineTo(31, 16);
        ctx.lineTo(36, 12);
        ctx.lineTo(41, 16);
        ctx.lineTo(46, 10);
        ctx.lineTo(36, 18);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
        canvas.refresh();

        // Halves
        for (const side of ['left', 'right']) {
            canvas = this.textures.createCanvas(`strawberry_${side}`, 72, 72);
            ctx = canvas.context;
            ctx.save();
            ctx.beginPath();
            if (side === 'left') {
                ctx.rect(0, 0, 36, 72);
            } else {
                ctx.rect(36, 0, 36, 72);
            }
            ctx.closePath();
            ctx.clip();

            // Re-draw skin base
            ctx.fillStyle = '#d9002f';
            ctx.beginPath();
            ctx.moveTo(36, 18);
            ctx.bezierCurveTo(15, 15, 12, 45, 36, 68);
            ctx.bezierCurveTo(60, 45, 57, 15, 36, 18);
            ctx.fill();

            // Green cap
            ctx.fillStyle = '#4cd964';
            ctx.beginPath();
            ctx.moveTo(36, 18); ctx.lineTo(26, 10); ctx.lineTo(31, 16); ctx.lineTo(36, 12); ctx.lineTo(41, 16); ctx.lineTo(46, 10);
            ctx.fill();

            // Inside flesh (pinkish white core, red exterior border)
            ctx.fillStyle = '#ffeef2';
            ctx.beginPath();
            ctx.moveTo(36, 21);
            ctx.bezierCurveTo(20, 20, 18, 43, 36, 63);
            ctx.bezierCurveTo(54, 43, 52, 20, 36, 21);
            ctx.fill();

            // Red radiation lines inside core
            ctx.strokeStyle = '#ff1a4a';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(36, 24);
            ctx.lineTo(36, 55);
            ctx.moveTo(36, 32);
            ctx.lineTo(side === 'left' ? 28 : 44, 34);
            ctx.moveTo(36, 42);
            ctx.lineTo(side === 'left' ? 29 : 43, 44);
            ctx.stroke();

            ctx.restore();
            canvas.refresh();
        }
    }

    generateGolden() {
        // Golden Fruit (Glossy metallic gold with stars)
        let canvas = this.textures.createCanvas('golden_fruit', 96, 96);
        let ctx = canvas.context;
        ctx.save();

        const grad = ctx.createRadialGradient(40, 40, 5, 48, 48, 38);
        grad.addColorStop(0, '#fff6bf');
        grad.addColorStop(0.4, '#ffd700');
        grad.addColorStop(0.8, '#d4af37');
        grad.addColorStop(1, '#aa7c11');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(48, 48, 38, 0, Math.PI * 2);
        ctx.fill();

        // Shiny gold streaks
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.arc(48, 48, 30, -Math.PI / 3, -Math.PI / 8);
        ctx.stroke();

        ctx.restore();
        canvas.refresh();

        // Halves
        for (const side of ['left', 'right']) {
            canvas = this.textures.createCanvas(`golden_fruit_${side}`, 96, 96);
            ctx = canvas.context;
            ctx.save();
            ctx.beginPath();
            if (side === 'left') {
                ctx.arc(48, 48, 36, -Math.PI/2, Math.PI/2, true);
            } else {
                ctx.arc(48, 48, 36, -Math.PI/2, Math.PI/2, false);
            }
            ctx.closePath();
            ctx.clip();

            // Gold border skin
            ctx.fillStyle = '#aa7c11';
            ctx.fillRect(0, 0, 96, 96);

            // Shiny gold inside
            const innerGrad = ctx.createRadialGradient(48, 48, 2, 48, 48, 33);
            innerGrad.addColorStop(0, '#ffffff');
            innerGrad.addColorStop(0.5, '#ffd700');
            innerGrad.addColorStop(1, '#ffc700');
            ctx.fillStyle = innerGrad;
            ctx.beginPath();
            ctx.arc(48, 48, 33, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
            canvas.refresh();
        }
    }

    generateFreeze() {
        // Freeze Fruit (Ice glass sphere with snowflake)
        let canvas = this.textures.createCanvas('freeze_fruit', 96, 96);
        let ctx = canvas.context;
        ctx.save();

        const grad = ctx.createRadialGradient(38, 38, 5, 48, 48, 38);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.5, '#b3f0ff');
        grad.addColorStop(0.9, '#00bfff');
        grad.addColorStop(1, '#008bb3');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(48, 48, 38, 0, Math.PI * 2);
        ctx.fill();

        // Glass highlight
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.55;
        ctx.beginPath();
        ctx.ellipse(36, 34, 18, 8, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // White Snowflake center
        ctx.globalAlpha = 0.9;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        // horizontal & vertical
        ctx.moveTo(48, 28); ctx.lineTo(48, 68);
        ctx.moveTo(28, 48); ctx.lineTo(68, 48);
        // diagonals
        ctx.moveTo(34, 34); ctx.lineTo(62, 62);
        ctx.moveTo(34, 62); ctx.lineTo(62, 34);
        ctx.stroke();

        ctx.restore();
        canvas.refresh();

        // Halves
        for (const side of ['left', 'right']) {
            canvas = this.textures.createCanvas(`freeze_fruit_${side}`, 96, 96);
            ctx = canvas.context;
            ctx.save();
            ctx.beginPath();
            if (side === 'left') {
                ctx.arc(48, 48, 36, -Math.PI/2, Math.PI/2, true);
            } else {
                ctx.arc(48, 48, 36, -Math.PI/2, Math.PI/2, false);
            }
            ctx.closePath();
            ctx.clip();

            // Ice border
            ctx.fillStyle = '#008bb3';
            ctx.fillRect(0, 0, 96, 96);

            // Light frost interior
            const innerGrad = ctx.createRadialGradient(48, 48, 2, 48, 48, 33);
            innerGrad.addColorStop(0, '#ffffff');
            innerGrad.addColorStop(0.7, '#e0f7fc');
            innerGrad.addColorStop(1, '#8ce4f5');
            ctx.fillStyle = innerGrad;
            ctx.beginPath();
            ctx.arc(48, 48, 33, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
            canvas.refresh();
        }
    }

    generateDouble() {
        // Double Score Fruit (Glowing neon magenta sphere with "x2" text)
        let canvas = this.textures.createCanvas('double_fruit', 96, 96);
        let ctx = canvas.context;
        ctx.save();

        const grad = ctx.createRadialGradient(38, 38, 5, 48, 48, 38);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, '#ff99ff');
        grad.addColorStop(0.8, '#bf00ff');
        grad.addColorStop(1, '#660080');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(48, 48, 38, 0, Math.PI * 2);
        ctx.fill();

        // Shiny glow
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.ellipse(36, 32, 20, 10, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw "x2" Text in white/neon yellow
        ctx.globalAlpha = 1;
        ctx.font = 'bold 36px Outfit';
        ctx.fillStyle = '#ffff00';
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 8;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('x2', 48, 48);

        ctx.restore();
        canvas.refresh();

        // Halves
        for (const side of ['left', 'right']) {
            canvas = this.textures.createCanvas(`double_fruit_${side}`, 96, 96);
            ctx = canvas.context;
            ctx.save();
            ctx.beginPath();
            if (side === 'left') {
                ctx.arc(48, 48, 36, -Math.PI/2, Math.PI/2, true);
            } else {
                ctx.arc(48, 48, 36, -Math.PI/2, Math.PI/2, false);
            }
            ctx.closePath();
            ctx.clip();

            ctx.fillStyle = '#660080';
            ctx.fillRect(0, 0, 96, 96);

            const innerGrad = ctx.createRadialGradient(48, 48, 2, 48, 48, 33);
            innerGrad.addColorStop(0, '#ffffff');
            innerGrad.addColorStop(0.7, '#ffccff');
            innerGrad.addColorStop(1, '#e600e6');
            ctx.fillStyle = innerGrad;
            ctx.beginPath();
            ctx.arc(48, 48, 33, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
            canvas.refresh();
        }
    }

    generateBomb() {
        // Bomb (Charcoal metal sphere, burning fuse)
        const canvas = this.textures.createCanvas('bomb', 96, 96);
        const ctx = canvas.context;
        ctx.save();

        // Metallic body
        const grad = ctx.createRadialGradient(38, 48, 5, 48, 54, 36);
        grad.addColorStop(0, '#4d4d4d');
        grad.addColorStop(0.6, '#262626');
        grad.addColorStop(1, '#0d0d0d');
        ctx.fillStyle = grad;
        
        ctx.beginPath();
        ctx.arc(48, 54, 34, 0, Math.PI * 2);
        ctx.fill();

        // Glossy metal shine highlight
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.ellipse(38, 40, 16, 7, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // Metal fuse holder bracket on top
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#808080';
        ctx.strokeStyle = '#404040';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.rect(40, 15, 16, 8);
        ctx.fill();
        ctx.stroke();

        // Fuse cord string curving up to the right
        ctx.strokeStyle = '#a68059';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(48, 15);
        ctx.quadraticCurveTo(55, 5, 68, 6);
        ctx.stroke();

        // Red skull marking on the bomb for warning vibe
        ctx.fillStyle = '#ff3b30';
        ctx.font = 'bold 22px Outfit';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☠', 48, 56);

        ctx.restore();
        canvas.refresh();
    }

    generateParticles() {
        // Juice Particle: White circle 10x10
        let canvas = this.textures.createCanvas('juice_particle', 10, 10);
        let ctx = canvas.context;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(5, 5, 4, 0, Math.PI * 2);
        ctx.fill();
        canvas.refresh();

        // Spark Particle: Star lens flare shape
        canvas = this.textures.createCanvas('spark_particle', 16, 16);
        ctx = canvas.context;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(8, 0); ctx.lineTo(10, 6); ctx.lineTo(16, 8); ctx.lineTo(10, 10);
        ctx.lineTo(8, 16); ctx.lineTo(6, 10); ctx.lineTo(0, 8); ctx.lineTo(6, 6);
        ctx.closePath();
        ctx.fill();
        canvas.refresh();

        // Smoke Particle: Radial soft transparent cloud
        canvas = this.textures.createCanvas('smoke_particle', 32, 32);
        ctx = canvas.context;
        const grad = ctx.createRadialGradient(16, 16, 2, 16, 16, 14);
        grad.addColorStop(0, 'rgba(230, 230, 230, 0.55)');
        grad.addColorStop(0.6, 'rgba(180, 180, 180, 0.25)');
        grad.addColorStop(1, 'rgba(120, 120, 120, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(16, 16, 16, 0, Math.PI * 2);
        ctx.fill();
        canvas.refresh();

        // Shockwave Ring: Empty circle outline
        canvas = this.textures.createCanvas('shockwave', 128, 128);
        ctx = canvas.context;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(64, 64, 60, 0, Math.PI * 2);
        ctx.stroke();
        canvas.refresh();
    }

    generateSplats() {
        const colors = ['#ffffff']; // White base (tinted dynamically)
        const sizes = [64, 80, 96];

        for (let i = 1; i <= 3; i++) {
            const size = sizes[i - 1];
            const center = size / 2;
            const canvas = this.textures.createCanvas(`splat_${i}`, size, size);
            const ctx = canvas.context;
            ctx.save();
            ctx.fillStyle = '#ffffff';

            // Central splat body
            ctx.beginPath();
            ctx.arc(center, center, size * 0.2, 0, Math.PI * 2);
            ctx.fill();

            // Draw organic droplet branches
            const branchCount = 6 + Math.floor(Math.random() * 4);
            for (let b = 0; b < branchCount; b++) {
                const angle = (b / branchCount) * Math.PI * 2 + Math.random() * 0.4;
                const dist = size * (0.2 + Math.random() * 0.22);
                const bx = center + Math.cos(angle) * dist;
                const by = center + Math.sin(angle) * dist;
                const bRadius = size * (0.04 + Math.random() * 0.08);

                ctx.beginPath();
                ctx.arc(bx, by, bRadius, 0, Math.PI * 2);
                ctx.fill();

                // Connecting stroke
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = bRadius * 1.5;
                ctx.beginPath();
                ctx.moveTo(center, center);
                ctx.lineTo(bx, by);
                ctx.stroke();
            }

            // Draw some tiny isolated splatter dots around
            for (let d = 0; d < 8; d++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = size * (0.35 + Math.random() * 0.13);
                const dx = center + Math.cos(angle) * dist;
                const dy = center + Math.sin(angle) * dist;
                ctx.beginPath();
                ctx.arc(dx, dy, size * 0.02, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
            canvas.refresh();
        }
    }

    generateUI() {
        // Red Heart for Lives
        let canvas = this.textures.createCanvas('heart', 48, 48);
        let ctx = canvas.context;
        ctx.save();
        ctx.fillStyle = '#ff2d55';
        ctx.beginPath();
        // Left lobe
        ctx.arc(16, 18, 12, Math.PI, 0);
        // Right lobe
        ctx.arc(32, 18, 12, Math.PI, 0);
        // Bottom tip
        ctx.lineTo(24, 42);
        ctx.closePath();
        ctx.fill();

        // Cute reflection shine
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.ellipse(12, 14, 5, 2.5, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        canvas.refresh();

        // Empty Heart (Gray outline)
        canvas = this.textures.createCanvas('heart_empty', 48, 48);
        ctx = canvas.context;
        ctx.save();
        ctx.strokeStyle = '#4f4441';
        ctx.fillStyle = '#261a18';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(16, 18, 12, Math.PI, 0);
        ctx.arc(32, 18, 12, Math.PI, 0);
        ctx.lineTo(24, 42);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        canvas.refresh();

        // 120x44 Button Background for Cam Toggle
        canvas = this.textures.createCanvas('button_bg', 120, 44);
        ctx = canvas.context;
        ctx.save();
        ctx.fillStyle = '#3d2314';
        ctx.strokeStyle = '#ff6b4a';
        ctx.lineWidth = 3;
        
        const bx = 1.5, by = 1.5, bw = 117, bh = 41, br = 10;
        ctx.beginPath();
        ctx.moveTo(bx + br, by);
        ctx.lineTo(bx + bw - br, by);
        ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + br);
        ctx.lineTo(bx + bw, by + bh - br);
        ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - br, by + bh);
        ctx.lineTo(bx + br, by + bh);
        ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - br);
        ctx.lineTo(bx, by + br);
        ctx.quadraticCurveTo(bx, by, bx + br, by);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        canvas.refresh();
    }
}
