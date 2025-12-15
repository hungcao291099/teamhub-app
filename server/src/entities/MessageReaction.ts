import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Message } from "./Message";
import { User } from "./User";

@Entity("message_reactions")
export class MessageReaction {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    messageId: number;

    @Column()
    userId: number;

    @Column()
    emoji: string; // e.g., "👍", "❤️", "😂", "😮", "😢", "🙏"

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => Message, message => message.reactions)
    @JoinColumn({ name: "messageId" })
    message: Message;

    @ManyToOne(() => User)
    @JoinColumn({ name: "userId" })
    user: User;
}
