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

async function clearTables() {
    console.log("Connecting to database:", dbPath)
    await TempDataSource.initialize()
    const qr = TempDataSource.createQueryRunner()

    try {
        await qr.query('DELETE FROM game_table_participant')
        console.log("✓ Cleared game_table_participant")
    } catch (e: any) {
        console.log("Error:", e.message)
    }

    try {
        await qr.query('DELETE FROM game_table')
        console.log("✓ Cleared game_table")
    } catch (e: any) {
        console.log("Error:", e.message)
    }

    console.log("\nTables cleared!")
    await TempDataSource.destroy()
    process.exit(0)
}

clearTables().catch(e => {
    console.error("Fatal error:", e)
    process.exit(1)
})
