import { useEffect, useRef, useCallback } from "react";

interface UseCheatcodeOptions {
    code: string;
    maxInterval?: number;
    onTrigger: () => void;
}

/**
 * Hook to detect cheatcode key sequences
 * @param code - The key sequence to detect (e.g., "givememoney")
 * @param maxInterval - Maximum milliseconds between keystrokes (default: 500)
 * @param onTrigger - Callback when sequence is completed
 */
export function useCheatcode({ code, maxInterval = 500, onTrigger }: UseCheatcodeOptions) {
    const inputRef = useRef<string>("");
    const lastKeyTimeRef = useRef<number>(0);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const now = Date.now();
        const key = event.key.toLowerCase();

        // Reset if too much time has passed
        if (now - lastKeyTimeRef.current > maxInterval && inputRef.current.length > 0) {
            inputRef.current = "";
        }

        lastKeyTimeRef.current = now;

        // Only track alphabetic keys
        if (/^[a-z]$/.test(key)) {
            inputRef.current += key;

            // Check if code is complete
            if (inputRef.current === code.toLowerCase()) {
                inputRef.current = "";
                onTrigger();
            }

            // Keep only the last N characters where N is code length
            if (inputRef.current.length > code.length) {
                inputRef.current = inputRef.current.slice(-code.length);
            }
        }
    }, [code, maxInterval, onTrigger]);

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);
}
