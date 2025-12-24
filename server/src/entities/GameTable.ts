import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm"
import { User } from "./User"

@Entity("game_table")
export class GameTable {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    gameType: string // "blackjack" | "counter"

    @Column()
    name: string

    @Column({ default: "waiting" })
    status: string // "waiting" | "playing" | "finished"

    @Column({ type: "integer", default: 4 })
    maxPlayers: number

    @Column({ type: "integer", default: 10 })
    minBet: number

    @Column({ type: "integer", default: 1000 })
    maxBet: number

    @Column()
    createdById: number

    @ManyToOne(() => User)
    @JoinColumn({ name: "createdById" })
    createdBy: User

    @CreateDateColumn()
    createdAt: Date

    // Game state stored as JSON string
    @Column({ type: "text", nullable: true })
    gameState: string
}
