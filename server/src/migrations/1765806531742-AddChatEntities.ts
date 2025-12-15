import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChatEntities1765806531742 implements MigrationInterface {
    name = 'AddChatEntities1765806531742'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "conversation_participants" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "conversationId" integer NOT NULL, "userId" integer NOT NULL, "lastReadMessageId" integer, "lastReadAt" datetime, "notificationsEnabled" boolean NOT NULL DEFAULT (1), "joinedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "conversations" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar, "type" varchar NOT NULL DEFAULT ('direct'), "lastMessageId" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "messages" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "conversationId" integer NOT NULL, "senderId" integer NOT NULL, "content" text NOT NULL, "type" varchar NOT NULL DEFAULT ('text'), "fileUrl" varchar, "fileName" varchar, "replyToId" integer, "isEdited" boolean NOT NULL DEFAULT (0), "isDeleted" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime)`);
        await queryRunner.query(`CREATE TABLE "message_reactions" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "messageId" integer NOT NULL, "userId" integer NOT NULL, "emoji" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "temporary_conversation_participants" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "conversationId" integer NOT NULL, "userId" integer NOT NULL, "lastReadMessageId" integer, "lastReadAt" datetime, "notificationsEnabled" boolean NOT NULL DEFAULT (1), "joinedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_4453e20858b14ab765a09ad728c" FOREIGN KEY ("conversationId") REFERENCES "conversations" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_18c4ba3b127461649e5f5039dbf" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_conversation_participants"("id", "conversationId", "userId", "lastReadMessageId", "lastReadAt", "notificationsEnabled", "joinedAt") SELECT "id", "conversationId", "userId", "lastReadMessageId", "lastReadAt", "notificationsEnabled", "joinedAt" FROM "conversation_participants"`);
        await queryRunner.query(`DROP TABLE "conversation_participants"`);
        await queryRunner.query(`ALTER TABLE "temporary_conversation_participants" RENAME TO "conversation_participants"`);
        await queryRunner.query(`CREATE TABLE "temporary_messages" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "conversationId" integer NOT NULL, "senderId" integer NOT NULL, "content" text NOT NULL, "type" varchar NOT NULL DEFAULT ('text'), "fileUrl" varchar, "fileName" varchar, "replyToId" integer, "isEdited" boolean NOT NULL DEFAULT (0), "isDeleted" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime, CONSTRAINT "FK_e5663ce0c730b2de83445e2fd19" FOREIGN KEY ("conversationId") REFERENCES "conversations" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_2db9cf2b3ca111742793f6c37ce" FOREIGN KEY ("senderId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_f550135b17eaf7c5452ae5fd4a8" FOREIGN KEY ("replyToId") REFERENCES "messages" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_messages"("id", "conversationId", "senderId", "content", "type", "fileUrl", "fileName", "replyToId", "isEdited", "isDeleted", "createdAt", "updatedAt", "deletedAt") SELECT "id", "conversationId", "senderId", "content", "type", "fileUrl", "fileName", "replyToId", "isEdited", "isDeleted", "createdAt", "updatedAt", "deletedAt" FROM "messages"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`ALTER TABLE "temporary_messages" RENAME TO "messages"`);
        await queryRunner.query(`CREATE TABLE "temporary_message_reactions" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "messageId" integer NOT NULL, "userId" integer NOT NULL, "emoji" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_7623d77216e8457a552490259e0" FOREIGN KEY ("messageId") REFERENCES "messages" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_82d59cb474d00eea46d7e192f28" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_message_reactions"("id", "messageId", "userId", "emoji", "createdAt") SELECT "id", "messageId", "userId", "emoji", "createdAt" FROM "message_reactions"`);
        await queryRunner.query(`DROP TABLE "message_reactions"`);
        await queryRunner.query(`ALTER TABLE "temporary_message_reactions" RENAME TO "message_reactions"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "message_reactions" RENAME TO "temporary_message_reactions"`);
        await queryRunner.query(`CREATE TABLE "message_reactions" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "messageId" integer NOT NULL, "userId" integer NOT NULL, "emoji" varchar NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "message_reactions"("id", "messageId", "userId", "emoji", "createdAt") SELECT "id", "messageId", "userId", "emoji", "createdAt" FROM "temporary_message_reactions"`);
        await queryRunner.query(`DROP TABLE "temporary_message_reactions"`);
        await queryRunner.query(`ALTER TABLE "messages" RENAME TO "temporary_messages"`);
        await queryRunner.query(`CREATE TABLE "messages" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "conversationId" integer NOT NULL, "senderId" integer NOT NULL, "content" text NOT NULL, "type" varchar NOT NULL DEFAULT ('text'), "fileUrl" varchar, "fileName" varchar, "replyToId" integer, "isEdited" boolean NOT NULL DEFAULT (0), "isDeleted" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "deletedAt" datetime)`);
        await queryRunner.query(`INSERT INTO "messages"("id", "conversationId", "senderId", "content", "type", "fileUrl", "fileName", "replyToId", "isEdited", "isDeleted", "createdAt", "updatedAt", "deletedAt") SELECT "id", "conversationId", "senderId", "content", "type", "fileUrl", "fileName", "replyToId", "isEdited", "isDeleted", "createdAt", "updatedAt", "deletedAt" FROM "temporary_messages"`);
        await queryRunner.query(`DROP TABLE "temporary_messages"`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" RENAME TO "temporary_conversation_participants"`);
        await queryRunner.query(`CREATE TABLE "conversation_participants" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "conversationId" integer NOT NULL, "userId" integer NOT NULL, "lastReadMessageId" integer, "lastReadAt" datetime, "notificationsEnabled" boolean NOT NULL DEFAULT (1), "joinedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "conversation_participants"("id", "conversationId", "userId", "lastReadMessageId", "lastReadAt", "notificationsEnabled", "joinedAt") SELECT "id", "conversationId", "userId", "lastReadMessageId", "lastReadAt", "notificationsEnabled", "joinedAt" FROM "temporary_conversation_participants"`);
        await queryRunner.query(`DROP TABLE "temporary_conversation_participants"`);
        await queryRunner.query(`DROP TABLE "message_reactions"`);
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TABLE "conversations"`);
        await queryRunner.query(`DROP TABLE "conversation_participants"`);
    }

}
