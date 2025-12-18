import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * SolidNavBar (formerly LiquidNavBar)
 * A clean, solid mobile bottom dock.
 */
export const LiquidNavBar = ({ items = [] }) => {
    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <nav className="relative flex items-center gap-1 p-2 rounded-full border border-border bg-card shadow-lg">
                {items.map((item) => (
                    <NavItem
                        key={item.to}
                        item={item}
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
            className={({ isActive }) => cn(
                "relative flex items-center justify-center w-12 h-12 rounded-full cursor-pointer transition-all duration-200",
                isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
        >
            <Icon className="w-5 h-5" />
        </NavLink>
    );
});

NavItem.displayName = "NavItem";
