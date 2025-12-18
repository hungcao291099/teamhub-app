import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * SolidSideBar (formerly LiquidSideBar)
 * A clean, solid desktop sidebar.
 */
export const LiquidSideBar = ({
    items = [],
    className,
    header,
    footer
}) => {
    return (
        <aside className={cn("hidden md:flex flex-col w-64 h-screen sticky top-0 z-20 bg-card border-r border-border", className)}>

            {/* Header */}
            <div className="p-6 border-b border-border">
                {header}
            </div>

            {/* Navigation */}
            <nav className="relative flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                {items.map((item) => (
                    <LiquidSideBarItem
                        key={item.to}
                        item={item}
                        section="nav"
                    />
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/20 relative space-y-2">
                {footer}
            </div>
        </aside>
    );
};

export const LiquidSideBarItem = React.forwardRef(({ item, className, onClick, children }, ref) => {
    const Icon = item.icon;
    const isLink = !!item.to;
    const Component = isLink ? NavLink : (onClick ? "div" : "div");

    const content = (active) => (
        <>
            <div className={cn(
                "absolute inset-0 rounded-xl transition-colors duration-200",
                active ? "bg-primary/10" : "group-hover:bg-muted"
            )} />

            <div className="relative z-10 flex items-center space-x-3 w-full">
                {Icon && <Icon
                    className={cn(
                        "w-5 h-5 transition-colors duration-200",
                        active
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                    )}
                />}
                <span className={cn(
                    "font-medium transition-colors duration-200 flex-grow",
                    active
                        ? "text-primary font-semibold"
                        : "text-muted-foreground group-hover:text-foreground"
                )}>
                    {item.label}
                </span>
                {children}
            </div>
        </>
    );

    const props = {
        className: cn("relative flex items-center space-x-3 px-4 py-3 rounded-xl group cursor-pointer w-full text-left outline-none", className),
        onClick
    };

    if (isLink) {
        props.to = item.to;
    }

    return (
        <Component {...props} ref={ref}>
            {isLink
                ? ({ isActive }) => content(isActive)
                : content(item.isActive)
            }
        </Component>
    );
});
