import { MigrationInterface, QueryRunner } from "typeorm";

export class AddConversationAvatar1766219051705 implements MigrationInterface {
    name = 'AddConversationAvatar1766219051705'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_conversations" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar, "type" varchar NOT NULL DEFAULT ('direct'), "lastMessageId" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "avatarUrl" varchar)`);
        await queryRunner.query(`INSERT INTO "temporary_conversations"("id", "name", "type", "lastMessageId", "createdAt", "updatedAt") SELECT "id", "name", "type", "lastMessageId", "createdAt", "updatedAt" FROM "conversations"`);
        await queryRunner.query(`DROP TABLE "conversations"`);
        await queryRunner.query(`ALTER TABLE "temporary_conversations" RENAME TO "conversations"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" RENAME TO "temporary_conversations"`);
        await queryRunner.query(`CREATE TABLE "conversations" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar, "type" varchar NOT NULL DEFAULT ('direct'), "lastMessageId" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "conversations"("id", "name", "type", "lastMessageId", "createdAt", "updatedAt") SELECT "id", "name", "type", "lastMessageId", "createdAt", "updatedAt" FROM "temporary_conversations"`);
        await queryRunner.query(`DROP TABLE "temporary_conversations"`);
    }

}
