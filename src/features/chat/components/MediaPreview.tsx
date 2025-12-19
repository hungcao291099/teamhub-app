import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { X, Download, ZoomIn, ZoomOut, RotateCcw, RotateCw, FlipHorizontal, FlipVertical, RefreshCw } from "lucide-react";
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
    const [zoom, setZoom] = useState(1);
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);
    const [rotation, setRotation] = useState(0);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (open) {
            setZoom(1);
            setFlipH(false);
            setFlipV(false);
            setRotation(0);
        }
    }, [open]);

    if (!url) return null;

    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName || "download";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.25, 3));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.25, 0.5));
    };

    const handleResetZoom = () => {
        setZoom(1);
        setFlipH(false);
        setFlipV(false);
        setRotation(0);
    };

    const handleRotateLeft = () => {
        setRotation(prev => prev - 90);
    };

    const handleRotateRight = () => {
        setRotation(prev => prev + 90);
    };

    const handleFlipHorizontal = () => {
        setFlipH(prev => !prev);
    };

    const handleFlipVertical = () => {
        setFlipV(prev => !prev);
    };

    const transformStyle = {
        transform: `scale(${(flipH ? -1 : 1) * zoom}, ${(flipV ? -1 : 1) * zoom}) rotate(${rotation}deg)`,
        transition: 'transform 0.2s ease-out'
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-screen h-screen max-w-none max-h-none p-0 border-none bg-black/95 shadow-none text-white overflow-hidden flex flex-col items-center justify-center focus:outline-none rounded-none">
                <DialogTitle className="sr-only">Media Preview</DialogTitle>

                {/* Top Controls */}
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
                            title="Đóng"
                        >
                            <X className="h-6 w-6" />
                        </Button>
                    </DialogClose>
                </div>

                {/* Image Controls - Bottom center */}
                {type === "image" && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-3 py-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 rounded-full h-9 w-9"
                            onClick={handleZoomOut}
                            disabled={zoom <= 0.5}
                            title="Thu nhỏ"
                        >
                            <ZoomOut className="h-5 w-5" />
                        </Button>
                        <span className="text-white text-sm min-w-[50px] text-center font-medium">
                            {Math.round(zoom * 100)}%
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 rounded-full h-9 w-9"
                            onClick={handleZoomIn}
                            disabled={zoom >= 3}
                            title="Phóng to"
                        >
                            <ZoomIn className="h-5 w-5" />
                        </Button>
                        <div className="w-px h-5 bg-white/30 mx-1" />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 rounded-full h-9 w-9"
                            onClick={handleFlipHorizontal}
                            title="Lật ngang"
                        >
                            <FlipHorizontal className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 rounded-full h-9 w-9"
                            onClick={handleFlipVertical}
                            title="Lật dọc"
                        >
                            <FlipVertical className="h-5 w-5" />
                        </Button>
                        <div className="w-px h-5 bg-white/30 mx-1" />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 rounded-full h-9 w-9"
                            onClick={handleRotateLeft}
                            title="Xoay trái"
                        >
                            <RotateCcw className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 rounded-full h-9 w-9"
                            onClick={handleRotateRight}
                            title="Xoay phải"
                        >
                            <RotateCw className="h-5 w-5" />
                        </Button>
                        <div className="w-px h-5 bg-white/30 mx-1" />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20 rounded-full h-9 w-9"
                            onClick={handleResetZoom}
                            title="Đặt lại"
                        >
                            <RefreshCw className="h-5 w-5" />
                        </Button>
                    </div>
                )}

                {/* Content */}
                <div className="w-full h-full flex items-center justify-center p-8 overflow-auto">
                    {type === "image" ? (
                        <img
                            src={url}
                            alt={fileName || "Preview"}
                            className="max-w-[95vw] max-h-[85vh] object-contain cursor-grab active:cursor-grabbing"
                            style={transformStyle}
                            draggable={false}
                        />
                    ) : (
                        <video
                            src={url}
                            controls
                            autoPlay
                            className="max-w-[95vw] max-h-[85vh]"
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
