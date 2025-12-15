import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm"

@Entity("fund_transaction")
export class FundTransaction {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    type: string // "thu" | "chi"

    @Column("decimal", { precision: 10, scale: 2 })
    amount: number

    @Column()
    description: string

    @CreateDateColumn()
    timestamp: Date

    @Column("decimal", { precision: 10, scale: 2 })
    balanceAfter: number
}
