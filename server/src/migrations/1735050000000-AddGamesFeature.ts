import { MigrationInterface, QueryRunner, Table, TableColumn } from "typeorm"

export class AddGamesFeature1735050000000 implements MigrationInterface {
    name = 'AddGamesFeature1735050000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if credit column exists before adding
        const userTable = await queryRunner.getTable("user")
        const hasCredit = userTable?.columns.find(c => c.name === "credit")

        if (!hasCredit) {
            await queryRunner.addColumn("user", new TableColumn({
                name: "credit",
                type: "integer",
                default: 1000
            }))
        }

        // Create credit_transaction table if not exists
        const hasCreditTransaction = await queryRunner.hasTable("credit_transaction")
        if (!hasCreditTransaction) {
            await queryRunner.createTable(new Table({
                name: "credit_transaction",
                columns: [
                    {
                        name: "id",
                        type: "integer",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    {
                        name: "userId",
                        type: "integer"
                    },
                    {
                        name: "amount",
                        type: "integer"
                    },
                    {
                        name: "type",
                        type: "varchar"
                    },
                    {
                        name: "description",
                        type: "varchar",
                        isNullable: true
                    },
                    {
                        name: "timestamp",
                        type: "datetime",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "balanceAfter",
                        type: "integer"
                    }
                ]
            }), true)
        }

        // Create game_table table if not exists
        const hasGameTable = await queryRunner.hasTable("game_table")
        if (!hasGameTable) {
            await queryRunner.createTable(new Table({
                name: "game_table",
                columns: [
                    {
                        name: "id",
                        type: "integer",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    {
                        name: "gameType",
                        type: "varchar"
                    },
                    {
                        name: "name",
                        type: "varchar"
                    },
                    {
                        name: "status",
                        type: "varchar",
                        default: "'waiting'"
                    },
                    {
                        name: "maxPlayers",
                        type: "integer",
                        default: 4
                    },
                    {
                        name: "minBet",
                        type: "integer",
                        default: 10
                    },
                    {
                        name: "maxBet",
                        type: "integer",
                        default: 1000
                    },
                    {
                        name: "createdById",
                        type: "integer"
                    },
                    {
                        name: "createdAt",
                        type: "datetime",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "gameState",
                        type: "text",
                        isNullable: true
                    }
                ]
            }), true)
        }

        // Create game_table_participant table if not exists
        const hasParticipant = await queryRunner.hasTable("game_table_participant")
        if (!hasParticipant) {
            await queryRunner.createTable(new Table({
                name: "game_table_participant",
                columns: [
                    {
                        name: "id",
                        type: "integer",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment"
                    },
                    {
                        name: "tableId",
                        type: "integer"
                    },
                    {
                        name: "userId",
                        type: "integer"
                    },
                    {
                        name: "status",
                        type: "varchar",
                        default: "'joined'"
                    },
                    {
                        name: "currentBet",
                        type: "integer",
                        default: 0
                    },
                    {
                        name: "joinedAt",
                        type: "datetime",
                        default: "CURRENT_TIMESTAMP"
                    },
                    {
                        name: "handState",
                        type: "text",
                        isNullable: true
                    }
                ]
            }), true)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("game_table_participant", true)
        await queryRunner.dropTable("game_table", true)
        await queryRunner.dropTable("credit_transaction", true)

        const userTable = await queryRunner.getTable("user")
        if (userTable?.columns.find(c => c.name === "credit")) {
            await queryRunner.dropColumn("user", "credit")
        }
    }
}
