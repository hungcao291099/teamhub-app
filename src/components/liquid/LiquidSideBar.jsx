import React, { useRef, useState, useEffect, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * LiquidSideBar
 * A desktop sidebar with iOS-style liquid glass aesthetics.
 * Uses a single sliding background element for smooth transitions.
 */
export const LiquidSideBar = ({
    items = [],
    className,
    header,
    footer
}) => {
    const location = useLocation();
    const navRef = useRef(null);
    const itemRefs = useRef({});
    const [activeRect, setActiveRect] = useState(null);

    // Calculate active item position
    useLayoutEffect(() => {
        const activeItem = items.find(item => location.pathname === item.to || location.pathname.startsWith(item.to + '/'));
        if (activeItem && itemRefs.current[activeItem.to] && navRef.current) {
            const itemEl = itemRefs.current[activeItem.to];
            const navEl = navRef.current;
            const itemRect = itemEl.getBoundingClientRect();
            const navRect = navEl.getBoundingClientRect();

            setActiveRect({
                top: itemRect.top - navRect.top,
                height: itemRect.height,
                width: itemRect.width,
            });
        }
    }, [location.pathname, items]);

    return (
        <aside className={cn("hidden md:flex flex-col w-64 h-screen py-4 pl-4 pr-2 sticky top-0 z-20", className)}>
            {/* Glass Container */}
            <div className="flex-1 flex flex-col bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden relative">

                {/* Decorative Liquid Blobs */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/20 blur-3xl -z-10 rounded-full animate-blob" />
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/20 blur-3xl -z-10 rounded-full animate-blob animation-delay-2000" />

                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    {header}
                </div>

                {/* Navigation with sliding background */}
                <nav ref={navRef} className="relative flex-1 px-3 py-4 space-y-2 overflow-y-auto custom-scrollbar">

                    {/* iOS-style Sliding Liquid Background */}
                    <AnimatePresence>
                        {activeRect && (
                            <motion.div
                                className="absolute left-3 right-3 rounded-2xl pointer-events-none"
                                style={{
                                    background: "linear-gradient(145deg, rgba(99, 102, 241, 0.92) 0%, rgba(139, 92, 246, 0.95) 100%)",
                                    boxShadow: `
                                        0 8px 32px rgba(99, 102, 241, 0.35),
                                        0 2px 8px rgba(0, 0, 0, 0.12),
                                        inset 0 1px 0 rgba(255, 255, 255, 0.25),
                                        inset 0 -1px 0 rgba(0, 0, 0, 0.08)
                                    `
                                }}
                                initial={false}
                                animate={{
                                    top: activeRect.top,
                                    height: activeRect.height,
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
                                        background: "radial-gradient(ellipse at 25% 15%, rgba(255,255,255,0.22) 0%, transparent 50%)"
                                    }}
                                />

                                {/* Subtle shine sweep */}
                                <motion.div
                                    className="absolute inset-0 rounded-2xl overflow-hidden"
                                >
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12"
                                        initial={{ x: "-150%" }}
                                        animate={{ x: "250%" }}
                                        transition={{
                                            duration: 2.8,
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
                        <SideBarItem
                            key={item.to}
                            item={item}
                            ref={(el) => itemRefs.current[item.to] = el}
                        />
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-white/5">
                    {footer}
                </div>
            </div>
        </aside>
    );
};

const SideBarItem = React.forwardRef(({ item }, ref) => {
    const Icon = item.icon;

    return (
        <NavLink
            ref={ref}
            to={item.to}
            className="relative flex items-center space-x-3 px-4 py-3 rounded-2xl group overflow-hidden"
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
                    {/* Mouse Follow Liquid Splash */}
                    <div
                        className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                            background: `radial-gradient(circle at var(--x) var(--y), rgba(255,255,255,0.15) 0%, transparent 50%)`
                        }}
                    />

                    {/* Hover effect for non-active items */}
                    {!isActive && (
                        <motion.div
                            className="absolute inset-0 rounded-2xl bg-transparent"
                            whileHover={{
                                backgroundColor: "rgba(255,255,255,0.07)"
                            }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                        />
                    )}

                    {/* Icon & Label */}
                    <div className="relative z-10 flex items-center space-x-3">
                        <Icon
                            className={cn(
                                "w-5 h-5 transition-all duration-300 ease-out",
                                isActive
                                    ? "text-white drop-shadow-sm"
                                    : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                            )}
                        />
                        <span className={cn(
                            "font-medium transition-all duration-300 ease-out",
                            isActive
                                ? "text-white drop-shadow-sm"
                                : "text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-slate-100"
                        )}>
                            {item.label}
                        </span>
                    </div>
                </>
            )}
        </NavLink>
    );
});
