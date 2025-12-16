import React, { useRef, useState, useEffect, useLayoutEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

// Create context for item registration
const LiquidSideBarContext = React.createContext({
    registerItem: () => { },
    unregisterItem: () => { }
});

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
    const footerRef = useRef(null);

    // Track all registered items: map path -> { element, section }
    const [registeredItems, setRegisteredItems] = useState({});
    const [activeRect, setActiveRect] = useState(null);
    const [activeSection, setActiveSection] = useState(null); // 'nav' or 'footer'

    const registerItem = React.useCallback((path, element, section) => {
        setRegisteredItems(prev => ({ ...prev, [path]: { element, section } }));
    }, []);

    const unregisterItem = React.useCallback((path) => {
        setRegisteredItems(prev => {
            const next = { ...prev };
            delete next[path];
            return next;
        });
    }, []);

    // Calculate active item position
    useLayoutEffect(() => {
        // Find active item from ALL registered items
        const activePath = Object.keys(registeredItems).find(path =>
            location.pathname === path || location.pathname.startsWith(path + '/')
        );

        if (activePath && registeredItems[activePath]) {
            const { element, section } = registeredItems[activePath];
            const container = section === 'nav' ? navRef.current : footerRef.current;

            if (element && container) {
                const itemRect = element.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();

                setActiveRect({
                    top: itemRect.top - containerRect.top,
                    left: itemRect.left - containerRect.left, // Depending on padding, usually handled by relative placement
                    height: itemRect.height,
                    width: itemRect.width,
                });
                setActiveSection(section);
            }
        } else {
            setActiveRect(null);
            setActiveSection(null);
        }
    }, [location.pathname, registeredItems]);

    // Shared background component to use in both sections
    const ActiveBackground = () => (
        <AnimatePresence>
            {activeRect && (
                <motion.div
                    layoutId="active-sidebar-bg"
                    className="absolute left-3 right-3 rounded-2xl pointer-events-none"
                    style={{
                        top: activeRect.top, // Animate top position relative to container
                        height: activeRect.height,
                        background: "linear-gradient(90deg, rgba(99, 102, 241, 0.4) 0%, rgba(99, 102, 241, 0) 100%)",
                        boxShadow: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.15), inset 0 -2px 5px 0 rgba(0, 0, 0, 0.05), 0 0 25px rgba(99, 102, 241, 0.4), 10px 0 15px -3px rgba(0, 0, 0, 0.1)"
                    }}
                    initial={false}
                    animate={{
                        top: activeRect.top,
                        height: activeRect.height
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
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <LiquidSideBarContext.Provider value={{ registerItem, unregisterItem }}>
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
                        {/* Render background here if active item is in Nav */}
                        {activeSection === 'nav' && <ActiveBackground />}

                        {/* Navigation Items */}
                        {items.map((item) => (
                            <LiquidSideBarItem
                                key={item.to}
                                item={item}
                                section="nav"
                            />
                        ))}
                    </nav>

                    {/* Footer */}
                    <div ref={footerRef} className="p-4 border-t border-white/10 bg-white/5 relative">
                        {/* Render background here if active item is in Footer */}
                        {activeSection === 'footer' && <ActiveBackground />}
                        {footer}
                    </div>
                </div>
            </aside>
        </LiquidSideBarContext.Provider>
    );
};

/**
 * LiquidSideBarItem
 * A reusable item for the LiquidSideBar.
 * Can be used as a NavLink (if 'to' is provided) or a generic interactive element (if 'onClick' is provided).
 * 
 * @typedef {Object} LiquidSideBarItemProps
 * @property {Object} item - The item data object
 * @property {any} [item.icon] - Icon component
 * @property {string} [item.label] - Label text
 * @property {string} [item.to] - Navigation path (optional)
 * @property {boolean} [item.isActive] - Active state override
 * @property {string} [className] - Additional classes
 * @property {() => void} [onClick] - Click handler
 * @property {React.ReactNode} [children] - Child elements
 * @property {string} [section] - Section identifier ('nav' or 'footer')
 * 
 * @type {React.ForwardRefExoticComponent<LiquidSideBarItemProps & React.RefAttributes<any>>}
 */
export const LiquidSideBarItem = React.forwardRef(({ item, className, onClick, children, section = 'footer' }, ref) => {
    const Icon = item.icon;
    const isLink = !!item.to;
    const Component = isLink ? NavLink : (onClick ? "div" : "div");

    // Access Context
    const { registerItem, unregisterItem } = useContext(LiquidSideBarContext);
    const internalRef = useRef(null);

    // Register item on mount
    useEffect(() => {
        // Register using the path (item.to) or a unique ID if it's not a link?
        // For link items, item.to is unique. 
        // For buttons (like Logout), they don't have 'to'. They won't be "active" usually. 
        // BUT "Messages" button *could* be active if we wanted? 
        // The user only complained about "My Account" not being active. My Account HAS a path.
        if (item.to && internalRef.current) {
            registerItem(item.to, internalRef.current, section);
        }
        return () => {
            if (item.to) unregisterItem(item.to);
        };
    }, [item.to, registerItem, unregisterItem, section]);

    // Wrapper props
    const props = {
        ref: (el) => {
            internalRef.current = el;
            if (typeof ref === 'function') ref(el);
            else if (ref) ref.current = el;
        },
        className: cn("relative flex items-center space-x-3 px-4 py-3 rounded-2xl group overflow-hidden cursor-pointer w-full text-left", className),
        onMouseMove: (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            e.currentTarget.style.setProperty("--x", `${x}px`);
            e.currentTarget.style.setProperty("--y", `${y}px`);
        },
        onClick,
    };

    if (isLink) {
        props.to = item.to;
    }

    const content = (active) => (
        <>
            {/* NEW: Mouse Follow Border Glow */}
            <div
                className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                style={{
                    background: `radial-gradient(circle at var(--x) var(--y), rgba(255,255,255,0.6) 0%, transparent 40%)`,
                    mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    maskComposite: "exclude",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    padding: "1px", // Defines border width
                }}
            />

            {/* Hover effect for non-active items */}
            {!active && (
                <motion.div
                    className="absolute inset-0 rounded-2xl bg-transparent"
                    whileHover={{
                        backgroundColor: "rgba(255,255,255,0.07)"
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                />
            )}

            {/* Icon & Label */}
            <div className="relative z-10 flex items-center space-x-3 w-full">
                {Icon && <Icon
                    className={cn(
                        "w-5 h-5 transition-all duration-300 ease-out flex-shrink-0",
                        active
                            ? "text-indigo-600 dark:text-indigo-400 drop-shadow-sm"
                            : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                    )}
                />}
                <span className={cn(
                    "font-medium transition-all duration-300 ease-out flex-grow",
                    active
                        ? "text-indigo-600 dark:text-indigo-400 font-semibold"
                        : "text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-slate-100"
                )}>
                    {item.label}
                </span>
                {children}
            </div>
        </>
    );

    return (
        <Component {...props}>
            {isLink
                ? ({ isActive }) => content(isActive)
                : content(item.isActive)
            }
        </Component>
    );
});
