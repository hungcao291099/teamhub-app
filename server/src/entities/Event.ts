import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm"

@Entity("event")
export class Event {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column({ nullable: true })
    description: string

    @Column()
    eventTimestamp: Date

    @CreateDateColumn()
    createdAt: Date

    @Column({ nullable: true })
    location: string

    // Store creator info if needed, or link to User
    @Column({ nullable: true })
    createdBy: string
}
