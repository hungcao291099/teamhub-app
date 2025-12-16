import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * LiquidButton
 * A high-end button component with "viscous" fluid physics.
 * 
 * Aesthetics:
 * - Idle: Frosted glass (backdrop-blur), translucent background, subtle border.
 * - Hover: Internal gradient "shines" (moves), slight lift.
 * - Tap: "Squishy" scale effect (viscous feeling).
 */
export const LiquidButton = React.forwardRef(({
    className,
    children,
    variant = "primary", // primary | ghost
    ...props
}, ref) => {

    // Variants for animation
    const isPrimary = variant === "primary";

    return (
        <motion.button
            ref={ref}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }} // Bouncy/Elastic physics
            className={cn(
                "relative overflow-hidden px-6 py-3 rounded-xl font-medium transition-all duration-300 group",
                // Glass Base
                "backdrop-blur-xl border border-white/20 shadow-lg",
                // Variants
                isPrimary
                    ? "bg-white/10 text-white hover:bg-white/20 hover:shadow-primary/30"
                    : "bg-transparent text-foreground hover:bg-white/5",
                className
            )}
            {...props}
            onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                e.currentTarget.style.setProperty("--x", `${x}px`);
                e.currentTarget.style.setProperty("--y", `${y}px`);
            }}
        >
            {/* Liquid Gradient Layer (only for primary) */}
            {isPrimary && (
                <motion.div
                    className="absolute inset-0 -z-10 opacity-70 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                        background: "linear-gradient(45deg, #3b82f6, #8b5cf6, #3b82f6)",
                        backgroundSize: "200% 200%",
                    }}
                    animate={{
                        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                        duration: 3,
                        ease: "linear",
                        repeat: Infinity,
                    }}
                />
            )}

            {/* Mouse Follow Liquid Splash */}
            <div
                className="absolute inset-0 -z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at var(--x) var(--y), rgba(255,255,255,0.3) 0%, transparent 60%)`
                }}
            />

            {/* Glossy Reflection (Top edge) */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50" />

            {/* Content */}
            <span className="relative z-10 flex items-center justify-center gap-2">
                {children}
            </span>
        </motion.button>
    );
});

LiquidButton.displayName = "LiquidButton";
