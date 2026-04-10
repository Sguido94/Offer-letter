/**
 * Confetti + Fireworks splash screen
 * Full-screen celebration that reveals the offer letter
 */
(function () {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const splash = document.getElementById('splash');

    // Brand colors for confetti
    const colors = [
        '#7036FF', // purple
        '#9B6DFF', // light purple
        '#FD742F', // orange
        '#E9EBD6', // green accent
        '#FAF8F5', // paper/white
        '#FFD700', // gold
        '#FF6B9D', // pink
        '#44094A', // dark purple
    ];

    let particles = [];
    let fireworks = [];
    let W, H;
    let animFrame;
    let startTime;

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // ---- Confetti particle ----
    class Confetti {
        constructor(x, y) {
            this.x = x || Math.random() * W;
            this.y = y || -10;
            this.w = Math.random() * 10 + 6;
            this.h = Math.random() * 5 + 3;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.vx = (Math.random() - 0.5) * 4;
            this.vy = Math.random() * 3 + 2;
            this.rot = Math.random() * 360;
            this.rotSpeed = (Math.random() - 0.5) * 12;
            this.opacity = 1;
            this.shape = Math.random() > 0.5 ? 'rect' : 'circle';
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.04; // gravity
            this.rot += this.rotSpeed;
            this.vx *= 0.99;
        }
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate((this.rot * Math.PI) / 180);
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            if (this.shape === 'rect') {
                ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, this.w / 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    // ---- Firework burst ----
    class FireworkParticle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 6 + 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.life = 1;
            this.decay = Math.random() * 0.02 + 0.015;
            this.size = Math.random() * 3 + 2;
            this.trail = [];
        }
        update() {
            this.trail.push({ x: this.x, y: this.y, life: this.life });
            if (this.trail.length > 5) this.trail.shift();
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.06;
            this.vx *= 0.98;
            this.life -= this.decay;
        }
        draw() {
            // Trail
            this.trail.forEach((t, i) => {
                ctx.globalAlpha = t.life * 0.3 * (i / this.trail.length);
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(t.x, t.y, this.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
            });
            // Main particle
            ctx.globalAlpha = this.life;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            // Glow
            ctx.globalAlpha = this.life * 0.3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function burst(x, y, count) {
        for (let i = 0; i < count; i++) {
            fireworks.push(new FireworkParticle(x, y));
        }
        // Also spawn confetti from the burst
        for (let i = 0; i < 15; i++) {
            const c = new Confetti(x, y);
            c.vx = (Math.random() - 0.5) * 8;
            c.vy = Math.random() * -4 - 1;
            particles.push(c);
        }
    }

    // Schedule firework bursts — boom boom boom
    const burstSchedule = [
        { time: 200,  x: () => W * 0.3, y: () => H * 0.25, count: 50 },
        { time: 600,  x: () => W * 0.7, y: () => H * 0.2,  count: 60 },
        { time: 1000, x: () => W * 0.5, y: () => H * 0.3,  count: 70 },
        { time: 1400, x: () => W * 0.2, y: () => H * 0.35, count: 45 },
        { time: 1700, x: () => W * 0.8, y: () => H * 0.25, count: 55 },
        { time: 2100, x: () => W * 0.5, y: () => H * 0.2,  count: 80 },
    ];
    let burstIndex = 0;

    // Also rain confetti from the top continuously
    let confettiInterval = setInterval(() => {
        for (let i = 0; i < 5; i++) {
            particles.push(new Confetti());
        }
    }, 100);

    // ---- Animation loop ----
    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;

        ctx.clearRect(0, 0, W, H);

        // Trigger scheduled bursts
        while (burstIndex < burstSchedule.length && elapsed >= burstSchedule[burstIndex].time) {
            const b = burstSchedule[burstIndex];
            burst(b.x(), b.y(), b.count);
            burstIndex++;
        }

        // Update and draw firework particles
        fireworks = fireworks.filter(p => p.life > 0);
        fireworks.forEach(p => { p.update(); p.draw(); });

        // Update and draw confetti
        particles = particles.filter(p => p.y < H + 50 && p.opacity > 0);
        particles.forEach(p => { p.update(); p.draw(); });

        ctx.globalAlpha = 1;

        // After 3.5 seconds, start fading out the splash
        if (elapsed > 3500) {
            const fadeProgress = Math.min((elapsed - 3500) / 800, 1);
            splash.style.opacity = 1 - fadeProgress;

            if (fadeProgress >= 1) {
                // Done — remove splash and stop animation
                clearInterval(confettiInterval);
                splash.style.display = 'none';
                cancelAnimationFrame(animFrame);
                return;
            }
        }

        animFrame = requestAnimationFrame(animate);
    }

    // Kick it off
    animFrame = requestAnimationFrame(animate);

    // Initial burst of confetti
    for (let i = 0; i < 40; i++) {
        particles.push(new Confetti());
    }
})();
