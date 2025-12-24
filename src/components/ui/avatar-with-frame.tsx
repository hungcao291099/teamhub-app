import * as React from "react";
import { cn } from "@/lib/utils";

// Import all frames
import frame1 from "@/assets/frame/frame1.png";
import frame2 from "@/assets/frame/frame2.png";
import frame3 from "@/assets/frame/frame3.png";
import frame4 from "@/assets/frame/frame4.png";
import frame5 from "@/assets/frame/frame5.png";
import frame6 from "@/assets/frame/frame6.png";
import frame7 from "@/assets/frame/frame7.png";
import frame8 from "@/assets/frame/frame8.png";
import frame9 from "@/assets/frame/frame9.png";
import frame10 from "@/assets/frame/frame10.png";
import frame11 from "@/assets/frame/frame11.png";

// Per-frame configuration for position and scale adjustments
// offsetX, offsetY: pixel offset from center (can be negative)
// scale: multiplier for frame size (1.0 = default, 1.1 = 10% larger, 0.9 = 10% smaller)
interface FrameConfig {
    src: string;
    offsetX: number;  // Horizontal offset in pixels (positive = right, negative = left)
    offsetY: number;  // Vertical offset in pixels (positive = down, negative = up)
    scale: number;    // Scale multiplier (1.0 = 100%)
}

export const frameConfigs: Record<string, FrameConfig> = {
    frame1: { src: frame1, offsetX: 0, offsetY: 0, scale: 1.3 },
    frame2: { src: frame2, offsetX: -2, offsetY: -10, scale: 1.05 },
    frame3: { src: frame3, offsetX: 4, offsetY: -5, scale: 1.2 },
    frame4: { src: frame4, offsetX: 8, offsetY: 7, scale: 1.1 },
    frame5: { src: frame5, offsetX: 5, offsetY: -7, scale: 1.2 },
    frame6: { src: frame6, offsetX: -1, offsetY: 8, scale: 1.1 },
    frame7: { src: frame7, offsetX: 1, offsetY: -2, scale: 1.4 },
    frame8: { src: frame8, offsetX: -4, offsetY: 8, scale: 1.2 },
    frame9: { src: frame9, offsetX: 6, offsetY: 5, scale: 1.3 },
    frame10: { src: frame10, offsetX: 20, offsetY: 3, scale: 1.1 },
    frame11: { src: frame11, offsetX: -3, offsetY: 7, scale: 2.7 },
};

// Frame map for dynamic lookup (backward compatibility)
export const frameMap: Record<string, string> = {
    frame1,
    frame2,
    frame3,
    frame4,
    frame5,
    frame6,
    frame7,
    frame8,
    frame9,
    frame10,
    frame11,
};

// Frame list for selection UI
export const frameList = [
    { id: "frame1", src: frame1 },
    { id: "frame2", src: frame2 },
    { id: "frame3", src: frame3 },
    { id: "frame4", src: frame4 },
    { id: "frame5", src: frame5 },
    { id: "frame6", src: frame6 },
    { id: "frame7", src: frame7 },
    { id: "frame8", src: frame8 },
    { id: "frame9", src: frame9 },
    { id: "frame10", src: frame10 },
    { id: "frame11", src: frame11 },
];

// Size presets matching common Tailwind classes
// Frame needs to be larger than avatar (~125%) to create visible border decoration effect

type SizePreset = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

// Avatar size -> Frame size (~156% ratio based on xl: 128 -> 200)
const sizeConfig: Record<SizePreset, { avatarSize: number; frameSize: number; className: string }> = {
    xs: { avatarSize: 32, frameSize: 50, className: "h-8 w-8" },      // h-8 w-8
    sm: { avatarSize: 40, frameSize: 62, className: "h-10 w-10" },   // h-10 w-10
    md: { avatarSize: 80, frameSize: 125, className: "h-20 w-20" },   // h-20 w-20
    lg: { avatarSize: 96, frameSize: 150, className: "h-24 w-24" },   // h-24 w-24
    xl: { avatarSize: 128, frameSize: 200, className: "h-32 w-32" },  // h-32 w-32
    "2xl": { avatarSize: 160, frameSize: 250, className: "h-40 w-40" }, // h-40 w-40
};

interface AvatarWithFrameProps {
    frameId?: string | null;
    size?: SizePreset;
    className?: string;
    children: React.ReactNode;
}

export const AvatarWithFrame = React.forwardRef<
    HTMLDivElement,
    AvatarWithFrameProps
>(({ frameId, size = "sm", className, children }, ref) => {
    const config = sizeConfig[size];
    const frameConfig = frameId ? frameConfigs[frameId] : null;

    // Calculate final frame size with scale
    const finalFrameSize = frameConfig
        ? config.frameSize * frameConfig.scale
        : config.frameSize;

    return (
        <div
            ref={ref}
            className={cn(
                "relative flex shrink-0 items-center justify-center overflow-visible",
                config.className,
                className
            )}
        >
            {/* Avatar container */}
            <div className="relative z-0 h-full w-full">
                {children}
            </div>

            {/* Frame overlay - higher z-index, centered on avatar with per-frame offset */}
            {frameConfig && (
                <img
                    src={frameConfig.src}
                    alt=""
                    className="absolute z-10 pointer-events-none"
                    style={{
                        width: `${finalFrameSize}px`,
                        height: `${finalFrameSize}px`,
                        maxWidth: 'none', // Override global img max-width: 100%
                        objectFit: 'contain',
                        // Center the larger frame over the avatar with offset adjustments
                        top: '50%',
                        left: '50%',
                        transform: `translate(calc(-50% + ${frameConfig.offsetX}px), calc(-50% + ${frameConfig.offsetY}px))`,
                    }}
                />
            )}
        </div>
    );
});

AvatarWithFrame.displayName = "AvatarWithFrame";

// Helper component for preview in frame selection
interface FramePreviewProps {
    frameId: string;
    selected?: boolean;
    onClick?: () => void;
}

export const FramePreview: React.FC<FramePreviewProps> = ({
    frameId,
    selected,
    onClick,
}) => {
    const frameSrc = frameMap[frameId];
    if (!frameSrc) return null;

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "relative w-16 h-16 rounded-lg border-2 transition-all hover:scale-105 hover:border-primary/50 p-1",
                selected
                    ? "border-primary bg-primary/10 ring-2 ring-primary ring-offset-2"
                    : "border-border bg-muted/30"
            )}
        >
            <img
                src={frameSrc}
                alt={frameId}
                className="w-full h-full object-contain"
            />
        </button>
    );
};
