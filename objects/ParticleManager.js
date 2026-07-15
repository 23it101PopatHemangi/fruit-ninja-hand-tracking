export default class ParticleManager {
    constructor(scene) {
        this.scene = scene;

        // Container to place background wall splats (so they sit behind fruits but above background)
        this.splatLayer = scene.add.container();
        this.splatLayer.setDepth(5); // Under fruits (depth 10) and blades (depth 50)

        // Create Particle Emitter Managers / Emitters
        // Juice Emitter for fruit slices
        this.juiceEmitter = scene.add.particles(0, 0, 'juice_particle', {
            lifespan: { min: 400, max: 800 },
            speed: { min: 150, max: 400 },
            scale: { start: 0.8, end: 0.1 },
            alpha: { start: 1, end: 0 },
            gravityY: 700,
            blendMode: 'NORMAL',
            emitting: false
        });
        this.juiceEmitter.setDepth(15); // Above fruits (depth 10)

        // Spark Emitter for metal/bomb slices or general hits
        this.sparkEmitter = scene.add.particles(0, 0, 'spark_particle', {
            lifespan: { min: 200, max: 500 },
            speed: { min: 200, max: 600 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0.1 },
            alpha: { start: 1, end: 0 },
            gravityY: 300,
            blendMode: 'ADD',
            emitting: false
        });
        this.sparkEmitter.setDepth(55); // Above blades

        // Smoke Emitter for Bomb fuses and explosions
        this.smokeEmitter = scene.add.particles(0, 0, 'smoke_particle', {
            lifespan: { min: 600, max: 1200 },
            speed: { min: 20, max: 100 },
            scale: { start: 0.5, end: 1.5 },
            alpha: { start: 0.4, end: 0 },
            gravityY: -50,
            blendMode: 'NORMAL',
            emitting: false
        });
        this.smokeEmitter.setDepth(12);
        
        // Bomb Fuse Spark Emitter
        this.fuseEmitter = scene.add.particles(0, 0, 'spark_particle', {
            lifespan: { min: 100, max: 300 },
            speed: { min: 50, max: 150 },
            scale: { start: 0.6, end: 0.1 },
            tint: 0xffaa00,
            blendMode: 'ADD',
            emitting: false
        });
        this.fuseEmitter.setDepth(13);
    }

    /**
     * Spawns an explosion of colored juice particles at slice location
     */
    emitJuice(x, y, colorHex) {
        // Explode sets the emitter's configuration and fires particles immediately
        this.juiceEmitter.setConfig({
            tint: colorHex,
            scale: { start: 0.8 + Math.random() * 0.4, end: 0.05 }
        });
        this.juiceEmitter.explode(15 + Math.floor(Math.random() * 10), x, y);
    }

    /**
     * Spawns metal sparks (used when cutting bombs or critical slices)
     */
    emitSparks(x, y, color = 0xffffff) {
        this.sparkEmitter.setConfig({
            tint: color
        });
        this.sparkEmitter.explode(20, x, y);
    }

    /**
     * Spawns a background wall splat that represents juice dripping on the background
     */
    spawnWallSplat(x, y, colorHex) {
        // Randomly select one of our pre-generated splat styles
        const splatStyles = ['splat_1', 'splat_2', 'splat_3'];
        const randomStyle = Phaser.Utils.Array.GetRandom(splatStyles);

        const splatSprite = this.scene.add.image(x, y, randomStyle);
        splatSprite.setTint(colorHex);
        splatSprite.setAlpha(0.75);
        splatSprite.setAngle(Phaser.Math.Between(0, 360));
        
        // Random size variation
        const scale = Phaser.Math.FloatBetween(0.5, 1.2);
        splatSprite.setScale(scale);

        // Add to splat layer
        this.splatLayer.add(splatSprite);

        // Splat drip effect: slides down slightly then fades out
        this.scene.tweens.add({
            targets: splatSprite,
            y: y + Phaser.Math.Between(15, 40),
            alpha: 0,
            scale: scale * 0.9,
            duration: Phaser.Math.Between(6000, 10000), // Fades out over 6-10 seconds
            ease: 'Quad.easeOut',
            onComplete: () => {
                splatSprite.destroy();
            }
        });
    }

    /**
     * Triggers a screen-shaking bomb explosion
     */
    emitBombExplosion(x, y) {
        // 1. Massive smoke cloud
        this.smokeEmitter.explode(40, x, y);
        
        // 2. Bright fire/fuse sparks
        this.sparkEmitter.setConfig({
            tint: [0xff0000, 0xffaa00, 0xffff00]
        });
        this.sparkEmitter.explode(60, x, y);

        // 3. Shockwave ring effect
        const shockwave = this.scene.add.image(x, y, 'shockwave');
        shockwave.setDepth(40);
        shockwave.setAlpha(0.8);
        shockwave.setTint(0xffeedd);
        shockwave.setScale(0.1);

        this.scene.tweens.add({
            targets: shockwave,
            scale: 3.5,
            alpha: 0,
            duration: 600,
            ease: 'Quad.easeOut',
            onComplete: () => {
                shockwave.destroy();
            }
        });

        // 4. White flash effect overlay
        const flash = this.scene.add.rectangle(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0xffffff
        );
        flash.setDepth(99);
        flash.setAlpha(1);

        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 500,
            ease: 'Quad.easeIn',
            onComplete: () => {
                flash.destroy();
            }
        });
    }

    /**
     * Clears all background splats immediately
     */
    clearAllSplats() {
        this.splatLayer.removeAll(true);
    }
}
