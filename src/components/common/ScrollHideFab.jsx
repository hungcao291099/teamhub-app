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
                        "bg-primary text-primary-foreground shadow-lg hover:bg-primary/90",
                        className
                    )}
                    {...props}
                >
                    <Icon className="w-6 h-6 relative z-10" />
                </motion.button>
            )}
        </AnimatePresence>
    );
});

ScrollHideFab.displayName = "ScrollHideFab";
