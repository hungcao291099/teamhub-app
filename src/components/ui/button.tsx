import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative backdrop-blur-xl",
    {
        variants: {
            variant: {
                default: "text-indigo-600 dark:text-indigo-400 border-0",
                destructive:
                    "text-red-600 dark:text-red-400 border-0",
                warning:
                    "text-yellow-600 dark:text-yellow-400 border-0",
                outline:
                    "border border-input hover:text-accent-foreground",
                secondary:
                    "text-foreground hover:text-foreground",
                ghost: "hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-2xl px-3",
                lg: "h-11 rounded-2xl px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, children, ...props }, ref) => {
        const resolvedVariant = variant || 'default';
        // Apply liquid-button to all except link
        const isLiquid = resolvedVariant !== 'link';
        const isPrimary = resolvedVariant === 'default';

        const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            e.currentTarget.style.setProperty("--x", `${x}px`);
            e.currentTarget.style.setProperty("--y", `${y}px`);
        };

        const baseClassName = cn(buttonVariants({ variant, size, className }),
            isLiquid && "liquid-button group",
            resolvedVariant === 'default' && "primary",
            resolvedVariant === 'secondary' && "secondary",
            resolvedVariant === 'destructive' && "destructive",
            resolvedVariant === 'warning' && "warning",
            resolvedVariant === 'outline' && "outline",
            resolvedVariant === 'ghost' && "ghost"
        );

        const glowBorder = !asChild && isLiquid && (
            <div
                className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                style={{
                    background: `radial-gradient(circle at var(--x) var(--y), rgba(255, 255, 255, 0.8) 0%, transparent 50%)`,
                    mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    maskComposite: "exclude",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    padding: "2px",
                }}
            />
        );



        // Indigo fade background for primary buttons (matches LiquidNavBar active state)
        const indigoFadeBackground = !asChild && isPrimary && (
            <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                    background: "linear-gradient(180deg, rgba(99, 102, 241, 0.4) 0%, rgba(99, 102, 241, 0) 100%)",
                    boxShadow: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.15), inset 0 -2px 5px 0 rgba(0, 0, 0, 0.05), 0 0 15px rgba(255, 255, 255, 0.25), 0 0 25px rgba(99, 102, 241, 0.4), 0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                }}
            >
                {/* Inner glow for glass depth */}
                <div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                        background: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.22) 0%, transparent 50%)"
                    }}
                />
            </div>
        );

        // White fade background for secondary buttons (same style as primary but white)
        // Increased contrast for visibility on white backgrounds
        const whiteFadeBackground = !asChild && resolvedVariant === 'secondary' && (
            <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                    background: "linear-gradient(180deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0) 100%)",
                    boxShadow: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.4), inset 0 -2px 5px 0 rgba(0, 0, 0, 0.05), 0 5px 15px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0,0,0,0.05)"
                }}
            >
                {/* Inner glow for glass depth */}
                <div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                        background: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.4) 0%, transparent 50%)"
                    }}
                />
            </div>
        );

        // Red fade background for destructive buttons
        const redFadeBackground = !asChild && resolvedVariant === 'destructive' && (
            <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                    background: "linear-gradient(180deg, rgba(239, 68, 68, 0.4) 0%, rgba(239, 68, 68, 0) 100%)",
                    boxShadow: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.15), inset 0 -2px 5px 0 rgba(0, 0, 0, 0.05), 0 0 15px rgba(239, 68, 68, 0.25), 0 0 25px rgba(239, 68, 68, 0.4), 0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                }}
            >
                {/* Inner glow for glass depth */}
                <div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                        background: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.22) 0%, transparent 50%)"
                    }}
                />
            </div>
        );

        // Yellow fade background for warning buttons
        const yellowFadeBackground = !asChild && resolvedVariant === 'warning' && (
            <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                    background: "linear-gradient(180deg, rgba(234, 179, 8, 0.4) 0%, rgba(234, 179, 8, 0) 100%)",
                    boxShadow: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.15), inset 0 -2px 5px 0 rgba(0, 0, 0, 0.05), 0 0 15px rgba(234, 179, 8, 0.25), 0 0 25px rgba(234, 179, 8, 0.4), 0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                }}
            >
                {/* Inner glow for glass depth */}
                <div
                    className="absolute inset-0 rounded-2xl"
                    style={{
                        background: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.22) 0%, transparent 50%)"
                    }}
                />
            </div>
        );

        const content = (
            <>
                {indigoFadeBackground}
                {whiteFadeBackground}
                {redFadeBackground}
                {yellowFadeBackground}
                {glowBorder}

                <span className="relative z-10 flex items-center justify-center gap-2">
                    {children}
                </span>
            </>
        );

        if (asChild) {
            return (
                <Slot
                    className={baseClassName}
                    ref={ref}
                    onMouseMove={handleMouseMove}
                    {...props}
                >
                    {content}
                </Slot>
            )
        }

        return (
            <motion.button
                className={baseClassName}
                ref={ref}
                onMouseMove={handleMouseMove}
                whileHover={isLiquid ? { scale: 1.05 } : undefined}
                whileTap={isLiquid ? { scale: 0.95 } : undefined}
                transition={isLiquid ? { type: "spring", stiffness: 180, damping: 28, mass: 1.0 } : undefined}
                {...(props as any)}
            >
                {content}
            </motion.button>
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
