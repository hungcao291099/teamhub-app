import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity("user")
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    username: string

    @Column({ nullable: true })
    avatarUrl: string

    @Column()
    password: string

    @Column({ default: "member" })
    role: string

    @Column({ nullable: true })
    name: string

    @Column({ default: true })
    isActive: boolean

    @Column({ nullable: true })
    tokenA: string

    @Column({ nullable: true })
    selectedFrame: string
}
