// src/features/account/AvatarCropDialog.jsx
import { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: "%",
                width: 80,
            },
            aspect,
            mediaWidth,
            mediaHeight
        ),
        mediaWidth,
        mediaHeight
    );
}

export function AvatarCropDialog({ open, onOpenChange, imageFile, onCropComplete }) {
    const [imgSrc, setImgSrc] = useState("");
    const [crop, setCrop] = useState();
    const [completedCrop, setCompletedCrop] = useState();
    const [scale, setScale] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const imgRef = useRef(null);
    const previewCanvasRef = useRef(null);

    // Load image when file changes
    useEffect(() => {
        if (imageFile) {
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                setImgSrc(reader.result?.toString() || "");
                setScale(1);
                setCrop(undefined);
                setCompletedCrop(undefined);
            });
            reader.readAsDataURL(imageFile);
        } else {
            setImgSrc("");
            setCrop(undefined);
            setCompletedCrop(undefined);
            setScale(1);
        }
    }, [imageFile]);

    const onImageLoad = useCallback((e) => {
        const { width, height } = e.currentTarget;
        const newCrop = centerAspectCrop(width, height, 1);
        setCrop(newCrop);
    }, []);

    // Draw preview on canvas when crop changes
    useEffect(() => {
        if (
            completedCrop?.width &&
            completedCrop?.height &&
            imgRef.current &&
            previewCanvasRef.current
        ) {
            const image = imgRef.current;
            const canvas = previewCanvasRef.current;
            const ctx = canvas.getContext("2d");

            if (!ctx) return;

            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;

            const pixelRatio = window.devicePixelRatio || 1;
            const outputSize = 200;

            canvas.width = outputSize * pixelRatio;
            canvas.height = outputSize * pixelRatio;

            ctx.scale(pixelRatio, pixelRatio);
            ctx.imageSmoothingQuality = "high";

            // Clear canvas for transparency support
            ctx.clearRect(0, 0, outputSize, outputSize);

            // completedCrop is in rendered pixels, convert to natural pixels
            const cropX = completedCrop.x * scaleX;
            const cropY = completedCrop.y * scaleY;
            const cropWidth = completedCrop.width * scaleX;
            const cropHeight = completedCrop.height * scaleY;

            ctx.drawImage(
                image,
                cropX,
                cropY,
                cropWidth,
                cropHeight,
                0,
                0,
                outputSize,
                outputSize
            );
        }
    }, [completedCrop]);

    const handleConfirm = async () => {
        if (!completedCrop || !imgRef.current) {
            console.error("No crop or image reference");
            return;
        }

        setIsLoading(true);

        try {
            const image = imgRef.current;
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            if (!ctx) {
                console.error("Could not get canvas context");
                setIsLoading(false);
                return;
            }

            const scaleX = image.naturalWidth / image.width;
            const scaleY = image.naturalHeight / image.height;

            const outputSize = 400; // Output size for avatar

            canvas.width = outputSize;
            canvas.height = outputSize;

            ctx.imageSmoothingQuality = "high";

            // Convert rendered pixel coordinates to natural pixel coordinates
            const cropX = completedCrop.x * scaleX;
            const cropY = completedCrop.y * scaleY;
            const cropWidth = completedCrop.width * scaleX;
            const cropHeight = completedCrop.height * scaleY;

            console.log("Crop info:", {
                completedCrop,
                scaleX,
                scaleY,
                cropX,
                cropY,
                cropWidth,
                cropHeight,
                naturalWidth: image.naturalWidth,
                naturalHeight: image.naturalHeight,
                displayWidth: image.width,
                displayHeight: image.height
            });

            ctx.drawImage(
                image,
                cropX,
                cropY,
                cropWidth,
                cropHeight,
                0,
                0,
                outputSize,
                outputSize
            );

            // Convert canvas to blob - use PNG to preserve transparency
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        console.log("Created blob:", blob.size, "bytes");
                        const file = new File([blob], "avatar.png", { type: "image/png" });
                        onCropComplete(file);
                    } else {
                        console.error("Failed to create blob");
                        setIsLoading(false);
                    }
                },
                "image/png"
            );
        } catch (error) {
            console.error("Error cropping image:", error);
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setImgSrc("");
        setCrop(undefined);
        setCompletedCrop(undefined);
        setScale(1);
        onOpenChange(false);
    };

    const handleReset = () => {
        setScale(1);
        if (imgRef.current) {
            const { width, height } = imgRef.current;
            setCrop(centerAspectCrop(width, height, 1));
        }
    };

    // Calculate image display dimensions based on scale
    const getImageStyle = () => {
        const baseMaxHeight = 280;
        return {
            maxHeight: `${baseMaxHeight * scale}px`,
            width: "auto",
            display: "block",
        };
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Chỉnh sửa ảnh đại diện</DialogTitle>
                    <DialogDescription>
                        Kéo để di chuyển vùng cắt, sử dụng thanh trượt để phóng to/thu nhỏ
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Crop Area */}
                    {imgSrc && (
                        <div className="flex justify-center bg-muted/50 rounded-lg p-2 overflow-auto max-h-[320px]">
                            <ReactCrop
                                crop={crop}
                                onChange={(pixelCrop, percentCrop) => setCrop(percentCrop)}
                                onComplete={(c) => setCompletedCrop(c)}
                                aspect={1}
                                circularCrop
                            >
                                <img
                                    ref={imgRef}
                                    alt="Crop"
                                    src={imgSrc}
                                    style={getImageStyle()}
                                    onLoad={onImageLoad}
                                />
                            </ReactCrop>
                        </div>
                    )}

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-3 px-2">
                        <ZoomOut className="h-4 w-4 text-muted-foreground" />
                        <Slider
                            value={[scale]}
                            onValueChange={(values) => setScale(values[0])}
                            min={0.5}
                            max={2}
                            step={0.1}
                            className="flex-1"
                        />
                        <ZoomIn className="h-4 w-4 text-muted-foreground" />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleReset}
                            title="Đặt lại"
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Preview */}
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-sm text-muted-foreground">Xem trước</p>
                        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-border bg-muted">
                            <canvas
                                ref={previewCanvasRef}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button type="button" variant="secondary" onClick={handleCancel}>
                        Hủy
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!completedCrop || isLoading}
                    >
                        {isLoading ? "Đang xử lý..." : "Xác nhận"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

