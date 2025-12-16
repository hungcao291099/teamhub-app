import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                default: "liquid-button text-primary border-0",
                destructive:
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                outline:
                    "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                secondary:
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-11 rounded-md px-8",
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
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        const isPrimary = variant === "default" || (!variant && true);
        const isSecondary = variant === "secondary" || variant === "outline";

        const liquidStyle = isPrimary ? {
            background: "linear-gradient(180deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)",
            boxShadow: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.2), inset 0 -2px 5px 0 rgba(0, 0, 0, 0.05), 0 4px 20px rgba(99, 102, 241, 0.15)"
        } : (isSecondary ? {
            background: "linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%)",
            boxShadow: "inset 0 1px 1px 0 rgba(255, 255, 255, 0.15), inset 0 -2px 5px 0 rgba(0, 0, 0, 0.05), 0 4px 15px rgba(0, 0, 0, 0.05)"
        } : {});

        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                style={liquidStyle}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
