import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGameInvite1766645120831 implements MigrationInterface {
    name = 'AddGameInvite1766645120831'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "username" varchar NOT NULL, "avatarUrl" varchar, "password" varchar NOT NULL, "role" varchar NOT NULL DEFAULT ('member'), "name" varchar, "isActive" boolean NOT NULL DEFAULT (1), "tokenA" varchar, "selectedFrame" varchar, "credit" integer DEFAULT (1000), "selectedShiftMa" varchar)`);
        await queryRunner.query(`INSERT INTO "temporary_user"("id", "username", "avatarUrl", "password", "role", "name", "isActive", "tokenA", "selectedFrame", "credit", "selectedShiftMa") SELECT "id", "username", "avatarUrl", "password", "role", "name", "isActive", "tokenA", "selectedFrame", "credit", "selectedShiftMa" FROM "user"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`ALTER TABLE "temporary_user" RENAME TO "user"`);
        await queryRunner.query(`CREATE TABLE "game_invite" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "tableId" integer NOT NULL, "userId" integer NOT NULL, "fromUserId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE TABLE "temporary_user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "username" varchar NOT NULL, "avatarUrl" varchar, "password" varchar NOT NULL, "role" varchar NOT NULL DEFAULT ('member'), "name" varchar, "isActive" boolean NOT NULL DEFAULT (1), "tokenA" varchar, "selectedFrame" varchar, "credit" integer NOT NULL DEFAULT (1000), "selectedShiftMa" varchar)`);
        await queryRunner.query(`INSERT INTO "temporary_user"("id", "username", "avatarUrl", "password", "role", "name", "isActive", "tokenA", "selectedFrame", "credit", "selectedShiftMa") SELECT "id", "username", "avatarUrl", "password", "role", "name", "isActive", "tokenA", "selectedFrame", "credit", "selectedShiftMa" FROM "user"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`ALTER TABLE "temporary_user" RENAME TO "user"`);
        await queryRunner.query(`CREATE TABLE "temporary_credit_transaction" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "userId" integer NOT NULL, "amount" integer NOT NULL, "type" varchar NOT NULL, "description" varchar, "timestamp" datetime NOT NULL DEFAULT (datetime('now')), "balanceAfter" integer NOT NULL)`);
        await queryRunner.query(`INSERT INTO "temporary_credit_transaction"("id", "userId", "amount", "type", "description", "timestamp", "balanceAfter") SELECT "id", "userId", "amount", "type", "description", "timestamp", "balanceAfter" FROM "credit_transaction"`);
        await queryRunner.query(`DROP TABLE "credit_transaction"`);
        await queryRunner.query(`ALTER TABLE "temporary_credit_transaction" RENAME TO "credit_transaction"`);
        await queryRunner.query(`CREATE TABLE "temporary_game_table" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "gameType" varchar NOT NULL, "name" varchar NOT NULL, "status" varchar NOT NULL DEFAULT ('waiting'), "maxPlayers" integer NOT NULL DEFAULT (4), "minBet" integer NOT NULL DEFAULT (10), "maxBet" integer NOT NULL DEFAULT (1000), "createdById" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "gameState" text, "dealerId" integer)`);
        await queryRunner.query(`INSERT INTO "temporary_game_table"("id", "gameType", "name", "status", "maxPlayers", "minBet", "maxBet", "createdById", "createdAt", "gameState", "dealerId") SELECT "id", "gameType", "name", "status", "maxPlayers", "minBet", "maxBet", "createdById", "createdAt", "gameState", "dealerId" FROM "game_table"`);
        await queryRunner.query(`DROP TABLE "game_table"`);
        await queryRunner.query(`ALTER TABLE "temporary_game_table" RENAME TO "game_table"`);
        await queryRunner.query(`CREATE TABLE "temporary_game_table_participant" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "tableId" integer NOT NULL, "userId" integer NOT NULL, "status" varchar NOT NULL DEFAULT ('joined'), "currentBet" integer NOT NULL DEFAULT (0), "joinedAt" datetime NOT NULL DEFAULT (datetime('now')), "handState" text)`);
        await queryRunner.query(`INSERT INTO "temporary_game_table_participant"("id", "tableId", "userId", "status", "currentBet", "joinedAt", "handState") SELECT "id", "tableId", "userId", "status", "currentBet", "joinedAt", "handState" FROM "game_table_participant"`);
        await queryRunner.query(`DROP TABLE "game_table_participant"`);
        await queryRunner.query(`ALTER TABLE "temporary_game_table_participant" RENAME TO "game_table_participant"`);
        await queryRunner.query(`CREATE TABLE "temporary_credit_transaction" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "userId" integer NOT NULL, "amount" integer NOT NULL, "type" varchar NOT NULL, "description" varchar, "timestamp" datetime NOT NULL DEFAULT (datetime('now')), "balanceAfter" integer NOT NULL, CONSTRAINT "FK_735b0e9a9ac973240dc55114c38" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_credit_transaction"("id", "userId", "amount", "type", "description", "timestamp", "balanceAfter") SELECT "id", "userId", "amount", "type", "description", "timestamp", "balanceAfter" FROM "credit_transaction"`);
        await queryRunner.query(`DROP TABLE "credit_transaction"`);
        await queryRunner.query(`ALTER TABLE "temporary_credit_transaction" RENAME TO "credit_transaction"`);
        await queryRunner.query(`CREATE TABLE "temporary_game_table" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "gameType" varchar NOT NULL, "name" varchar NOT NULL, "status" varchar NOT NULL DEFAULT ('waiting'), "maxPlayers" integer NOT NULL DEFAULT (4), "minBet" integer NOT NULL DEFAULT (10), "maxBet" integer NOT NULL DEFAULT (1000), "createdById" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "gameState" text, "dealerId" integer, CONSTRAINT "FK_634a3a97b2318e9c0d94929c5b9" FOREIGN KEY ("createdById") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_d004ac98500b9125ddc784f132b" FOREIGN KEY ("dealerId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_game_table"("id", "gameType", "name", "status", "maxPlayers", "minBet", "maxBet", "createdById", "createdAt", "gameState", "dealerId") SELECT "id", "gameType", "name", "status", "maxPlayers", "minBet", "maxBet", "createdById", "createdAt", "gameState", "dealerId" FROM "game_table"`);
        await queryRunner.query(`DROP TABLE "game_table"`);
        await queryRunner.query(`ALTER TABLE "temporary_game_table" RENAME TO "game_table"`);
        await queryRunner.query(`CREATE TABLE "temporary_game_table_participant" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "tableId" integer NOT NULL, "userId" integer NOT NULL, "status" varchar NOT NULL DEFAULT ('joined'), "currentBet" integer NOT NULL DEFAULT (0), "joinedAt" datetime NOT NULL DEFAULT (datetime('now')), "handState" text, CONSTRAINT "FK_07666d2c2c3bb1294093f5061d7" FOREIGN KEY ("tableId") REFERENCES "game_table" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_b958b7967fbe99cf58654cee0d9" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_game_table_participant"("id", "tableId", "userId", "status", "currentBet", "joinedAt", "handState") SELECT "id", "tableId", "userId", "status", "currentBet", "joinedAt", "handState" FROM "game_table_participant"`);
        await queryRunner.query(`DROP TABLE "game_table_participant"`);
        await queryRunner.query(`ALTER TABLE "temporary_game_table_participant" RENAME TO "game_table_participant"`);
        await queryRunner.query(`CREATE TABLE "temporary_game_invite" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "tableId" integer NOT NULL, "userId" integer NOT NULL, "fromUserId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_4629f20fa5bc7ddab6747cc0919" FOREIGN KEY ("tableId") REFERENCES "game_table" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_c0f476eff6a8d02472356ed38b3" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION, CONSTRAINT "FK_0a814b75a88eac880411f215850" FOREIGN KEY ("fromUserId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_game_invite"("id", "tableId", "userId", "fromUserId", "createdAt") SELECT "id", "tableId", "userId", "fromUserId", "createdAt" FROM "game_invite"`);
        await queryRunner.query(`DROP TABLE "game_invite"`);
        await queryRunner.query(`ALTER TABLE "temporary_game_invite" RENAME TO "game_invite"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game_invite" RENAME TO "temporary_game_invite"`);
        await queryRunner.query(`CREATE TABLE "game_invite" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "tableId" integer NOT NULL, "userId" integer NOT NULL, "fromUserId" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "game_invite"("id", "tableId", "userId", "fromUserId", "createdAt") SELECT "id", "tableId", "userId", "fromUserId", "createdAt" FROM "temporary_game_invite"`);
        await queryRunner.query(`DROP TABLE "temporary_game_invite"`);
        await queryRunner.query(`ALTER TABLE "game_table_participant" RENAME TO "temporary_game_table_participant"`);
        await queryRunner.query(`CREATE TABLE "game_table_participant" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "tableId" integer NOT NULL, "userId" integer NOT NULL, "status" varchar NOT NULL DEFAULT ('joined'), "currentBet" integer NOT NULL DEFAULT (0), "joinedAt" datetime NOT NULL DEFAULT (datetime('now')), "handState" text)`);
        await queryRunner.query(`INSERT INTO "game_table_participant"("id", "tableId", "userId", "status", "currentBet", "joinedAt", "handState") SELECT "id", "tableId", "userId", "status", "currentBet", "joinedAt", "handState" FROM "temporary_game_table_participant"`);
        await queryRunner.query(`DROP TABLE "temporary_game_table_participant"`);
        await queryRunner.query(`ALTER TABLE "game_table" RENAME TO "temporary_game_table"`);
        await queryRunner.query(`CREATE TABLE "game_table" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "gameType" varchar NOT NULL, "name" varchar NOT NULL, "status" varchar NOT NULL DEFAULT ('waiting'), "maxPlayers" integer NOT NULL DEFAULT (4), "minBet" integer NOT NULL DEFAULT (10), "maxBet" integer NOT NULL DEFAULT (1000), "createdById" integer NOT NULL, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "gameState" text, "dealerId" integer)`);
        await queryRunner.query(`INSERT INTO "game_table"("id", "gameType", "name", "status", "maxPlayers", "minBet", "maxBet", "createdById", "createdAt", "gameState", "dealerId") SELECT "id", "gameType", "name", "status", "maxPlayers", "minBet", "maxBet", "createdById", "createdAt", "gameState", "dealerId" FROM "temporary_game_table"`);
        await queryRunner.query(`DROP TABLE "temporary_game_table"`);
        await queryRunner.query(`ALTER TABLE "credit_transaction" RENAME TO "temporary_credit_transaction"`);
        await queryRunner.query(`CREATE TABLE "credit_transaction" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "userId" integer NOT NULL, "amount" integer NOT NULL, "type" varchar NOT NULL, "description" varchar, "timestamp" datetime NOT NULL DEFAULT (datetime('now')), "balanceAfter" integer NOT NULL)`);
        await queryRunner.query(`INSERT INTO "credit_transaction"("id", "userId", "amount", "type", "description", "timestamp", "balanceAfter") SELECT "id", "userId", "amount", "type", "description", "timestamp", "balanceAfter" FROM "temporary_credit_transaction"`);
        await queryRunner.query(`DROP TABLE "temporary_credit_transaction"`);
        await queryRunner.query(`ALTER TABLE "game_table_participant" RENAME TO "temporary_game_table_participant"`);
        await queryRunner.query(`CREATE TABLE "game_table_participant" ("id" integer PRIMARY KEY, "tableId" integer, "userId" integer, "status" varchar DEFAULT ('joined'), "currentBet" integer DEFAULT (0), "joinedAt" datetime DEFAULT (CURRENT_TIMESTAMP), "handState" text)`);
        await queryRunner.query(`INSERT INTO "game_table_participant"("id", "tableId", "userId", "status", "currentBet", "joinedAt", "handState") SELECT "id", "tableId", "userId", "status", "currentBet", "joinedAt", "handState" FROM "temporary_game_table_participant"`);
        await queryRunner.query(`DROP TABLE "temporary_game_table_participant"`);
        await queryRunner.query(`ALTER TABLE "game_table" RENAME TO "temporary_game_table"`);
        await queryRunner.query(`CREATE TABLE "game_table" ("id" integer PRIMARY KEY, "gameType" varchar, "name" varchar, "status" varchar DEFAULT ('waiting'), "maxPlayers" integer DEFAULT (4), "minBet" integer DEFAULT (10), "maxBet" integer DEFAULT (1000), "createdById" integer, "createdAt" datetime DEFAULT (CURRENT_TIMESTAMP), "gameState" text, "dealerId" integer)`);
        await queryRunner.query(`INSERT INTO "game_table"("id", "gameType", "name", "status", "maxPlayers", "minBet", "maxBet", "createdById", "createdAt", "gameState", "dealerId") SELECT "id", "gameType", "name", "status", "maxPlayers", "minBet", "maxBet", "createdById", "createdAt", "gameState", "dealerId" FROM "temporary_game_table"`);
        await queryRunner.query(`DROP TABLE "temporary_game_table"`);
        await queryRunner.query(`ALTER TABLE "credit_transaction" RENAME TO "temporary_credit_transaction"`);
        await queryRunner.query(`CREATE TABLE "credit_transaction" ("id" integer PRIMARY KEY, "userId" integer, "amount" integer, "type" varchar, "description" varchar, "timestamp" datetime DEFAULT (CURRENT_TIMESTAMP), "balanceAfter" integer)`);
        await queryRunner.query(`INSERT INTO "credit_transaction"("id", "userId", "amount", "type", "description", "timestamp", "balanceAfter") SELECT "id", "userId", "amount", "type", "description", "timestamp", "balanceAfter" FROM "temporary_credit_transaction"`);
        await queryRunner.query(`DROP TABLE "temporary_credit_transaction"`);
        await queryRunner.query(`ALTER TABLE "user" RENAME TO "temporary_user"`);
        await queryRunner.query(`CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "username" varchar NOT NULL, "avatarUrl" varchar, "password" varchar NOT NULL, "role" varchar NOT NULL DEFAULT ('member'), "name" varchar, "isActive" boolean NOT NULL DEFAULT (1), "tokenA" varchar, "selectedFrame" varchar, "credit" integer DEFAULT (1000), "selectedShiftMa" varchar)`);
        await queryRunner.query(`INSERT INTO "user"("id", "username", "avatarUrl", "password", "role", "name", "isActive", "tokenA", "selectedFrame", "credit", "selectedShiftMa") SELECT "id", "username", "avatarUrl", "password", "role", "name", "isActive", "tokenA", "selectedFrame", "credit", "selectedShiftMa" FROM "temporary_user"`);
        await queryRunner.query(`DROP TABLE "temporary_user"`);
        await queryRunner.query(`DROP TABLE "game_invite"`);
        await queryRunner.query(`ALTER TABLE "user" RENAME TO "temporary_user"`);
        await queryRunner.query(`CREATE TABLE "user" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "username" varchar NOT NULL, "avatarUrl" varchar, "password" varchar NOT NULL, "role" varchar NOT NULL DEFAULT ('member'), "name" varchar, "isActive" boolean NOT NULL DEFAULT (1), "tokenA" varchar, "selectedFrame" varchar, "credit" integer DEFAULT (1000), "selectedShiftMa" varchar)`);
        await queryRunner.query(`INSERT INTO "user"("id", "username", "avatarUrl", "password", "role", "name", "isActive", "tokenA", "selectedFrame", "credit", "selectedShiftMa") SELECT "id", "username", "avatarUrl", "password", "role", "name", "isActive", "tokenA", "selectedFrame", "credit", "selectedShiftMa" FROM "temporary_user"`);
        await queryRunner.query(`DROP TABLE "temporary_user"`);
    }

}
