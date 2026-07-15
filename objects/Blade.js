export default class Blade extends Phaser.GameObjects.Graphics {
    constructor(scene) {
        super(scene);
        scene.add.existing(this);

        // History of pointer coordinates
        this.points = [];
        // Max points to keep in history for the trail
        this.maxPoints = 12;
        // Minimum distance between points to record new history
        this.minDistance = 5;
        // Speed threshold to consider it an active slice (pixels per millisecond)
        this.speedThreshold = 0.2;
        
        // Colors for blade types (customizable or changes based on power-ups!)
        this.glowColor = 0x00ffff; // Default cyan glow
        this.innerColor = 0xffffff; // Core white line
        this.isActiveSlice = false;

        // Set depth to render above everything except the HUD UI
        this.setDepth(50);
    }

    /**
     * Start the blade trail tracking
     */
    start(pointer) {
        this.points = [];
        this.addPoint(pointer);
        this.isActiveSlice = false;
        this.clear();
    }

    /**
     * Update called every frame to update points, calculate velocity, and draw the trail
     */
    updateBlade(pointer, time, delta) {
        if (!pointer.isDown) {
            // Decay trail if pointer is released
            if (this.points.length > 0) {
                this.points.shift();
                this.drawTrail();
            } else {
                this.clear();
                this.isActiveSlice = false;
            }
            return;
        }

        this.addPoint(pointer);
        this.calculateVelocity(delta);
        this.drawTrail();
    }

    /**
     * Adds a coordinate to history if it exceeds minimum distance
     */
    addPoint(pointer) {
        const x = pointer.x;
        const y = pointer.y;
        const time = Date.now();

        if (this.points.length > 0) {
            const lastPoint = this.points[this.points.length - 1];
            const dist = Phaser.Math.Distance.Between(lastPoint.x, lastPoint.y, x, y);
            
            // Only add if pointer has moved enough
            if (dist < this.minDistance) {
                return;
            }
        }

        this.points.push({ x, y, time });

        // Keep history size in check
        if (this.points.length > this.maxPoints) {
            this.points.shift();
        }
    }

    calculateVelocity(delta) {
        if (this.points.length < 2) {
            this.isActiveSlice = false;
            return;
        }

        // For very short trails, check the last 2 points
        if (this.points.length < 3) {
            const p1 = this.points[0];
            const p2 = this.points[1];
            const distance = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
            const timeDelta = p2.time - p1.time || delta;
            this.isActiveSlice = (distance / timeDelta) >= this.speedThreshold;
            return;
        }

        // Smooth out sub-frame jitter by calculating speed across the last 3 recorded coordinates
        const p1 = this.points[this.points.length - 3];
        const p2 = this.points[this.points.length - 1];
        
        const distance = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
        const timeDelta = p2.time - p1.time;

        if (timeDelta > 0) {
            const speed = distance / timeDelta;
            this.isActiveSlice = speed >= this.speedThreshold;
        } else {
            this.isActiveSlice = true; // Fallback to true if time is 0 (mouse moved instantly)
        }
    }

    /**
     * Sets the glowing color of the blade
     */
    setGlowColor(color) {
        this.glowColor = color;
    }

    /**
     * Renders the neon sword trail using dual-line drawing for maximum visual polish
     */
    drawTrail() {
        this.clear();

        if (this.points.length < 2) return;

        // Draw Outer Glow (Thicker and Transparent)
        this.lineStyle(12, this.glowColor, 0.4);
        this.beginPath();
        this.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            this.lineTo(this.points[i].x, this.points[i].y);
        }
        this.strokePath();

        // Draw Inner Blade (Thinner and Opaque/White)
        this.lineStyle(4, this.innerColor, 0.9);
        this.beginPath();
        this.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            // Adjust width near the tip (makes it taper off at the end)
            const width = Phaser.Math.Linear(1, 6, i / this.points.length);
            this.lineStyle(width, this.innerColor, 0.9 * (i / this.points.length));
            this.lineTo(this.points[i].x, this.points[i].y);
        }
        this.strokePath();
    }

    /**
     * Tests if the blade intersects a target circle object (fruit/bomb)
     * Returns the intersection details (angle and velocity) if true, null otherwise.
     */
    checkIntersection(gameObject) {
        if (!this.isActiveSlice || this.points.length < 2) {
            return null;
        }

        // Get collision circle for the fruit
        const cx = gameObject.x;
        const cy = gameObject.y;
        const radius = gameObject.radius || (gameObject.width * 0.5);
        const circle = new Phaser.Geom.Circle(cx, cy, radius);

        // We check the intersection against the last 2 line segments of pointer history
        const checkCount = Math.min(this.points.length - 1, 3);
        
        for (let i = this.points.length - 1; i > this.points.length - 1 - checkCount; i--) {
            if (i <= 0) break;
            
            const p1 = this.points[i - 1];
            const p2 = this.points[i];
            
            const line = new Phaser.Geom.Line(p1.x, p1.y, p2.x, p2.y);
            
            if (Phaser.Geom.Intersects.LineToCircle(line, circle)) {
                // Slice successfully detected!
                // Calculate properties to send to the split animations
                const sliceAngle = Phaser.Math.Angle.Between(p1.x, p1.y, p2.x, p2.y);
                const velocityX = (p2.x - p1.x) / (p2.time - p1.time || 16.6) * 10;
                const velocityY = (p2.y - p1.y) / (p2.time - p1.time || 16.6) * 10;
                
                return {
                    angle: sliceAngle,
                    vx: velocityX,
                    vy: velocityY,
                    x: cx, // Collision point approximate
                    y: cy
                };
            }
        }

        return null;
    }

    /**
     * Resets the blade trail points
     */
    resetTrail() {
        this.points = [];
        this.clear();
        this.isActiveSlice = false;
    }
}
