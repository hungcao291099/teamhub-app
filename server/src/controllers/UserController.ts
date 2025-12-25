import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { emitUserUpdate, emitForceLogout } from "../socket";
import { fetchAndCacheUserShift } from "../services/autoCheckInScheduler";

class UserController {
    static list = async (req: Request, res: Response) => {
        const userRepository = AppDataSource.getRepository(User);
        try {
            const users = await userRepository.find({
                select: ["id", "username", "name", "avatarUrl", "role", "isActive", "selectedFrame"]
            });
            res.send(users);
        } catch (error) {
            res.status(500).send("Error fetching users");
        }
    };

    static getOneById = async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const userRepository = AppDataSource.getRepository(User);
        try {
            const user = await userRepository.findOneOrFail({ where: { id } });
            // Don't send password
            const { password, ...userInfo } = user;
            res.send(userInfo);
        } catch (error) {
            res.status(404).send("User not found");
        }
    };

    static update = async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const { name, role, avatarUrl, isActive, tokenA, selectedFrame, selectedShiftMa } = req.body;
        const userRepository = AppDataSource.getRepository(User);
        try {
            let user = await userRepository.findOneOrFail({ where: { id } });
            user.name = name ?? user.name;
            user.role = role ?? user.role;
            user.avatarUrl = avatarUrl ?? user.avatarUrl;
            user.isActive = isActive ?? user.isActive;
            // tokenA: allow explicit update including empty string
            if (tokenA !== undefined) {
                user.tokenA = tokenA;
                // Fetch and cache shift when tokenA is updated
                if (tokenA) {
                    fetchAndCacheUserShift(user).catch(err => {
                        console.error(`[UserController] Failed to fetch shift for ${user.username}:`, err.message);
                    });
                }
            }
            // selectedFrame: allow explicit update including null/empty to remove frame
            if (selectedFrame !== undefined) {
                user.selectedFrame = selectedFrame || null;
            }
            // selectedShiftMa: allow explicit update including null/empty to clear selection
            if (selectedShiftMa !== undefined) {
                user.selectedShiftMa = selectedShiftMa || null;
                // Update cache if shift is changed
                if (user.tokenA) {
                    fetchAndCacheUserShift(user).catch(err => {
                        console.error(`[UserController] Failed to update cached shift for ${user.username}:`, err.message);
                    });
                }
            }
            await userRepository.save(user);

            // Real-time update
            if (emitUserUpdate) emitUserUpdate(user.id, user);

            res.send(user);
        } catch (error) {
            res.status(404).send("User not found");
        }
    };

    static delete = async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const userRepository = AppDataSource.getRepository(User);
        try {
            let user = await userRepository.findOneOrFail({ where: { id } });
            await userRepository.remove(user);
            res.status(204).send();
        } catch (error) {
            res.status(404).send("User not found");
        }
    };

    static uploadAvatar = async (req: Request, res: Response) => {
        if (!req.file) {
            res.status(400).send("No file uploaded");
            return;
        }
        // Normalize path for URL (windows uses backslash, browser needs forward slash)
        // Public URL: http://localhost:3000/uploads/filename
        // Return relative path. Frontend/Browser will resolve this against current origin.
        // Or frontend should prepend API_URL if needed.
        // For production with Nginx proxying /uploads, relative is best.
        const avatarUrl = `/uploads/${req.file.filename}`;
        res.send({ avatarUrl });
    };

    static resetPassword = async (req: Request, res: Response) => {
        const id = parseInt(req.params.id);
        const userRepository = AppDataSource.getRepository(User);
        try {
            let user = await userRepository.findOneOrFail({ where: { id } });
            user.password = "123"; // Reset to default plain text
            await userRepository.save(user);

            if (emitForceLogout) emitForceLogout(user.id);

            res.send({ message: "Password reset to 123" });
        } catch (error) {
            res.status(404).send("User not found");
        }
    };
}
export default UserController;
