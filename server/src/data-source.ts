import { DataSource } from "typeorm"
import * as path from "path"
import { User } from "./entities/User"
import { Conversation } from "./entities/Conversation"
import { ConversationParticipant } from "./entities/ConversationParticipant"
import { Message } from "./entities/Message"
import { MessageReaction } from "./entities/MessageReaction"
import { Event } from "./entities/Event"
import { DutyRotation } from "./entities/DutyRotation"
import { FundTransaction } from "./entities/FundTransaction"
import { GlobalSetting } from "./entities/GlobalSetting"
import { AutoCheckInLog } from "./entities/AutoCheckInLog"
import { CreditTransaction } from "./entities/CreditTransaction"
import { GameTable } from "./entities/GameTable"
import { GameTableParticipant } from "./entities/GameTableParticipant"

// Import migrations
import { InitialSchema1765611148994 } from "./migrations/1765611148994-InitialSchema"
import { AddChatEntities1765806531742 } from "./migrations/1765806531742-AddChatEntities"
import { AddRoleToConversationParticipant1765877312504 } from "./migrations/1765877312504-AddRoleToConversationParticipant"
import { AddTokenAToUser1734681078000 } from "./migrations/1734681078000-AddTokenAToUser"
import { AddAutoCheckInLog1734681200000 } from "./migrations/1734681200000-AddAutoCheckInLog"
import { AddSelectedFrameToUser1735004000000 } from "./migrations/1735004000000-AddSelectedFrameToUser"
import { AddConversationAvatar1766219051705 } from "./migrations/1766219051705-AddConversationAvatar"
import { AddGamesFeature1735050000000 } from "./migrations/1735050000000-AddGamesFeature"

// Use absolute path to ensure same database in dev and prod
const dbPath = path.resolve(__dirname, "../database.sqlite");

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: dbPath,
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
        GlobalSetting,
        AutoCheckInLog,
        CreditTransaction,
        GameTable,
        GameTableParticipant
    ],
    migrations: [
        InitialSchema1765611148994,
        AddChatEntities1765806531742,
        AddRoleToConversationParticipant1765877312504,
        AddTokenAToUser1734681078000,
        AddAutoCheckInLog1734681200000,
        AddSelectedFrameToUser1735004000000,
        AddConversationAvatar1766219051705,
        AddGamesFeature1735050000000
    ],
    subscribers: [],
})

