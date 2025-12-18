import { cn } from "@/lib/utils";

export function LiquidBackground({ className = "" }) {
    return (
        <div className={cn("fixed inset-0 w-full h-full overflow-hidden pointer-events-none -z-50 bg-background transition-colors duration-300", className)}>
            {/* Solid Background - simplified for Solid Theme */}
        </div>
    );
}
