import { Router } from "express";
import { checkJwt } from "../middlewares/checkJwt";
import * as chatController from "../controllers/chatController";
import multer from "multer";
import path from "path";

const router = Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/uploads/chat");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, "chat-" + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|pdf|doc|docx|txt/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type"));
        }
    }
});

// All routes require authentication
router.use(checkJwt);

// Middleware to attach userId from JWT
router.use((req, res, next) => {
    (req as any).userId = res.locals.jwtPayload.userId;
    next();
});

// Conversation routes
router.get("/conversations", chatController.getConversations);
router.post("/conversations", chatController.getOrCreateConversation);
router.post("/conversations/group", chatController.createGroupConversation);
router.get("/conversations/:conversationId/messages", chatController.getMessages);

// Message routes
router.post("/messages", chatController.sendMessage);
router.patch("/messages/:messageId", chatController.editMessage);
router.delete("/messages/:messageId", chatController.deleteMessage);

// Read status
router.post("/messages/read", chatController.markAsRead);

// Reactions
router.post("/messages/:messageId/reactions", chatController.addReaction);
router.delete("/messages/:messageId/reactions", chatController.removeReaction);

// Upload
router.post("/upload", upload.single("file"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const fileUrl = `/uploads/chat/${req.file.filename}`;
    res.json({
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
    });
});

export default router;
