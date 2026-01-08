import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import * as jwt from "jsonwebtoken";
import * as crypto from "crypto";
import config from "../config";
import { emitForceLogout } from "../socket";

// Helper for SHA256
const hashPassword = (password: string) => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

class AuthController {
    static login = async (req: Request, res: Response) => {
        // Check if username and password are set
        let { username, password, clientType } = req.body;
        if (!(username && password)) {
            res.status(400).send("Username and password are required");
            return;
        }

        // Default clientType to 'web' if not provided
        if (!clientType) {
            clientType = 'web';
        }

        // Get user from database
        const userRepository = AppDataSource.getRepository(User);
        let user: User;
        try {
            user = await userRepository.findOneOrFail({ where: { username } });
        } catch (error) {
            res.status(401).send("Username or password incorrect");
            return;
        }

        // Check if password match (SHA256 OR Plain text)
        const isMatch = hashPassword(password) === user.password || password === user.password;

        if (!isMatch) {
            res.status(401).send("Username or password incorrect");
            return;
        }

        // Single Session Enforcement (Force Logout others of SAME clientType)
        try {
            if (emitForceLogout) emitForceLogout(user.id, clientType);
        } catch (e) { console.log("Socket not ready"); }

        // Sing JWT, valid for 1 hour
        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role }, // Payload
            config.jwtSecret,
            { expiresIn: "24h" } // Increase token life
        );

        // Send the jwt in the response
        res.send({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role, avatarUrl: user.avatarUrl } });
    };

    static createUser = async (req: Request, res: Response) => {
        let { username, password, name, role } = req.body;

        // Basic validation
        if (!username || !password) {
            res.status(400).send("Username and password are required");
            return;
        }

        let user = new User();
        user.username = username;
        // Plain text for development simplification
        user.password = password;
        user.name = name;
        user.role = role || "member";

        const userRepository = AppDataSource.getRepository(User);
        try {
            await userRepository.save(user);
        } catch (e) {
            res.status(409).send("username already in use");
            return;
        }

        // If all ok, send 201 response
        res.status(201).send("User created");
    };

    static me = async (req: Request, res: Response) => {
        // Get user from database based on jwtPayload
        const id = res.locals.jwtPayload.userId;
        const userRepository = AppDataSource.getRepository(User);
        try {
            const user = await userRepository.findOneOrFail({ where: { id } });
            // Don't send password
            const { password, ...userInfo } = user;
            res.send(userInfo);
        } catch (id) {
            res.status(401).send();
        }
    }
}
export default AuthController;
