import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    label?: string
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
    ({ className, checked, onCheckedChange, label, ...props }, ref) => {
        return (
            <label className={cn("flex items-center gap-3 cursor-pointer group", className)}>
                {label && <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>}
                <div className="relative">
                    <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={(e) => onCheckedChange(e.target.checked)}
                        ref={ref}
                        {...props}
                    />
                    <motion.div
                        initial={false}
                        animate={{
                            backgroundColor: checked ? "var(--primary)" : "rgb(31, 41, 55)", // gray-800
                        }}
                        className="w-10 h-6 rounded-full p-1 transition-colors"
                    >
                        <motion.div
                            initial={false}
                            animate={{
                                x: checked ? 16 : 0,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30
                            }}
                            className="w-4 h-4 bg-white rounded-full shadow-sm"
                        />
                    </motion.div>
                </div>
            </label>
        )
    }
)

Switch.displayName = "Switch"

export { Switch }
