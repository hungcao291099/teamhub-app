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
                    ? "bg-transparent text-primary"
                    : "bg-transparent text-foreground hover:bg-white/5",
                className
            )}
            style={{
                background: isPrimary
                    ? "linear-gradient(180deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)"
                    : "linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%)",
                boxShadow: isPrimary
                    ? "inset 0 1px 1px 0 rgba(255, 255, 255, 0.2), inset 0 -2px 5px 0 rgba(0, 0, 0, 0.05), 0 4px 20px rgba(99, 102, 241, 0.15)"
                    : "inset 0 1px 1px 0 rgba(255, 255, 255, 0.15), inset 0 -2px 5px 0 rgba(0, 0, 0, 0.05), 0 4px 15px rgba(0, 0, 0, 0.05)"
            }}
            {...props}
            onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                e.currentTarget.style.setProperty("--x", `${x}px`);
                e.currentTarget.style.setProperty("--y", `${y}px`);
            }}
        >
            {/* Mouse Follow Glow Border */}
            <div
                className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl"
                style={{
                    background: `radial-gradient(circle at var(--x) var(--y), ${isPrimary ? "rgba(99, 102, 241, 0.6)" : "rgba(255, 255, 255, 0.3)"} 0%, transparent 50%)`,
                    mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    maskComposite: "exclude",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    padding: "2px",
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
