import React from "react";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaPreviewProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    url: string | null;
    type: "image" | "video";
    fileName?: string;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({
    open,
    onOpenChange,
    url,
    type,
    fileName
}) => {
    if (!url) return null;

    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName || "download";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 border-none bg-black/80 shadow-none text-white overflow-hidden flex flex-col items-center justify-center focus:outline-none">
                <DialogTitle className="sr-only">Media Preview</DialogTitle>

                {/* Controls */}
                <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20 rounded-full"
                        onClick={handleDownload}
                        title="Tải xuống"
                    >
                        <Download className="h-6 w-6" />
                    </Button>
                    <DialogClose asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 rounded-full"
                        >
                            <X className="h-6 w-6" />
                        </Button>
                    </DialogClose>
                </div>

                {/* Content */}
                <div className="w-full h-full flex items-center justify-center p-4">
                    {type === "image" ? (
                        <img
                            src={url}
                            alt={fileName || "Preview"}
                            className="max-w-full max-h-full object-contain"
                        />
                    ) : (
                        <video
                            src={url}
                            controls
                            autoPlay
                            className="max-w-full max-h-full"
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
