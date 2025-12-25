import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm"
import { User } from "./User"
import { GameTable } from "./GameTable"

@Entity("game_invite")
export class GameInvite {
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

    @Column()
    fromUserId: number

    @ManyToOne(() => User)
    @JoinColumn({ name: "fromUserId" })
    fromUser: User

    @CreateDateColumn()
    createdAt: Date
}
