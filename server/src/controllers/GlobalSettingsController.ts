import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { GlobalSetting } from "../entities/GlobalSetting";
import { getIO } from "../socket";

export const getTheme = async (req: Request, res: Response) => {
    const settingRepo = AppDataSource.getRepository(GlobalSetting);
    try {
        const setting = await settingRepo.findOne({ where: { key: 'theme_event' } });
        res.json({ themeId: setting ? setting.value : 'default' });
    } catch (error) {
        console.error("Error fetching theme:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateTheme = async (req: Request, res: Response) => {
    const settingRepo = AppDataSource.getRepository(GlobalSetting);
    try {
        const { themeId } = req.body;
        if (!themeId) {
            return res.status(400).json({ message: "Theme ID is required" });
        }

        let setting = await settingRepo.findOne({ where: { key: 'theme_event' } });
        if (!setting) {
            setting = new GlobalSetting();
            setting.key = 'theme_event';
        }
        setting.value = themeId;
        await settingRepo.save(setting);

        // Emit socket event
        try {
            const io = getIO();
            io.emit('theme:updated', { themeId });
        } catch (e) {
            console.warn("Socket IO not initialized or failed to emit", e);
        }

        res.json({ message: "Theme updated", themeId });
    } catch (error) {
        console.error("Error updating theme:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getAutoCheckInConfig = async (req: Request, res: Response) => {
    const settingRepo = AppDataSource.getRepository(GlobalSetting);
    try {
        const setting = await settingRepo.findOne({ where: { key: 'auto_checkin_enabled' } });
        res.json({ enabled: setting ? setting.value === 'true' : true }); // Default to true if not set
    } catch (error) {
        console.error("Error fetching auto check-in config:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateAutoCheckInConfig = async (req: Request, res: Response) => {
    const settingRepo = AppDataSource.getRepository(GlobalSetting);
    try {
        const { enabled } = req.body;
        if (enabled === undefined) {
            return res.status(400).json({ message: "Enabled status is required" });
        }

        let setting = await settingRepo.findOne({ where: { key: 'auto_checkin_enabled' } });
        if (!setting) {
            setting = new GlobalSetting();
            setting.key = 'auto_checkin_enabled';
        }
        setting.value = enabled ? 'true' : 'false';
        await settingRepo.save(setting);

        res.json({ message: "Auto check-in config updated", enabled });
    } catch (error) {
        console.error("Error updating auto check-in config:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
