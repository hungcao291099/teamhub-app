import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import confetti from 'canvas-confetti'; // Import confetti
import stonkImage from '@/assets/stonk.jpg';

export function DonateOverlay() {
    const { socket } = useAuth();
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        if (!socket) return;

        const handleTransactionAdded = (tx) => {
            // Only show for "thu" (income) transactions
            if (tx.type === 'thu') {
                setNotification(tx);

                // Trigger Fireworks
                const duration = 5 * 1000;
                const animationEnd = Date.now() + duration;
                const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 60 };

                const randomInRange = (min, max) => Math.random() * (max - min) + min;

                const interval = setInterval(function () {
                    const timeLeft = animationEnd - Date.now();

                    if (timeLeft <= 0) {
                        return clearInterval(interval);
                    }

                    const particleCount = 50 * (timeLeft / duration);
                    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                    confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
                }, 250);

                // Auto hide after 10 seconds
                setTimeout(() => {
                    setNotification(null);
                    clearInterval(interval);
                }, 10000);
            }
        };

        socket.on('fund:transaction_added', handleTransactionAdded);

        return () => {
            socket.off('fund:transaction_added', handleTransactionAdded);
        };
    }, [socket]);

    return (
        <AnimatePresence>
            {notification && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: -100 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: -100 }}
                    className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                    style={{ translateX: "-50%" }} // Reinforce centering
                >
                    <div className="flex flex-col items-center gap-4 text-center max-w-[90vw]">

                        {/* Image - Smaller & Centered */}
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 10 }}
                            className="relative z-10"
                        >
                            <img
                                src={stonkImage}
                                alt="Donate"
                                className="w-[300px] h-auto object-cover rounded-3xl border-4 border-white/50 shadow-[0_0_30px_rgba(255,255,0,0.6)]"
                            />
                        </motion.div>

                        {/* Content */}
                        <div className="space-y-2">
                            <p className="text-4xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] stroke-text-sm leading-tight max-w-[600px] break-words">
                                {notification.description}
                            </p>

                            <div className="flex flex-col items-center pt-2">
                                <span className="text-2xl text-yellow-200 font-bold drop-shadow-md">Đã donate</span>
                                <span className="text-6xl font-extrabold text-[#00ff00] drop-shadow-[0_4px_4px_rgba(0,0,0,1)] stroke-text-sm">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(notification.amount)}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
