export default class Fruit extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, type = 'apple') {
        // Initialize the sprite with the whole fruit texture
        super(scene, x, y, type);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.fruitType = type;
        this.isSliced = false;

        // Configure fruit-specific metrics (weight, score, particle color, power-ups)
        this.setupFruitProperties();

        // Physics configurations
        this.setCircle(this.radius, (this.width - this.radius * 2) / 2, (this.height - this.radius * 2) / 2);
        this.body.setGravityY(500 * this.weight); // Scale gravity by weight
        
        // Render depth
        this.setDepth(10);
    }

    /**
     * Define variables for size, score, weight, and juice colors for each type
     */
    setupFruitProperties() {
        const props = {
            apple: { radius: 36, weight: 1.0, score: 10, juiceColor: 0xff1e1e },
            orange: { radius: 36, weight: 1.1, score: 15, juiceColor: 0xff7700 },
            watermelon: { radius: 55, weight: 1.6, score: 30, juiceColor: 0xff1e56 },
            banana: { radius: 32, weight: 0.9, score: 15, juiceColor: 0xffe600 },
            kiwi: { radius: 30, weight: 0.8, score: 20, juiceColor: 0x5cd63d },
            pineapple: { radius: 48, weight: 1.4, score: 40, juiceColor: 0xffb700 },
            strawberry: { radius: 26, weight: 0.7, score: 15, juiceColor: 0xff1a4a },
            
            // Bonus Fruits
            golden: { radius: 36, weight: 1.1, score: 100, juiceColor: 0xffd700, isPowerUp: true, powerUpType: 'golden' },
            freeze: { radius: 36, weight: 0.9, score: 10, juiceColor: 0x00dfff, isPowerUp: true, powerUpType: 'freeze' },
            double: { radius: 36, weight: 1.0, score: 15, juiceColor: 0xbf00ff, isPowerUp: true, powerUpType: 'double' }
        };

        const config = props[this.fruitType] || props['apple'];
        
        this.radius = config.radius;
        this.weight = config.weight;
        this.scoreValue = config.score;
        this.juiceColor = config.juiceColor;
        this.isPowerUp = config.isPowerUp || false;
        this.powerUpType = config.powerUpType || null;
    }

    /**
     * Launches the fruit from the bottom with velocities pointing towards center
     */
    launch(launchSpeedXMultiplier = 1) {
        // Decide spawn position: bottom of screen
        const startY = 750;
        this.setY(startY);

        // Throw fruit upwards with random force
        const vy = -Phaser.Math.Between(680, 880);
        
        // Aim horizontal velocity towards the center of the screen
        let vx = Phaser.Math.Between(50, 180);
        if (this.x > 640) {
            vx = -vx;
        }
        
        // Apply slight random adjustments to trajectory
        vx *= launchSpeedXMultiplier;

        this.setVelocity(vx, vy);

        // Add a natural rotational spin (torque)
        const spin = Phaser.Math.Between(-250, 250);
        this.setAngularVelocity(spin);

        this.isSliced = false;
        this.setActive(true);
        this.setVisible(true);
    }

    /**
     * Slices the fruit, spawns two falling halves, emits particles, and awards points
     */
    slice(sliceData) {
        if (this.isSliced) return null;
        this.isSliced = true;

        const { angle, vx, vy } = sliceData;

        // Create the left and right halves
        this.createHalf('left', angle, vx, vy);
        this.createHalf('right', angle, vx, vy);

        // Deactivate and destroy the main fruit
        this.setActive(false);
        this.setVisible(false);
        
        // Return scoring and particle properties
        const sliceResult = {
            score: this.scoreValue,
            juiceColor: this.juiceColor,
            isPowerUp: this.isPowerUp,
            powerUpType: this.powerUpType,
            type: this.fruitType
        };

        this.destroy();
        return sliceResult;
    }

    /**
     * Creates a spinning, falling half of the fruit
     */
    createHalf(side, sliceAngle, bladeVx, bladeVy) {
        const textureName = `${this.fruitType}_${side}`;
        
        // Position slightly offset from the center based on the side
        const offsetDist = 12;
        const dx = Math.cos(sliceAngle + (side === 'left' ? -Math.PI / 2 : Math.PI / 2)) * offsetDist;
        const dy = Math.sin(sliceAngle + (side === 'left' ? -Math.PI / 2 : Math.PI / 2)) * offsetDist;

        const half = this.scene.physics.add.sprite(this.x + dx, this.y + dy, textureName);
        half.setDepth(9); // Slices fall slightly behind whole fruits
        
        // Orient the cut face matching the slice angle
        half.setRotation(this.rotation);

        // Calculate outward eject velocity
        const pushForce = 220;
        const pushAngle = sliceAngle + (side === 'left' ? -Math.PI / 2 : Math.PI / 2);
        
        // Combine current fruit speed with slice momentum and push force
        const halfVx = this.body.velocity.x * 0.5 + Math.cos(pushAngle) * pushForce + bladeVx * 0.2;
        const halfVy = this.body.velocity.y * 0.5 + Math.sin(pushAngle) * pushForce - 100; // Slight pop upward

        half.setVelocity(halfVx, halfVy);
        half.body.setGravityY(600 * this.weight);

        // Give them high rotational spins in opposite directions
        const spinDirection = side === 'left' ? -1 : 1;
        half.setAngularVelocity(spinDirection * Phaser.Math.Between(250, 450));

        // Fade out and clean up
        this.scene.tweens.add({
            targets: half,
            alpha: 0,
            duration: 1200,
            delay: 400,
            onComplete: () => {
                half.destroy();
            }
        });
    }

    /**
     * Bounds check to see if fruit fell off the bottom of the screen uncut
     */
    checkOutOfBounds() {
        // If fruit fell below the screen height and is moving down, it's missed
        if (this.y > 760 && this.body.velocity.y > 0) {
            return true;
        }
        return false;
    }
}
