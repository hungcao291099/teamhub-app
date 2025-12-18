import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm border-0",
                destructive:
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm border-0",
                outline:
                    "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
                secondary:
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-0",
                ghost: "hover:bg-accent hover:text-accent-foreground border-0",
                link: "text-primary underline-offset-4 hover:underline",
                warning: "bg-yellow-600 text-white hover:bg-yellow-700 border-0",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-xl px-3",
                lg: "h-11 rounded-xl px-8",
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
        const Component = asChild ? Slot : motion.button
        const isMotion = !asChild

        return (
            <Component
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...(isMotion ? {
                    whileTap: { scale: 0.98 },
                    transition: { type: "spring", stiffness: 400, damping: 10 }
                } : {})}
                {...(props as any)}
            >
                {children}
            </Component>
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
