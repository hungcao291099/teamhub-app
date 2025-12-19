import { DataSource } from "typeorm"
import { User } from "./entities/User"
import { Conversation } from "./entities/Conversation"
import { ConversationParticipant } from "./entities/ConversationParticipant"
import { Message } from "./entities/Message"
import { MessageReaction } from "./entities/MessageReaction"
import { Event } from "./entities/Event"
import { DutyRotation } from "./entities/DutyRotation"
import { FundTransaction } from "./entities/FundTransaction"
import { GlobalSetting } from "./entities/GlobalSetting"

// Import migrations
import { InitialSchema1765611148994 } from "./migrations/1765611148994-InitialSchema"
import { AddChatEntities1765806531742 } from "./migrations/1765806531742-AddChatEntities"
import { AddRoleToConversationParticipant1765877312504 } from "./migrations/1765877312504-AddRoleToConversationParticipant"

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "database.sqlite",
    synchronize: false, // Auto create database schema. Don't use in production!
    logging: false,
    entities: [
        User,
        Conversation,
        ConversationParticipant,
        Message,
        MessageReaction,
        Event,
        DutyRotation,
        FundTransaction,
        GlobalSetting
    ],
    migrations: [
        InitialSchema1765611148994,
        AddChatEntities1765806531742,
        AddRoleToConversationParticipant1765877312504
    ],
    subscribers: [],
})
