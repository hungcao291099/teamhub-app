import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "😢", "🙏", "🎉", "🔥", "👏", "✨"];

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
    children?: React.ReactNode;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, children }) => {
    const [open, setOpen] = useState(false);

    const handleSelect = (emoji: string) => {
        onSelect(emoji);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {children || <Button variant="ghost" size="sm">😀</Button>}
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2">
                <div className="grid grid-cols-5 gap-2">
                    {EMOJI_LIST.map((emoji) => (
                        <button
                            key={emoji}
                            onClick={() => handleSelect(emoji)}
                            className="text-2xl hover:bg-accent rounded p-2 transition-colors"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
};
