import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTokenAToUser1734681078000 implements MigrationInterface {
    name = 'AddTokenAToUser1734681078000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if column exists before adding
        const table = await queryRunner.getTable("user");
        const hasTokenA = table?.findColumnByName("tokenA");
        if (!hasTokenA) {
            await queryRunner.query(`ALTER TABLE "user" ADD "tokenA" varchar`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("user");
        const hasTokenA = table?.findColumnByName("tokenA");
        if (hasTokenA) {
            await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "tokenA"`);
        }
    }

}
