import { cn } from "@/lib/utils";

export function LiquidBackground({ className = "" }) {
    return (
        <div className={cn("fixed inset-0 w-full h-full overflow-hidden pointer-events-none -z-50 bg-zinc-50 dark:bg-zinc-950", className)}>
            {/* Base gradient overlay for "Liquid" feel */}
            <div className="absolute inset-0 bg-white/30 dark:bg-black/20 backdrop-blur-[1px]" />

            {/* Moving Blobs */}
            <div className="absolute top-0 left-[-10%] w-[500px] h-[500px] bg-purple-400/30 dark:bg-purple-900/40 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-[80px] opacity-70 animate-blob"></div>
            <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-blue-400/30 dark:bg-blue-900/40 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-[80px] opacity-70 animate-blob animation-delay-1000"></div>
            <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-pink-400/30 dark:bg-pink-900/40 rounded-full mix-blend-multiply dark:mix-blend-lighten filter blur-[80px] opacity-70 animate-blob animation-delay-2000"></div>

            {/* Glass noise texture (optional, subtle) */}
            {/* <div className="absolute inset-0 opacity-[0.03] bg-[url('/noise.png')]"></div> */}
        </div>
    );
}
