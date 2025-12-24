import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddSelectedFrameToUser1735004000000 implements MigrationInterface {
    name = 'AddSelectedFrameToUser1735004000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            "user",
            new TableColumn({
                name: "selectedFrame",
                type: "varchar",
                isNullable: true,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("user", "selectedFrame");
    }
}
