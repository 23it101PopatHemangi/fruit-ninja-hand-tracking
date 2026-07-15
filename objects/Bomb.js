export default class Bomb extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bomb');
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.radius = 32;
        this.weight = 1.2;
        this.isSliced = false;

        // Configure physics body
        this.setCircle(this.radius, (this.width - this.radius * 2) / 2, (this.height - this.radius * 2) / 2);
        this.body.setGravityY(500 * this.weight);
        
        // Render depth
        this.setDepth(11); // Slightly in front of standard fruits
    }

    /**
     * Launches the bomb upward from the bottom of the screen
     */
    launch(launchSpeedXMultiplier = 1) {
        const startY = 750;
        this.setY(startY);

        const vy = -Phaser.Math.Between(660, 840);
        let vx = Phaser.Math.Between(50, 160);
        if (this.x > 640) {
            vx = -vx;
        }
        
        vx *= launchSpeedXMultiplier;

        this.setVelocity(vx, vy);

        // Spin torque
        this.setAngularVelocity(Phaser.Math.Between(-180, 180));

        this.isSliced = false;
        this.setActive(true);
        this.setVisible(true);
    }

    /**
     * Emits sparks from the fuse at the rotating tip of the bomb
     */
    updateBomb(particleManager) {
        if (!this.active || this.isSliced) return;

        // Calculate position of the fuse (top-right of bomb, rotating with it)
        const fuseDistance = 26;
        const fuseOffsetAngle = -Math.PI / 4.5; // roughly 40 degrees offset from sprite top
        const angle = this.rotation + fuseOffsetAngle;
        
        const fuseX = this.x + Math.cos(angle) * fuseDistance;
        const fuseY = this.y + Math.sin(angle) * fuseDistance;

        // Explode 1 fuse spark particle per frame
        if (particleManager && particleManager.fuseEmitter) {
            particleManager.fuseEmitter.explode(1, fuseX, fuseY);
        }
    }

    /**
     * Triggered when sliced. Immediately ends active state, returns true.
     */
    slice() {
        if (this.isSliced) return false;
        this.isSliced = true;

        this.setActive(false);
        this.setVisible(false);
        this.destroy();
        
        return true;
    }

    /**
     * Bounds check to see if bomb fell below screen uncut
     */
    checkOutOfBounds() {
        if (this.y > 760 && this.body.velocity.y > 0) {
            return true;
        }
        return false;
    }
}
