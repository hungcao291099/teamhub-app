import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSelectedShiftMaToUser1735120000000 implements MigrationInterface {
    name = 'AddSelectedShiftMaToUser1735120000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        try {
            await queryRunner.query(`ALTER TABLE "user" ADD "selectedShiftMa" varchar`);
        } catch (e: any) {
            if (e.message.includes("duplicate column name")) {
                console.log("Column selectedShiftMa already exists, skipping...");
            } else {
                throw e;
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        try {
            await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "selectedShiftMa"`);
        } catch (e: any) {
            console.log("Error dropping column (might not exist in SQLite):", e.message);
        }
    }
}
