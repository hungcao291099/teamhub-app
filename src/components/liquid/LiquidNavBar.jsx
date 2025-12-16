import React, { useRef, useState, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * LiquidNavBar
 * A floating "dock" style navigation with iOS-style sliding animation.
 * 
 * Aesthetics:
 * - Container: Pill-shaped, high blur glass, translucent.
 * - Active State: Single sliding "bubble" that smoothly moves between items.
 * - Items: Icons with smooth color transitions.
 */
export const LiquidNavBar = ({ items = [] }) => {
    const location = useLocation();
    const navRef = useRef(null);
    const itemRefs = useRef({});
    const [activeRect, setActiveRect] = useState(null);

    // Calculate active item position
    useLayoutEffect(() => {
        const activeItem = items.find(item =>
            location.pathname === item.to || location.pathname.startsWith(item.to + '/')
        );
        if (activeItem && itemRefs.current[activeItem.to] && navRef.current) {
            const itemEl = itemRefs.current[activeItem.to];
            const navEl = navRef.current;
            const itemRect = itemEl.getBoundingClientRect();
            const navRect = navEl.getBoundingClientRect();

            setActiveRect({
                left: itemRect.left - navRect.left,
                width: itemRect.width,
                height: itemRect.height,
            });
        }
    }, [location.pathname, items]);

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <nav
                ref={navRef}
                className="relative flex items-center gap-1 p-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-2xl shadow-2xl"
            >
                {/* iOS-style Sliding Liquid Bubble */}
                <AnimatePresence>
                    {activeRect && (
                        <motion.div
                            className="absolute rounded-full pointer-events-none"
                            style={{
                                width: activeRect.width,
                                height: activeRect.height,
                                background: "linear-gradient(145deg, rgba(99, 102, 241, 0.95) 0%, rgba(139, 92, 246, 0.98) 100%)",
                                boxShadow: `
                                    0 8px 24px rgba(99, 102, 241, 0.4),
                                    0 2px 8px rgba(0, 0, 0, 0.15),
                                    inset 0 1px 0 rgba(255, 255, 255, 0.3)
                                `
                            }}
                            initial={false}
                            animate={{
                                left: activeRect.left,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 180,
                                damping: 28,
                                mass: 1.0
                            }}
                        >
                            {/* Inner glow */}
                            <div
                                className="absolute inset-0 rounded-full"
                                style={{
                                    background: "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.25) 0%, transparent 50%)"
                                }}
                            />

                            {/* Subtle shine sweep */}
                            <motion.div className="absolute inset-0 rounded-full overflow-hidden">
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                    initial={{ x: "-150%" }}
                                    animate={{ x: "250%" }}
                                    transition={{
                                        duration: 2.5,
                                        repeat: Infinity,
                                        repeatDelay: 5,
                                        ease: [0.25, 0.1, 0.25, 1]
                                    }}
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation Items */}
                {items.map((item) => (
                    <NavItem
                        key={item.to}
                        item={item}
                        ref={(el) => itemRefs.current[item.to] = el}
                    />
                ))}
            </nav>
        </div>
    );
};

const NavItem = React.forwardRef(({ item }, ref) => {
    const Icon = item.icon;

    return (
        <NavLink
            ref={ref}
            to={item.to}
            className="relative flex items-center justify-center w-12 h-12 rounded-full cursor-pointer"
        >
            {({ isActive }) => (
                <div className="relative z-10">
                    <Icon
                        className={cn(
                            "w-6 h-6 transition-all duration-300 ease-out",
                            isActive
                                ? "text-white drop-shadow-sm"
                                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
                        )}
                    />
                </div>
            )}
        </NavLink>
    );
});

NavItem.displayName = "NavItem";
