import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Conversation } from "./Conversation";
import { User } from "./User";
import { MessageReaction } from "./MessageReaction";

@Entity("messages")
export class Message {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    conversationId: number;

    @Column()
    senderId: number;

    @Column("text")
    content: string; // Encrypted content

    @Column({ default: "text" })
    type: "text" | "image" | "file";

    @Column({ nullable: true })
    fileUrl: string | null; // For images/files

    @Column({ nullable: true })
    fileName: string | null;

    @Column({ nullable: true })
    replyToId: number | null; // For reply feature

    @Column({ default: false })
    isEdited: boolean;

    @Column({ default: false })
    isDeleted: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ nullable: true })
    deletedAt: Date | null;

    @ManyToOne(() => Conversation, conversation => conversation.messages)
    @JoinColumn({ name: "conversationId" })
    conversation: Conversation;

    @ManyToOne(() => User)
    @JoinColumn({ name: "senderId" })
    sender: User;

    @ManyToOne(() => Message, { nullable: true })
    @JoinColumn({ name: "replyToId" })
    replyTo: Message | null;

    @OneToMany(() => MessageReaction, reaction => reaction.message)
    reactions: MessageReaction[];
}
