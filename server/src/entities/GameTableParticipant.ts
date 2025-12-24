import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm"
import { User } from "./User"
import { GameTable } from "./GameTable"

@Entity("game_table_participant")
export class GameTableParticipant {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    tableId: number

    @ManyToOne(() => GameTable)
    @JoinColumn({ name: "tableId" })
    table: GameTable

    @Column()
    userId: number

    @ManyToOne(() => User)
    @JoinColumn({ name: "userId" })
    user: User

    @Column({ default: "joined" })
    status: string // "pending" | "joined" | "left" | "playing"

    @Column({ type: "integer", default: 0 })
    currentBet: number

    @CreateDateColumn()
    joinedAt: Date

    // Player's hand stored as JSON string for card games
    @Column({ type: "text", nullable: true })
    handState: string
}
