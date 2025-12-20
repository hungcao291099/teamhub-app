import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Message } from "./Message";
import { ConversationParticipant } from "./ConversationParticipant";

@Entity("conversations")
export class Conversation {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    name: string | null; // null for 1-1 chats, name for group chats

    @Column({ default: "direct" })
    type: "direct" | "group";

    @Column({ nullable: true })
    lastMessageId: number | null;

    @Column({ nullable: true })
    avatarUrl: string | null; // Avatar for group chats

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Message, message => message.conversation)
    messages: Message[];

    @OneToMany(() => ConversationParticipant, participant => participant.conversation)
    participants: ConversationParticipant[];
}
