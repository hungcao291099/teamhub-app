import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTokenAToUser1734681078000 implements MigrationInterface {
    name = 'AddTokenAToUser1734681078000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "tokenA" varchar`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "tokenA"`);
    }

}
