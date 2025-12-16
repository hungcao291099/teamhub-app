import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRoleToConversationParticipant1765877312504 implements MigrationInterface {
    name = 'AddRoleToConversationParticipant1765877312504'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_conversation_participants" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "conversationId" integer NOT NULL, "userId" integer NOT NULL, "lastReadMessageId" integer, "lastReadAt" datetime, "notificationsEnabled" boolean NOT NULL DEFAULT (1), "joinedAt" datetime NOT NULL DEFAULT (datetime('now')), "role" varchar NOT NULL DEFAULT ('member'), CONSTRAINT "FK_18c4ba3b127461649e5f5039dbf" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_4453e20858b14ab765a09ad728c" FOREIGN KEY ("conversationId") REFERENCES "conversations" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_conversation_participants"("id", "conversationId", "userId", "lastReadMessageId", "lastReadAt", "notificationsEnabled", "joinedAt") SELECT "id", "conversationId", "userId", "lastReadMessageId", "lastReadAt", "notificationsEnabled", "joinedAt" FROM "conversation_participants"`);
        await queryRunner.query(`DROP TABLE "conversation_participants"`);
        await queryRunner.query(`ALTER TABLE "temporary_conversation_participants" RENAME TO "conversation_participants"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversation_participants" RENAME TO "temporary_conversation_participants"`);
        await queryRunner.query(`CREATE TABLE "conversation_participants" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "conversationId" integer NOT NULL, "userId" integer NOT NULL, "lastReadMessageId" integer, "lastReadAt" datetime, "notificationsEnabled" boolean NOT NULL DEFAULT (1), "joinedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_18c4ba3b127461649e5f5039dbf" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_4453e20858b14ab765a09ad728c" FOREIGN KEY ("conversationId") REFERENCES "conversations" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "conversation_participants"("id", "conversationId", "userId", "lastReadMessageId", "lastReadAt", "notificationsEnabled", "joinedAt") SELECT "id", "conversationId", "userId", "lastReadMessageId", "lastReadAt", "notificationsEnabled", "joinedAt" FROM "temporary_conversation_participants"`);
        await queryRunner.query(`DROP TABLE "temporary_conversation_participants"`);
    }

}
