import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ScrollHideFab
 * A Floating Action Button that hides when scrolling down and shows when scrolling up.
 * 
 * Props:
 * - onClick: Function to trigger when clicked.
 * - icon: Icon component (default: Plus).
 * - label: Optional label (tooltip or text).
 */
export const ScrollHideFab = React.forwardRef(({ onClick, icon: Icon = Plus, className, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Show if scrolling up or at the very top
            if (currentScrollY < lastScrollY || currentScrollY < 50) {
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
                // Hide if scrolling down and not at top
                setIsVisible(false);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.button
                    ref={ref}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1.08, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{
                        type: "spring",
                        stiffness: 180,
                        damping: 28,
                        mass: 1.0
                    }}
                    onClick={onClick}
                    className={cn(
                        "fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50",
                        "flex items-center justify-center w-14 h-14 rounded-full",
                        "text-white backdrop-blur-xl border border-white/20",
                        className
                    )}
                    style={{
                        background: "linear-gradient(145deg, rgba(99, 102, 241, 0.95) 0%, rgba(139, 92, 246, 0.98) 100%)",
                        boxShadow: `
                            0 8px 24px rgba(99, 102, 241, 0.4),
                            0 2px 8px rgba(0, 0, 0, 0.15),
                            inset 0 1px 0 rgba(255, 255, 255, 0.3)
                        `
                    }}
                    {...props}
                >
                    {/* Inner glow for glass depth */}
                    <div
                        className="absolute inset-0 rounded-full pointer-events-none"
                        style={{
                            background: "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.25) 0%, transparent 50%)"
                        }}
                    />

                    {/* Subtle rotating shine */}
                    <motion.div
                        className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
                    >
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            initial={{ rotate: 0 }}
                            animate={{ rotate: 360 }}
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        />
                    </motion.div>

                    <Icon className="w-6 h-6 relative z-10 drop-shadow-sm" />
                </motion.button>
            )}
        </AnimatePresence>
    );
});

ScrollHideFab.displayName = "ScrollHideFab";
