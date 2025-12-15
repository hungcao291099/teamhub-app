import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "your-32-character-secret-key!!"; // Must be 32 chars for AES-256
const ALGORITHM = "aes-256-cbc";

// Ensure key is exactly 32 bytes
const KEY = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));

export const encrypt = (text: string): string => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    // Return iv + encrypted data (iv needed for decryption)
    return iv.toString("hex") + ":" + encrypted;
};

export const decrypt = (encryptedText: string): string => {
    const parts = encryptedText.split(":");
    if (parts.length !== 2) {
        throw new Error("Invalid encrypted text format");
    }
    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
};
