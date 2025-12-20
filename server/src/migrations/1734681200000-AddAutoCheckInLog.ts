import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAutoCheckInLog1734681200000 implements MigrationInterface {
    name = 'AddAutoCheckInLog1734681200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "auto_checkin_log" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "userId" integer NOT NULL,
                "username" varchar NOT NULL,
                "action" varchar NOT NULL,
                "shiftCode" varchar NOT NULL,
                "shiftName" varchar NOT NULL,
                "scheduledTime" varchar NOT NULL,
                "actualTime" varchar NOT NULL,
                "status" varchar NOT NULL,
                "response" text,
                "createdAt" datetime NOT NULL DEFAULT (datetime('now'))
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "auto_checkin_log"`);
    }
}
