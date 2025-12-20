import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("auto_checkin_log")
export class AutoCheckInLog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column()
    username: string;

    @Column()
    action: string; // "CHECK_IN" | "CHECK_OUT"

    @Column()
    shiftCode: string;

    @Column()
    shiftName: string;

    @Column()
    scheduledTime: string; // HH:mm format

    @Column()
    actualTime: string; // Actual execution time with offset

    @Column()
    status: string; // "SUCCESS" | "FAILED"

    @Column({ nullable: true, type: "text" })
    response: string; // JSON response from HRM API

    @CreateDateColumn()
    createdAt: Date;
}
