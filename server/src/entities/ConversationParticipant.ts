import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Conversation } from "./Conversation";
import { User } from "./User";

@Entity("conversation_participants")
export class ConversationParticipant {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    conversationId: number;

    @Column()
    userId: number;

    @Column({ nullable: true })
    lastReadMessageId: number | null;

    @Column({ nullable: true })
    lastReadAt: Date | null;

    @Column({ default: true })
    notificationsEnabled: boolean;

    @Column({ default: "member" })
    role: "owner" | "admin" | "member";

    @CreateDateColumn()
    joinedAt: Date;

    @ManyToOne(() => Conversation, conversation => conversation.participants)
    @JoinColumn({ name: "conversationId" })
    conversation: Conversation;

    @ManyToOne(() => User)
    @JoinColumn({ name: "userId" })
    user: User;
}
