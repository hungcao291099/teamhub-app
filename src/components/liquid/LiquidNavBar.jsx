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
                            className="absolute rounded-2xl pointer-events-none"
                            style={{
                                width: activeRect.width,
                                height: activeRect.height,
                                background: "linear-gradient(180deg, rgba(99, 102, 241, 0.4) 0%, rgba(99, 102, 241, 0) 100%)",
                                boxShadow: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.15), inset 0 -2px 5px 0 rgba(0, 0, 0, 0.05), 0 0 25px rgba(99, 102, 241, 0.4), 0 10px 15px -3px rgba(0, 0, 0, 0.1)"
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
                            {/* Inner glow for glass depth */}
                            <div
                                className="absolute inset-0 rounded-2xl"
                                style={{
                                    background: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.22) 0%, transparent 50%)"
                                }}
                            />
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
            className="relative flex items-center justify-center w-12 h-12 rounded-2xl cursor-pointer overflow-hidden group"
            onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                e.currentTarget.style.setProperty("--x", `${x}px`);
                e.currentTarget.style.setProperty("--y", `${y}px`);
            }}
        >
            {({ isActive }) => (
                <>
                    {/* Mouse Follow Glow Border */}
                    <div
                        className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                            background: `radial-gradient(circle at var(--x) var(--y), rgba(99, 102, 241, 0.6) 0%, transparent 50%)`,
                            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                            maskComposite: "exclude",
                            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                            WebkitMaskComposite: "xor",
                            padding: "2px",
                        }}
                    />

                    <div className="relative z-10">
                        <Icon
                            className={cn(
                                "w-6 h-6 transition-all duration-300 ease-out",
                                isActive
                                    ? "text-indigo-600 dark:text-indigo-400 drop-shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            )}
                        />
                    </div>
                </>
            )}
        </NavLink>
    );
});

NavItem.displayName = "NavItem";
