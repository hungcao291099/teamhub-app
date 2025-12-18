import { useEffect, useRef, useState } from 'react';
import { useThemeEvent } from '@/context/ThemeEventContext';
import { AnimatePresence, motion } from 'framer-motion';

export function ThemeEffectsContainer() {
    const { currentTheme } = useThemeEvent();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        // Initial size
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Particle System
    // Marquee Logic
    const [showMarquee, setShowMarquee] = useState(true);

    useEffect(() => {
        setShowMarquee(true);
    }, [currentTheme.id]);

    const handleAnimationComplete = () => {
        setShowMarquee(false);
        setTimeout(() => {
            setShowMarquee(true);
        }, 30000); // 30s delay
    };


    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // If usage type is none, clear handling is done by parent unmounting or valid checks
        if (currentTheme.effects.type === 'none') {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = dimensions.width;
        canvas.height = dimensions.height;

        const particles: Particle[] = [];
        const particleCount = (currentTheme.effects.density || 5) * 20; // Scale density
        const colors = currentTheme.effects.colors || ['#ffffff'];

        class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            color: string;
            rotation: number;
            rotationSpeed: number;

            constructor() {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height;
                this.size = Math.random() * 5 + 2; // 2-7px
                this.speedX = Math.random() * 2 - 1;
                this.speedY = Math.random() * (currentTheme.effects.speed || 1) + 1;
                this.color = colors[Math.floor(Math.random() * colors.length)];
                this.rotation = Math.random() * 360;
                this.rotationSpeed = Math.random() * 2 - 1;
            }

            update() {
                this.y += this.speedY;
                this.x += this.speedX;
                this.rotation += this.rotationSpeed;

                if (this.y > canvas!.height) {
                    this.y = 0 - this.size;
                    this.x = Math.random() * canvas!.width;
                }
                if (this.x > canvas!.width) this.x = 0;
                if (this.x < 0) this.x = canvas!.width;
            }

            draw() {
                if (!ctx) return;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate((this.rotation * Math.PI) / 180);
                ctx.fillStyle = this.color;

                switch (currentTheme.effects.type) {
                    case 'snow':
                        ctx.beginPath();
                        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                        ctx.fill();
                        break;
                    case 'flower':
                        // Simple flower shape (5 petals)
                        for (let i = 0; i < 5; i++) {
                            ctx.beginPath();
                            ctx.rotate((Math.PI * 2) / 5);
                            ctx.ellipse(0, this.size, this.size / 2, this.size * 1.5, 0, 0, Math.PI * 2);
                            ctx.fill();
                        }
                        ctx.beginPath();
                        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
                        ctx.fillStyle = '#fff9c4'; // center
                        ctx.fill();
                        break;
                    case 'star':
                        // Draw star
                        ctx.beginPath();
                        for (let i = 0; i < 5; i++) {
                            ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * this.size * 2,
                                -Math.sin((18 + i * 72) * Math.PI / 180) * this.size * 2);
                            ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * this.size,
                                -Math.sin((54 + i * 72) * Math.PI / 180) * this.size);
                        }
                        ctx.closePath();
                        ctx.fill();
                        break;
                    case 'heart':
                        // Draw heart
                        ctx.beginPath();
                        const topCurveHeight = this.size * 0.3;
                        ctx.moveTo(0, topCurveHeight);
                        ctx.bezierCurveTo(0, 0, -this.size, 0, -this.size, topCurveHeight);
                        ctx.bezierCurveTo(-this.size, (this.size + topCurveHeight) / 2,
                            0, (this.size + topCurveHeight),
                            0, this.size * 2);
                        ctx.bezierCurveTo(0, (this.size + topCurveHeight),
                            this.size, (this.size + topCurveHeight) / 2,
                            this.size, topCurveHeight);
                        ctx.bezierCurveTo(this.size, 0, 0, 0, 0, topCurveHeight);
                        ctx.fill();
                        break;
                    case 'ghost':
                        // Simple arch ghost
                        ctx.beginPath();
                        ctx.arc(0, 0, this.size, Math.PI, 0);
                        ctx.lineTo(this.size, this.size * 2);
                        ctx.lineTo(-this.size, this.size * 2);
                        ctx.fill();
                        // Eyes
                        ctx.fillStyle = 'black';
                        ctx.beginPath();
                        ctx.arc(-this.size / 3, 0, this.size / 4, 0, Math.PI * 2);
                        ctx.arc(this.size / 3, 0, this.size / 4, 0, Math.PI * 2);
                        ctx.fill();
                        break;
                    default: // leaf, circle fallback
                        ctx.beginPath();
                        ctx.ellipse(0, 0, this.size, this.size * 2, 0, 0, Math.PI * 2);
                        ctx.fill();
                }

                ctx.restore();
            }
        }

        // Init particles
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        let animationId: number;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            animationId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, [currentTheme, dimensions, showMarquee]);



    // If theme is default/none, we might still render empty container but cleaner to null check early components
    if (currentTheme.id === 'default' && currentTheme.effects.type === 'none') return null;

    const hasMarquee = !!currentTheme.marquee;
    // If there is a marquee, sync the canvas visibility with it. Otherwise (just effects), show canvas always.
    const showEffects = hasMarquee ? showMarquee : true;

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden flex flex-col justify-between">

            {/* 1. Marquee (Top) */}
            <AnimatePresence>
                {hasMarquee && showMarquee && (
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        className="w-full bg-black/80 text-white py-1 overflow-hidden"
                        style={{ backgroundColor: currentTheme.colors.primary ? `${currentTheme.colors.primary}99` : undefined }}
                    >
                        <div
                            className="whitespace-nowrap animate-marquee inline-block font-bold"
                            onAnimationEnd={handleAnimationComplete}
                        >
                            <span className="mx-4">{currentTheme.marquee}</span>
                            <span className="mx-4">{currentTheme.marquee}</span>
                            <span className="mx-4">{currentTheme.marquee}</span>
                            <span className="mx-4">{currentTheme.marquee}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* 3. Canvas Layer (Full Screen) - Sync with Marquee */}
            <AnimatePresence>
                {showEffects && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 pointer-events-none"
                        style={{ zIndex: -1 }}
                    >
                        <canvas
                            ref={canvasRef}
                            className="w-full h-full"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Keyframe style for Marquee */}
            <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 30s linear 1; /* Run once, slower (30s) */
          /* padding-left: 100%; removed to fix delay */
        }
      `}</style>
        </div>
    );
}
