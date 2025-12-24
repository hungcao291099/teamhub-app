import "reflect-metadata"
import { DataSource } from "typeorm"
import * as path from "path"

const dbPath = path.resolve(__dirname, "../database.sqlite")

const TempDataSource = new DataSource({
    type: "sqlite",
    database: dbPath,
    synchronize: false,
    logging: true,
})

async function fixDatabase() {
    console.log("Connecting to database:", dbPath)
    await TempDataSource.initialize()
    const qr = TempDataSource.createQueryRunner()

    // Add credit column to user table
    try {
        await qr.query('ALTER TABLE user ADD COLUMN credit INTEGER DEFAULT 1000')
        console.log("✓ Added credit column to user table")
    } catch (e: any) {
        if (e.message.includes("duplicate column")) {
            console.log("✓ Credit column already exists")
        } else {
            console.error("Error adding credit column:", e.message)
        }
    }

    // Create credit_transaction table
    try {
        await qr.query(`
            CREATE TABLE IF NOT EXISTS credit_transaction (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER,
                amount INTEGER,
                type VARCHAR,
                description VARCHAR,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                balanceAfter INTEGER
            )
        `)
        console.log("✓ credit_transaction table ready")
    } catch (e: any) {
        console.error("Error creating credit_transaction:", e.message)
    }

    // Create game_table table
    try {
        await qr.query(`
            CREATE TABLE IF NOT EXISTS game_table (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                gameType VARCHAR,
                name VARCHAR,
                status VARCHAR DEFAULT 'waiting',
                maxPlayers INTEGER DEFAULT 4,
                minBet INTEGER DEFAULT 10,
                maxBet INTEGER DEFAULT 1000,
                createdById INTEGER,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                gameState TEXT
            )
        `)
        console.log("✓ game_table table ready")
    } catch (e: any) {
        console.error("Error creating game_table:", e.message)
    }

    // Create game_table_participant table
    try {
        await qr.query(`
            CREATE TABLE IF NOT EXISTS game_table_participant (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                tableId INTEGER,
                userId INTEGER,
                status VARCHAR DEFAULT 'joined',
                currentBet INTEGER DEFAULT 0,
                joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                handState TEXT
            )
        `)
        console.log("✓ game_table_participant table ready")
    } catch (e: any) {
        console.error("Error creating game_table_participant:", e.message)
    }

    console.log("\nDatabase fix completed!")
    await TempDataSource.destroy()
    process.exit(0)
}

fixDatabase().catch(e => {
    console.error("Fatal error:", e)
    process.exit(1)
})
