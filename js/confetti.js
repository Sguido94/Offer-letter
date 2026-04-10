/**
 * Splash screen: motion video → logo reveal → fade out
 * Confetti: triggered by "I accept!" button
 */
(function () {
    // ==========================================
    // SPLASH — video plays, logo fades in, then out
    // ==========================================
    const splash = document.getElementById('splash');
    if (splash) {
        const logoEl = document.getElementById('splashLogo');

        // Show logo after 2s
        setTimeout(() => {
            if (logoEl) logoEl.classList.add('visible');
        }, 2000);

        // Fade out splash after 4s
        setTimeout(() => {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.style.display = 'none';
            }, 800);
        }, 4000);
    }

    // ==========================================
    // CONFETTI — celebration on "I accept!"
    // ==========================================
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const colors = [
        '#7036FF', '#9B6DFF', '#FD742F', '#E9EBD6',
        '#FAF8F5', '#FFD700', '#FF6B9D', '#44094A',
    ];

    let particles = [];
    let fireworks = [];
    let W, H;
    let animFrame;
    let confettiInterval;

    function resize() {
        W = canvas.width = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

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
            this.vy += 0.04;
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
            this.trail.forEach((t, i) => {
                ctx.globalAlpha = t.life * 0.3 * (i / this.trail.length);
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(t.x, t.y, this.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = this.life;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
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
        for (let i = 0; i < 15; i++) {
            const c = new Confetti(x, y);
            c.vx = (Math.random() - 0.5) * 8;
            c.vy = Math.random() * -4 - 1;
            particles.push(c);
        }
    }

    function animate(timestamp) {
        ctx.clearRect(0, 0, W, H);

        fireworks = fireworks.filter(p => p.life > 0);
        fireworks.forEach(p => { p.update(); p.draw(); });

        particles = particles.filter(p => p.y < H + 50 && p.opacity > 0);
        particles.forEach(p => { p.update(); p.draw(); });

        ctx.globalAlpha = 1;

        if (fireworks.length > 0 || particles.length > 0) {
            animFrame = requestAnimationFrame(animate);
        } else {
            // All done — hide canvas
            canvas.style.display = 'none';
        }
    }

    // Expose global function for the "I accept" button
    window.triggerCelebration = function () {
        resize();
        window.addEventListener('resize', resize);
        canvas.style.display = 'block';
        particles = [];
        fireworks = [];

        // Initial confetti rain
        for (let i = 0; i < 60; i++) {
            particles.push(new Confetti());
        }

        // Boom boom boom — staggered firework bursts
        burst(W * 0.3, H * 0.25, 50);
        setTimeout(() => burst(W * 0.7, H * 0.2, 60), 300);
        setTimeout(() => burst(W * 0.5, H * 0.35, 70), 600);
        setTimeout(() => burst(W * 0.2, H * 0.4, 45), 900);
        setTimeout(() => burst(W * 0.8, H * 0.3, 55), 1200);
        setTimeout(() => burst(W * 0.5, H * 0.2, 80), 1500);

        // Rain confetti for 3 seconds
        confettiInterval = setInterval(() => {
            for (let i = 0; i < 6; i++) {
                particles.push(new Confetti());
            }
        }, 80);

        setTimeout(() => clearInterval(confettiInterval), 3000);

        animFrame = requestAnimationFrame(animate);
    };
})();
