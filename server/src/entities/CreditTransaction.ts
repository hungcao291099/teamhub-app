import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm"
import { User } from "./User"

@Entity("credit_transaction")
export class CreditTransaction {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    userId: number

    @ManyToOne(() => User)
    @JoinColumn({ name: "userId" })
    user: User

    @Column("integer")
    amount: number

    @Column()
    type: string // "deposit" | "win" | "lose" | "bet" | "cheat"

    @Column({ nullable: true })
    description: string

    @CreateDateColumn()
    timestamp: Date

    @Column("integer")
    balanceAfter: number
}
