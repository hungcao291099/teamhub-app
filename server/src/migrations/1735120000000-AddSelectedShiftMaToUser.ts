import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSelectedShiftMaToUser1735120000000 implements MigrationInterface {
    name = 'AddSelectedShiftMaToUser1735120000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("user");
        if (table && !table.findColumnByName("selectedShiftMa")) {
            await queryRunner.query(`ALTER TABLE "user" ADD "selectedShiftMa" varchar`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("user");
        if (table && table.findColumnByName("selectedShiftMa")) {
            await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "selectedShiftMa"`);
        }
    }
}
