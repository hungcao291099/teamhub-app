import { MigrationInterface, QueryRunner } from "typeorm"

export class AddDealerIdToGameTable1735100000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add dealerId column to game_table
        await queryRunner.query(`
            ALTER TABLE "game_table" ADD COLUMN "dealerId" INTEGER
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // SQLite doesn't support DROP COLUMN directly, but we can use a workaround
        // For now, just leave the column
    }
}
