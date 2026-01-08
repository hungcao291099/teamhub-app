import "reflect-metadata"
import express from "express"
import cors from "cors"
import { AppDataSource } from "./data-source"
import authRoutes from "./routes/auth";
import eventRoutes from "./routes/events";

import fundRoutes from "./routes/funds";
import dutyRoutes from "./routes/duty";
// Beer routes removed
import userRoutes from "./routes/users";
import settingsRoutes from "./routes/settings";
import appRoutes from "./routes/app";
import chatRoutes from "./routes/chatRoutes";
import musicRoutes from "./routes/musicRoutes";
import gamesRoutes from "./routes/gamesRoutes";
import { User } from "./entities/User";
import { initSocket } from "./socket";
import { createServer } from "http";
import path from "path";

const app = express()
const port = 3001

// Config CORS
app.use(cors());

app.use(express.json())
// Serve static files from 'public' directory
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

app.use("/auth", authRoutes);
app.use("/events", eventRoutes);

app.use("/funds", fundRoutes);
app.use("/duty", dutyRoutes);
app.use("/users", userRoutes);
app.use("/settings", settingsRoutes);
app.use("/app", appRoutes);
app.use("/chat", chatRoutes);
app.use("/music", musicRoutes);
app.use("/games", gamesRoutes);

const httpServer = createServer(app);

AppDataSource.initialize().then(async () => {
    console.log("Data Source has been initialized!")
    console.log("Running migrations...");
    try {
        await AppDataSource.runMigrations();
        console.log("Migrations completed.");
    } catch (e) {
        console.error("Migration failed:", e);
    }


    // Seed Admin User
    const userRepo = AppDataSource.getRepository(User);
    const adminExists = await userRepo.findOne({ where: { role: "admin" } });

    if (!adminExists) {
        console.log("Seeding Admin User...");
        const admin = new User();
        admin.username = "admin";
        admin.password = "123456"; // Plain text as requested
        admin.role = "admin";
        admin.name = "System Admin";
        await userRepo.save(admin);
        console.log("Admin User Created: admin / 123456");
    } else {
        // Ensure role is admin
        if (adminExists.role !== "admin") {
            adminExists.role = "admin";
            await userRepo.save(adminExists);
            console.log("Updated Admin User role to 'admin'");
        }
    }

    //app.get("/", (req, res) => {
    //    res.send("TeamHub API is running!")
    //})
    const staticPath = path.join(__dirname, "../../dist");
    app.use(express.static(staticPath));
    app.get("*", (req, res) => {
        res.sendFile(path.join(staticPath, "index.html"));
    });

    // Init Socket
    // Init Socket
    initSocket(httpServer);

    httpServer.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`)
    })

}).catch((err) => {
    console.error("Error during Data Source initialization", err)
})
