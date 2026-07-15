export default class CameraTracking {
    constructor() {
        this.isTrackingActive = false;
        
        // Target hand coordinates mapped to the 1280x720 Phaser resolution
        this.handX = 640;
        this.handY = 360;
        this.isHandVisible = false;

        // HTML elements resolved dynamically
        this.videoElement = null;
        this.containerElement = null;
        
        this.handsModel = null;
        
        // Listeners for scene state updates
        this.onStateChangeCallbacks = [];
    }

    /**
     * Registers a callback that receives tracking state updates
     */
    registerStateCallback(callback) {
        this.onStateChangeCallbacks.push(callback);
    }

    /**
     * Initializes and starts the camera hand tracking using standard navigator.mediaDevices
     */
    async startTracking() {
        if (this.isTrackingActive) return true;

        // Fetch elements dynamically at run-time to avoid timing/race conditions
        this.videoElement = document.getElementById('webcam');
        this.containerElement = document.getElementById('webcam-container');

        if (!this.videoElement || !this.containerElement) {
            alert("Webcam DOM elements not found! Check index.html markup.");
            return false;
        }

        // Verify MediaPipe Hands library is loaded
        if (!window.Hands) {
            alert("MediaPipe Hands library is not loaded on the window object (window.Hands is undefined). Check internet connectivity.");
            return false;
        }

        try {
            // Update UI status to loading
            const statusText = this.containerElement.querySelector('.status-text');
            if (statusText) statusText.innerText = "CAMERA LOADING...";
            
            this.containerElement.style.display = 'block';

            // 1. Initialize MediaPipe Hands model
            if (!this.handsModel) {
                this.handsModel = new window.Hands({
                    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`
                });

                this.handsModel.setOptions({
                    maxNumHands: 1,
                    modelComplexity: 1,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });

                this.handsModel.onResults(this.onResults.bind(this));
            }

            // 2. Request webcam stream using standard HTML5 MediaDevices API
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 320 }, 
                    height: { ideal: 240 },
                    frameRate: { ideal: 30 }
                },
                audio: false
            });

            this.videoElement.srcObject = stream;
            
            // Wait for video element to start playing
            await new Promise((resolve) => {
                this.videoElement.onloadedmetadata = () => {
                    this.videoElement.play().then(resolve);
                };
            });

            this.isTrackingActive = true;

            // 3. Start custom frame processing loop using requestAnimationFrame
            const processFrame = async () => {
                if (!this.isTrackingActive) return;
                
                try {
                    // ReadyState 4 means HAVE_ENOUGH_DATA (frame is ready to process)
                    if (this.videoElement && this.videoElement.readyState === 4) {
                        await this.handsModel.send({ image: this.videoElement });
                    }
                } catch (err) {
                    console.warn("Frame processing error:", err);
                }
                
                // Request next frame recursively
                requestAnimationFrame(processFrame);
            };

            requestAnimationFrame(processFrame);

            if (statusText) statusText.innerText = "HAND TRACKING ACTIVE";
            this.triggerStateChange(true);
            return true;

        } catch (error) {
            console.error("Webcam startup failed:", error);
            alert("Webcam startup failed: " + error.message);
            this.stopTracking();
            return false;
        }
    }

    /**
     * Stops the camera feed and hides the preview panel
     */
    stopTracking() {
        this.isTrackingActive = false;
        this.isHandVisible = false;

        this.videoElement = document.getElementById('webcam');
        this.containerElement = document.getElementById('webcam-container');

        // Stop camera stream tracks
        if (this.videoElement && this.videoElement.srcObject) {
            try {
                const stream = this.videoElement.srcObject;
                const tracks = stream.getTracks();
                tracks.forEach(track => track.stop());
                this.videoElement.srcObject = null;
            } catch (e) {
                console.warn("Error stopping camera tracks:", e);
            }
        }

        // Hide floating panel
        if (this.containerElement) {
            this.containerElement.style.display = 'none';
        }

        this.triggerStateChange(false);
    }

    /**
     * Toggles the camera tracking state
     */
    async toggleTracking() {
        if (this.isTrackingActive) {
            this.stopTracking();
            return false;
        } else {
            return await this.startTracking();
        }
    }

    /**
     * MediaPipe callback that receives frame hand landmark coordinates
     */
    onResults(results) {
        if (!this.isTrackingActive) return;

        const hasHand = results.multiHandLandmarks && results.multiHandLandmarks.length > 0;
        
        if (hasHand) {
            this.isHandVisible = true;

            // Get Landmark 8: Index Finger Tip
            const indexFingerTip = results.multiHandLandmarks[0][8];

            // Map coordinates:
            // - landmark.x goes 0.0 (left of feed) to 1.0 (right of feed)
            // - Since camera is mirrored, we invert X (1 - x) to match natural movements
            const mappedX = (1 - indexFingerTip.x) * 1280;
            const mappedY = indexFingerTip.y * 720;

            // Apply standard linear smoothing to coordinates to reduce jitter
            const smoothing = 0.35;
            this.handX = this.handX + (mappedX - this.handX) * smoothing;
            this.handY = this.handY + (mappedY - this.handY) * smoothing;
        } else {
            this.isHandVisible = false;
        }

        // Update status dot visual in preview panel
        if (this.containerElement) {
            const statusDot = this.containerElement.querySelector('.status-dot');
            if (statusDot) {
                statusDot.style.backgroundColor = this.isHandVisible ? '#39ff14' : '#ff3b30';
                statusDot.style.boxShadow = this.isHandVisible ? '0 0 8px #39ff14' : '0 0 8px #ff3b30';
            }
        }
    }

    /**
     * Fires callbacks when camera starts/stops
     */
    triggerStateChange(state) {
        this.onStateChangeCallbacks.forEach(cb => {
            try { cb(state); } catch (e) { console.error(e); }
        });
    }
}
