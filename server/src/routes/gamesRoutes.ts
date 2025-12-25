import { Router, Response } from "express"
import { AppDataSource } from "../data-source"
import { User } from "../entities/User"
import { CreditTransaction } from "../entities/CreditTransaction"
import { GameTable } from "../entities/GameTable"
import { GameTableParticipant } from "../entities/GameTableParticipant"
import { getIO, emitToEachGameUser } from "../socket"
import { checkJwt } from "../middlewares/checkJwt"

const router = Router()

// Apply JWT check to all routes
router.use(checkJwt)

// Helper to get user from JWT payload (stored in res.locals by checkJwt)
const getUserFromResponse = async (res: Response): Promise<User | null> => {
    const userId = res.locals.jwtPayload?.userId
    if (!userId) return null
    const userRepo = AppDataSource.getRepository(User)
    return await userRepo.findOne({ where: { id: userId } })
}

// GET /games/credits - Get current user's credit
router.get("/credits", async (req: any, res) => {
    try {
        const user = await getUserFromResponse(res)
        if (!user) return res.status(401).json({ error: "Unauthorized" })

        res.json({ credit: user.credit || 0 })
    } catch (error) {
        console.error("Error getting credits:", error)
        res.status(500).json({ error: "Internal server error" })
    }
})

// GET /games/active-table - Check if user is in an active table
router.get("/active-table", async (req: any, res) => {
    try {
        const user = await getUserFromResponse(res)
        if (!user) return res.status(401).json({ error: "Unauthorized" })

        const participantRepo = AppDataSource.getRepository(GameTableParticipant)
        const tableRepo = AppDataSource.getRepository(GameTable)

        // Find active participation
        const activeParticipant = await participantRepo.findOne({
            where: { userId: user.id, status: "joined" }
        })

        if (!activeParticipant) {
            return res.json({ hasActiveTable: false })
        }

        // Get table info
        const table = await tableRepo.findOne({
            where: { id: activeParticipant.tableId }
        })

        if (!table || table.status === "finished") {
            return res.json({ hasActiveTable: false })
        }

        res.json({
            hasActiveTable: true,
            tableId: table.id,
            gameType: table.gameType,
            tableName: table.name
        })
    } catch (error) {
        console.error("Error checking active table:", error)
        res.status(500).json({ error: "Internal server error" })
    }
})

// GET /games/credits/history - Get credit transaction history
router.get("/credits/history", async (req: any, res) => {
    try {
        const user = await getUserFromResponse(res)
        if (!user) return res.status(401).json({ error: "Unauthorized" })

        const transactionRepo = AppDataSource.getRepository(CreditTransaction)
        const history = await transactionRepo.find({
            where: { userId: user.id },
            order: { timestamp: "DESC" },
            take: 50
        })

        res.json(history)
    } catch (error) {
        console.error("Error getting credit history:", error)
        res.status(500).json({ error: "Internal server error" })
    }
})

// POST /games/credits/cheat - Cheatcode endpoint
router.post("/credits/cheat", async (req: any, res) => {
    try {
        const user = await getUserFromResponse(res)
        if (!user) return res.status(401).json({ error: "Unauthorized" })

        const userRepo = AppDataSource.getRepository(User)
        const transactionRepo = AppDataSource.getRepository(CreditTransaction)

        const cheatAmount = 1000
        const newBalance = (user.credit || 0) + cheatAmount

        // Update user credit
        user.credit = newBalance
        await userRepo.save(user)

        // Log transaction
        const transaction = transactionRepo.create({
            userId: user.id,
            amount: cheatAmount,
            type: "cheat",
            description: "Cheatcode: givememoney",
            balanceAfter: newBalance
        })
        await transactionRepo.save(transaction)

        // Emit socket event for realtime update
        try {
            const io = getIO()
            io.emit("games:credit_update", { userId: user.id, credit: newBalance })
        } catch (e) {
            // Socket might not be initialized
        }

        res.json({ credit: newBalance, added: cheatAmount })
    } catch (error) {
        console.error("Error applying cheat:", error)
        res.status(500).json({ error: "Internal server error" })
    }
})

// GET /games/tables/:gameType - Get tables for a game type
router.get("/tables/:gameType", async (req: any, res) => {
    try {
        const { gameType } = req.params
        const tableRepo = AppDataSource.getRepository(GameTable)
        const participantRepo = AppDataSource.getRepository(GameTableParticipant)

        const tables = await tableRepo.find({
            where: { gameType, status: "waiting" },
            relations: ["createdBy"],
            order: { createdAt: "DESC" }
        })

        // Get participant count and invitation status for each table
        const tablesWithCounts = await Promise.all(tables.map(async (table) => {
            const count = await participantRepo.count({
                where: { tableId: table.id, status: "joined" }
            })

            const user = await getUserFromResponse(res)
            return {
                ...table,
                playerCount: count,
                createdBy: table.createdBy ? {
                    id: table.createdBy.id,
                    username: table.createdBy.username,
                    name: table.createdBy.name,
                    avatarUrl: table.createdBy.avatarUrl
                } : null
            }
        }))

        res.json(tablesWithCounts)
    } catch (error) {
        console.error("Error getting tables:", error)
        res.status(500).json({ error: "Internal server error" })
    }
})

// GET /games/tables/:gameType/:tableId - Get single table with details
router.get("/tables/:gameType/:tableId", async (req: any, res) => {
    try {
        const user = await getUserFromResponse(res)
        if (!user) return res.status(401).json({ error: "Unauthorized" })

        const { tableId } = req.params
        const tableIdNum = parseInt(tableId)

        // Validate tableId
        if (isNaN(tableIdNum) || tableIdNum <= 0) {
            return res.status(400).json({ error: "Invalid tableId" })
        }

        const tableRepo = AppDataSource.getRepository(GameTable)
        const participantRepo = AppDataSource.getRepository(GameTableParticipant)

        const table = await tableRepo.findOne({
            where: { id: tableIdNum },
            relations: ["createdBy"]
        })

        if (!table) {
            return res.status(404).json({ error: "Table not found" })
        }

        const participants = await participantRepo.find({
            where: { tableId: table.id },
            relations: ["user"]
        })

        // Parse game state and filter for current user
        let safeGameState: any = null
        if (table.gameState) {
            try {
                const fullState = JSON.parse(table.gameState)
                const isFinished = table.status === "finished"
                // Filter state: remove deck, mask other players' cards
                safeGameState = blackjack.filterStateForUser(fullState, user.id, isFinished)
            } catch (e) {
                safeGameState = null
            }
        }

        // Filter participant hands per user
        const filteredParticipants = participants.map(p => {
            let filteredHand: any = null
            if (p.handState) {
                try {
                    const hand = JSON.parse(p.handState)
                    const isFinished = table.status === "finished"
                    // User sees their own full hand, others are masked
                    if (p.userId === user.id || isFinished) {
                        filteredHand = hand
                    } else {
                        filteredHand = blackjack.maskHand(hand)
                    }
                } catch (e) {
                    filteredHand = null
                }
            }

            return {
                id: p.id,
                userId: p.userId,
                status: p.status,
                currentBet: p.currentBet,
                handState: filteredHand ? JSON.stringify(filteredHand) : null,
                user: p.user ? {
                    id: p.user.id,
                    username: p.user.username,
                    name: p.user.name,
                    avatarUrl: p.user.avatarUrl
                } : null
            }
        })

        // Return table without exposing deck
        const { gameState: _, ...tableWithoutGameState } = table as any
        res.json({
            ...tableWithoutGameState,
            gameState: safeGameState ? JSON.stringify(safeGameState) : null,
            participants: filteredParticipants
        })
    } catch (error) {
        console.error("Error getting table:", error)
        res.status(500).json({ error: "Internal server error" })
    }
})

// POST /games/tables - Create a new table
router.post("/tables", async (req: any, res) => {
    try {
        const user = await getUserFromResponse(res)
        if (!user) return res.status(401).json({ error: "Unauthorized" })

        const { gameType, name, minBet = 10, maxBet = 1000 } = req.body

        if (!gameType || !name) {
            return res.status(400).json({ error: "gameType and name are required" })
        }

        const tableRepo = AppDataSource.getRepository(GameTable)
        const participantRepo = AppDataSource.getRepository(GameTableParticipant)

        // Create table
        const table = tableRepo.create({
            gameType,
            name,
            minBet,
            maxBet,
            createdById: user.id,
            dealerId: user.id, // Room owner is default dealer
            status: "waiting"
        })
        await tableRepo.save(table)

        // Auto-join creator
        const participant = participantRepo.create({
            tableId: table.id,
            userId: user.id,
            status: "joined"
        })
        await participantRepo.save(participant)

        // Emit socket event
        try {
            const io = getIO()
            io.emit("games:table_created", { gameType, table })
        } catch (e) { }

        res.json({ ...table, playerCount: 1 })
    } catch (error) {
        console.error("Error creating table:", error)
        res.status(500).json({ error: "Internal server error" })
    }
})

// POST /games/tables/:tableId/join - Join a table
router.post("/tables/:tableId/join", async (req: any, res) => {
    try {
        const user = await getUserFromResponse(res)
        if (!user) return res.status(401).json({ error: "Unauthorized" })

        const { tableId } = req.params
        const tableRepo = AppDataSource.getRepository(GameTable)
        const participantRepo = AppDataSource.getRepository(GameTableParticipant)

        const table = await tableRepo.findOne({ where: { id: parseInt(tableId) } })
        if (!table) {
            return res.status(404).json({ error: "Table not found" })
        }

        if (table.status !== "waiting") {
            return res.status(400).json({ error: "Table is not accepting players" })
        }

        // Check if already joined

        // Check if already joined
        const existing = await participantRepo.findOne({
            where: { tableId: table.id, userId: user.id }
        })

        if (existing) {
            if (existing.status === "joined") {
                // Already joined - return success with flag so frontend can navigate
                return res.json({ success: true, alreadyJoined: true })
            }
            existing.status = "joined"
            await participantRepo.save(existing)
        } else {
            // Check max players
            const count = await participantRepo.count({
                where: { tableId: table.id, status: "joined" }
            })

            if (count >= table.maxPlayers) {
                return res.status(400).json({ error: "Table is full" })
            }

            const participant = participantRepo.create({
                tableId: table.id,
                userId: user.id,
                status: "joined"
            })
            await participantRepo.save(participant)
        }

        // Emit socket event
        try {
            const io = getIO()
            io.emit("games:player_joined", {
                tableId: table.id,
                userId: user.id,
                user: { id: user.id, username: user.username, name: user.name, avatarUrl: user.avatarUrl }
            })
        } catch (e) { }

        res.json({ success: true })
    } catch (error) {
        console.error("Error joining table:", error)
        res.status(500).json({ error: "Internal server error" })
    }
})

// POST /games/tables/:tableId/leave - Leave a table (owner dissolves room)
router.post("/tables/:tableId/leave", async (req: any, res) => {
    try {
        const user = await getUserFromResponse(res)
        if (!user) return res.status(401).json({ error: "Unauthorized" })

        const { tableId } = req.params
        const tableIdNum = parseInt(tableId)

        if (isNaN(tableIdNum) || tableIdNum <= 0) {
            return res.status(400).json({ error: "Invalid tableId" })
        }

        const participantRepo = AppDataSource.getRepository(GameTableParticipant)
        const tableRepo = AppDataSource.getRepository(GameTable)

        const table = await tableRepo.findOne({ where: { id: tableIdNum } })
        if (!table) {
            return res.status(404).json({ error: "Table not found" })
        }

        const participant = await participantRepo.findOne({
            where: { tableId: tableIdNum, userId: user.id }
        })

        if (!participant) {
            return res.status(404).json({ error: "Not in this table" })
        }

        const isOwner = table.createdById === user.id

        // If owner leaves, dissolve entire room
        if (isOwner) {
            // Delete all participants and table
            await participantRepo.delete({ tableId: tableIdNum })
            await tableRepo.delete({ id: tableIdNum })

            // Emit socket event for room dissolved
            try {
                const io = getIO()
                io.emit("games:room_dissolved", { tableId: tableIdNum, reason: "Chủ phòng đã giải tán bàn" })
            } catch (e) { }

            return res.json({ success: true, dissolved: true })
        }

        // Regular member leaves
        participant.status = "left"
        await participantRepo.save(participant)

        // Check remaining players
        const remainingCount = await participantRepo.count({
            where: { tableId: tableIdNum, status: "joined" }
        })

        // Auto-delete table if no players left
        if (remainingCount === 0) {
            await participantRepo.delete({ tableId: tableIdNum })
            await tableRepo.delete({ id: tableIdNum })

            try {
                const io = getIO()
                io.emit("games:table_deleted", { tableId: tableIdNum })
            } catch (e) { }
        } else {
            try {
                const io = getIO()
                io.emit("games:player_left", { tableId: tableIdNum, userId: user.id })
            } catch (e) { }
        }

        res.json({ success: true, tableDeleted: remainingCount === 0 })
    } catch (error) {
        console.error("Error leaving table:", error)
        res.status(500).json({ error: "Internal server error" })
    }
})

// POST /games/tables/:tableId/play-again - Reset table for new round (owner only)
router.post("/tables/:tableId/play-again", async (req: any, res) => {
    try {
        const user = await getUserFromResponse(res)
        if (!user) return res.status(401).json({ error: "Unauthorized" })

        const { tableId } = req.params
        const tableIdNum = parseInt(tableId)

        if (isNaN(tableIdNum) || tableIdNum <= 0) {
            return res.status(400).json({ error: "Invalid tableId" })
        }

        const tableRepo = AppDataSource.getRepository(GameTable)
        const participantRepo = AppDataSource.getRepository(GameTableParticipant)

        const table = await tableRepo.findOne({ where: { id: tableIdNum } })
        if (!table) {
            return res.status(404).json({ error: "Table not found" })
        }

        if (table.createdById !== user.id) {
            return res.status(403).json({ error: "Chỉ chủ phòng mới được bắt đầu lại" })
        }

        if (table.status !== "finished") {
            return res.status(400).json({ error: "Ván chưa kết thúc" })
        }

        // Reset table state
        table.status = "waiting"
        table.gameState = ""
        await tableRepo.save(table)

        // Reset all participants' bets and hands
        await participantRepo.update(
            { tableId: tableIdNum, status: "joined" },
            { currentBet: 0, handState: "" }
        )

        // Emit socket event
        try {
            const io = getIO()
            io.emit("games:play_again", { tableId: tableIdNum })
        } catch (e) { }

        res.json({ success: true })
    } catch (error) {
        console.error("Error resetting table:", error)
        res.status(500).json({ error: "Internal server error" })
    }
})

// ============ BLACKJACK GAME ACTIONS ============

import * as blackjack from "../services/blackjackLogic"

const TURN_TIMEOUT_MS = 30 * 1000 // 30 seconds

// Helper to check if turn has timed out and auto-skip if needed
const checkAndHandleTimeout = async (table: GameTable, gameState: any): Promise<boolean> => {
    if (gameState.currentTurn === 'dealer' || gameState.currentTurn === 'finished') {
        return false
    }

    const elapsed = Date.now() - (gameState.turnStartTime || 0)
    if (elapsed < TURN_TIMEOUT_MS) {
        return false
    }

    // Timeout - auto-skip this player's turn
    blackjack.nextTurn(gameState)
    gameState.turnStartTime = Date.now()

    const tableRepo = AppDataSource.getRepository(GameTable)
    table.gameState = JSON.stringify(gameState)
    await tableRepo.save(table)

    // Emit timeout event
    try {
        const io = getIO()
        io.emit("games:turn_timeout", { tableId: table.id, newTurn: gameState.currentTurn })
    } catch (e) { }

    return true
}

// POST /games/tables/:tableId/bet - Place or update bet
router.post("/tables/:tableId/bet", async (req: any, res) => {
    try {
        const user = await getUserFromResponse(res)
        if (!user) return res.status(401).json({ error: "Unauthorized" })

        const { tableId } = req.params
        const { amount } = req.body
        const tableIdNum = parseInt(tableId)

        if (!amount || amount < 10) {
            return res.status(400).json({ error: "Minimum bet is 10 credits" })
        }

        if (amount > user.credit) {
            return res.status(400).json({ error: "Không đủ credit" })
        }

        const tableRepo = AppDataSource.getRepository(GameTable)
        const participantRepo = AppDataSource.getRepository(GameTableParticipant)

        const table = await tableRepo.findOne({ where: { id: tableIdNum } })
        if (!table) return res.status(404).json({ error: "Table not found" })

        if (table.status !== "waiting") {
            return res.status(400).json({ error: "Chỉ được đặt cược khi chưa bắt đầu" })
        }

        const participant = await participantRepo.findOne({
            where: { tableId: tableIdNum, userId: user.id, status: "joined" }
        })
        if (!participant) return res.status(404).json({ error: "Not in table" })

        participant.currentBet = amount
        await participantRepo.save(participant)

        // Emit update
        try {
            const io = getIO()
            io.emit("games:bet_placed", { tableId: tableIdNum, userId: user.id, amount })
        } catch (e) { }

        res.json({ success: true, bet: amount })
    } catch (error) {
        console.error("Error placing bet:", error)
        res.status(500).json({ error: "Internal server error" })
    }
})

// POST /games/tables/:tableId/start - Start the game (room owner only)
router.post("/tables/:tableId/start", async (req: any, res) => {
    try {
        const user = await getUserFromResponse(res)
        if (!user) return res.status(401).json({ error: "Unauthorized" })

        const { tableId } = req.params
        const tableIdNum = parseInt(tableId)

        const tableRepo = AppDataSource.getRepository(GameTable)
        const participantRepo = AppDataSource.getRepository(GameTableParticipant)
        const userRepo = AppDataSource.getRepository(User)

        const table = await tableRepo.findOne({ where: { id: tableIdNum } })
        if (!table) return res.status(404).json({ error: "Table not found" })

        if (table.createdById !== user.id) {
            return res.status(403).json({ error: "Chỉ chủ phòng mới được bắt đầu" })
        }

        if (table.status !== "waiting") {
            return res.status(400).json({ error: "Game đã bắt đầu" })
        }

        // Get all joined participants with bets
        const participants = await participantRepo.find({
            where: { tableId: tableIdNum, status: "joined" }
        })

        if (participants.length < 2) {
            return res.status(400).json({ error: "Cần ít nhất 2 người chơi (1 nhà cái + 1 nhà con)" })
        }

        const dealerId = table.dealerId || table.createdById

        // Check non-dealer players have placed bets
        const nonDealerPlayers = participants.filter(p => p.userId !== dealerId)
        const noBet = nonDealerPlayers.find(p => !p.currentBet || p.currentBet < 10)
        if (noBet) {
            return res.status(400).json({ error: "Tất cả nhà con phải đặt cược" })
        }

        // Deduct bets from non-dealer players only
        for (const p of nonDealerPlayers) {
            const playerUser = await userRepo.findOne({ where: { id: p.userId } })
            if (playerUser) {
                playerUser.credit -= p.currentBet
                await userRepo.save(playerUser)
            }
        }

        // Create game state with human dealer
        const gameState: blackjack.GameState = {
            deck: blackjack.createDeck(),
            dealerId: dealerId,
            players: {},
            currentTurn: 0,
            turnOrder: [],
            immediateWinners: [],
            dealerInstantWin: false
        }

        // Deal cards (dealer is last in order)
        const playerIds = participants.map(p => p.userId)
        blackjack.dealInitialCards(gameState, playerIds, dealerId)

        // Save hand states to participants
        for (const p of participants) {
            const hand = gameState.players[p.userId]
            p.handState = JSON.stringify(hand)
            await participantRepo.save(p)
        }

        // Handle immediate winners (Sỏ bàng/Sỏ dép) - pay them now
        const transactionRepo = AppDataSource.getRepository(CreditTransaction)
        const dealerUser = await userRepo.findOne({ where: { id: dealerId } })
        const dealerHand = gameState.players[dealerId]

        // Check if dealer has instant win (Sỏ bàng/Sỏ dép)
        if (gameState.dealerInstantWin) {
            // Dealer wins all bets from non-dealer players
            const results: any[] = []
            for (const p of nonDealerPlayers) {
                const pHand = gameState.players[p.userId]
                const bet = p.currentBet

                // Dealer receives the bet (player already lost it at start)
                if (dealerUser) {
                    dealerUser.credit += bet
                    await userRepo.save(dealerUser)
                }

                results.push({
                    userId: p.userId,
                    hand: pHand,
                    bet: bet,
                    winnings: -bet,
                    description: dealerHand.isDoubleAce ? 'Nhà cái Xì Bàn! 🎉' : 'Nhà cái Xì Dách! 🃏'
                })
            }

            // Add dealer result
            results.push({
                userId: dealerId,
                hand: dealerHand,
                bet: 0,
                winnings: 0,
                description: dealerHand.isDoubleAce ? 'Xì Bàn - Thắng trắng! 🎉' : 'Xì Dách - Thắng trắng! 🃏',
                isDealer: true
            })

            // Game ends immediately
            table.status = "finished"
            table.gameState = JSON.stringify({
                deck: gameState.deck,
                dealerId: gameState.dealerId,
                currentTurn: 'finished',
                turnOrder: [],
                immediateWinners: [],
                dealerInstantWin: true,
                results
            })
            await tableRepo.save(table)

            // Emit game finished
            try {
                const io = getIO()
                io.emit("games:game_finished", {
                    tableId: tableIdNum,
                    dealerId: dealerId,
                    dealerInstantWin: true,
                    results
                })
            } catch (e) { }

            return res.json({ success: true, finished: true, dealerInstantWin: true, dealerId, results })
        }

        // Handle player immediate winners (Sỏ bàng/Sỏ dép) - pay them now
        for (const winnerId of gameState.immediateWinners) {
            const winnerParticipant = participants.find(p => p.userId === winnerId)
            if (!winnerParticipant) continue

            const winnerHand = gameState.players[winnerId]
            const bet = winnerParticipant.currentBet

            // Calculate winnings using the same logic
            const winnings = blackjack.calculateWinnings(winnerHand, dealerHand, bet)
            const description = blackjack.getResultDescription(winnerHand, dealerHand, winnings)

            // Pay winner
            const winnerUser = await userRepo.findOne({ where: { id: winnerId } })
            if (winnerUser && winnings > 0) {
                winnerUser.credit += bet + winnings // Return bet + winnings
                await userRepo.save(winnerUser)
                const tx = transactionRepo.create({
                    userId: winnerId,
                    amount: winnings,
                    type: "win",
                    description: `Thắng trắng: ${description}`,
                    balanceAfter: winnerUser.credit
                })
                await transactionRepo.save(tx)
            }

            // Dealer loses
            if (dealerUser && winnings > 0) {
                dealerUser.credit -= winnings
                await userRepo.save(dealerUser)
            }
        }

        // Update table with turn timer
        table.status = "playing"
        // Store FULL state on server (with deck) - never exposed to client
        table.gameState = JSON.stringify({
            deck: gameState.deck,
            dealerId: gameState.dealerId,
            players: gameState.players, // Full player hands stored server-side
            currentTurn: gameState.currentTurn,
            turnOrder: gameState.turnOrder,
            immediateWinners: gameState.immediateWinners,
            dealerInstantWin: false,
            turnStartTime: Date.now()
        })
        await tableRepo.save(table)

        // Emit per-user filtered game state (each user only sees their own cards)
        try {
            const playerIds = participants.map(p => p.userId)
            await emitToEachGameUser(
                tableIdNum,
                "games:game_started",
                playerIds,
                (userId) => ({
                    tableId: tableIdNum,
                    gameState: blackjack.filterStateForUser(gameState, userId, false)
                })
            )
        } catch (e) { }

        // Return filtered state for requesting user (no deck, masked cards)
        const filteredState = blackjack.filterStateForUser(gameState, user.id, false)
        res.json({ success: true, gameState: filteredState })
    } catch (error) {
        console.error("Error starting game:", error)
        res.status(500).json({ error: "Internal server error" })
    }
})

// POST /games/tables/:tableId/hit - Draw another card
router.post("/tables/:tableId/hit", async (req: any, res) => {
    try {
        const user = await getUserFromResponse(res)
        if (!user) return res.status(401).json({ error: "Unauthorized" })

        const { tableId } = req.params
        const tableIdNum = parseInt(tableId)

        const tableRepo = AppDataSource.getRepository(GameTable)
        const participantRepo = AppDataSource.getRepository(GameTableParticipant)

        const table = await tableRepo.findOne({ where: { id: tableIdNum } })
        if (!table || table.status !== "playing") {
            return res.status(400).json({ error: "Game chưa bắt đầu" })
        }

        const gameState = JSON.parse(table.gameState || "{}")

        if (gameState.currentTurn !== user.id) {
            return res.status(400).json({ error: "Chưa đến lượt bạn" })
        }

        const participant = await participantRepo.findOne({
            where: { tableId: tableIdNum, userId: user.id }
        })
        if (!participant) return res.status(404).json({ error: "Not in table" })

        // Get current hand
        let hand = JSON.parse(participant.handState || "{}")

        // Draw card
        const newCard = blackjack.drawCard(gameState.deck)
        if (newCard) {
            hand.cards.push(newCard)
            hand = blackjack.evaluateHand(hand.cards)
        }

        // Save hand
        participant.handState = JSON.stringify(hand)
        await participantRepo.save(participant)

        // Update game state
        gameState.players = gameState.players || {}
        gameState.players[user.id] = hand

        // If busted or 5 cards, auto stand
        if (hand.isBusted || hand.cards.length >= 5) {
            blackjack.nextTurn(gameState)
        }

        table.gameState = JSON.stringify(gameState)
        await tableRepo.save(table)

        // Emit per-user filtered update
        try {
            const participants = await participantRepo.find({
                where: { tableId: tableIdNum, status: "joined" }
            })
            const playerIds = participants.map(p => p.userId)

            await emitToEachGameUser(
                tableIdNum,
                "games:player_hit",
                playerIds,
                (pUserId) => ({
                    tableId: tableIdNum,
                    hitUserId: user.id,
                    // Each user sees their own filtered view
                    hand: pUserId === user.id ? hand : blackjack.maskHand(hand),
                    currentTurn: gameState.currentTurn
                })
            )
        } catch (e) { }

        res.json({ success: true, hand, currentTurn: gameState.currentTurn })
    } catch (error) {
        console.error("Error hitting:", error)
        res.status(500).json({ error: "Internal server error" })
    }
})

// POST /games/tables/:tableId/stand - Stop drawing cards
router.post("/tables/:tableId/stand", async (req: any, res) => {
    try {
        const user = await getUserFromResponse(res)
        if (!user) return res.status(401).json({ error: "Unauthorized" })

        const { tableId } = req.params
        const tableIdNum = parseInt(tableId)

        const tableRepo = AppDataSource.getRepository(GameTable)
        const participantRepo = AppDataSource.getRepository(GameTableParticipant)
        const userRepo = AppDataSource.getRepository(User)
        const transactionRepo = AppDataSource.getRepository(CreditTransaction)

        const table = await tableRepo.findOne({ where: { id: tableIdNum } })
        if (!table || table.status !== "playing") {
            return res.status(400).json({ error: "Game chưa bắt đầu" })
        }

        const gameState = JSON.parse(table.gameState || "{}")

        if (gameState.currentTurn !== user.id) {
            return res.status(400).json({ error: "Chưa đến lượt bạn" })
        }

        // Get player's hand to check if they can stand
        const participant = await participantRepo.findOne({
            where: { tableId: tableIdNum, userId: user.id }
        })
        if (!participant) return res.status(404).json({ error: "Not in table" })

        const playerHand = JSON.parse(participant.handState || "{}")

        // Check if player can stand (must have >= 16 or special hand)
        if (!blackjack.canStand(playerHand)) {
            return res.status(400).json({ error: "Cần ít nhất 16 điểm mới được dừng (đủ tuổi)" })
        }

        // Move to next turn
        blackjack.nextTurn(gameState)

        // If game is finished (dealer was last), calculate results
        if (gameState.currentTurn === 'finished') {
            // Get dealer's hand (dealer is a player)
            const dealerHand = gameState.players[gameState.dealerId]

            // Calculate results for all non-dealer players
            const participants = await participantRepo.find({
                where: { tableId: tableIdNum, status: "joined" }
            })

            const results: any[] = []
            for (const p of participants) {
                if (p.userId === gameState.dealerId) continue // Skip dealer

                const pHand = JSON.parse(p.handState || "{}")
                const winnings = blackjack.calculateWinnings(pHand, dealerHand, p.currentBet)
                const description = blackjack.getResultDescription(pHand, dealerHand, winnings)

                // Update player credits and dealer credits
                const playerUser = await userRepo.findOne({ where: { id: p.userId } })
                const dealerUser = await userRepo.findOne({ where: { id: gameState.dealerId } })

                if (winnings > 0) {
                    // Player wins - pay player (bet + winnings), dealer loses winnings
                    if (playerUser) {
                        playerUser.credit += p.currentBet + winnings
                        await userRepo.save(playerUser)
                        const tx = transactionRepo.create({
                            userId: p.userId,
                            amount: winnings,
                            type: "win",
                            description: `Sỏ dép: ${description}`,
                            balanceAfter: playerUser.credit
                        })
                        await transactionRepo.save(tx)
                    }
                    if (dealerUser) {
                        dealerUser.credit -= winnings
                        await userRepo.save(dealerUser)
                    }
                } else if (winnings < 0) {
                    // Player loses - dealer wins the bet amount
                    // Player already lost bet at start, so no refund
                    if (dealerUser) {
                        dealerUser.credit += p.currentBet // Dealer receives full bet
                        await userRepo.save(dealerUser)
                    }
                } else {
                    // Push (winnings === 0) - return bet to player
                    if (playerUser) {
                        playerUser.credit += p.currentBet
                        await userRepo.save(playerUser)
                    }
                }

                results.push({
                    userId: p.userId,
                    hand: pHand,
                    bet: p.currentBet,
                    winnings,
                    description
                })
            }

            // Add dealer result
            results.push({
                userId: gameState.dealerId,
                hand: dealerHand,
                bet: 0,
                winnings: 0,
                description: "Nhà cái",
                isDealer: true
            })

            // Update table status
            table.status = "finished"
            table.gameState = JSON.stringify({ ...gameState, results })
            await tableRepo.save(table)

            // Emit results
            try {
                const io = getIO()
                io.emit("games:game_finished", {
                    tableId: tableIdNum,
                    dealerId: gameState.dealerId,
                    results
                })
            } catch (e) { }

            return res.json({ success: true, finished: true, dealerId: gameState.dealerId, results })
        }

        table.gameState = JSON.stringify(gameState)
        await tableRepo.save(table)

        // Emit update
        try {
            const io = getIO()
            io.emit("games:player_stand", { tableId: tableIdNum, userId: user.id, currentTurn: gameState.currentTurn })
        } catch (e) { }

        res.json({ success: true, currentTurn: gameState.currentTurn })
    } catch (error) {
        console.error("Error standing:", error)
        res.status(500).json({ error: "Internal server error" })
    }
})

// POST /games/tables/:tableId/check-timeout - Check and process turn timeout
router.post("/tables/:tableId/check-timeout", async (req: any, res) => {
    try {
        const { tableId } = req.params
        const tableIdNum = parseInt(tableId)

        const tableRepo = AppDataSource.getRepository(GameTable)
        const participantRepo = AppDataSource.getRepository(GameTableParticipant)
        const userRepo = AppDataSource.getRepository(User)
        const transactionRepo = AppDataSource.getRepository(CreditTransaction)

        const table = await tableRepo.findOne({ where: { id: tableIdNum } })
        if (!table || table.status !== "playing") {
            return res.json({ timedOut: false })
        }

        const gameState = JSON.parse(table.gameState || "{}")

        // Check timeout and handle if needed
        const wasTimeout = await checkAndHandleTimeout(table, gameState)

        // If game is finished (all players including dealer have played), calculate results
        if (wasTimeout && gameState.currentTurn === 'finished') {
            const dealerHand = gameState.players[gameState.dealerId]

            // Calculate results for all non-dealer players
            const participants = await participantRepo.find({
                where: { tableId: tableIdNum, status: "joined" }
            })

            const results: any[] = []
            for (const p of participants) {
                if (p.userId === gameState.dealerId) continue

                const pHand = JSON.parse(p.handState || "{}")
                const winnings = blackjack.calculateWinnings(pHand, dealerHand, p.currentBet)
                const description = blackjack.getResultDescription(pHand, dealerHand, winnings)

                const playerUser = await userRepo.findOne({ where: { id: p.userId } })
                const dealerUser = await userRepo.findOne({ where: { id: gameState.dealerId } })

                if (winnings > 0) {
                    if (playerUser) {
                        playerUser.credit += p.currentBet + winnings
                        await userRepo.save(playerUser)
                        const tx = transactionRepo.create({
                            userId: p.userId,
                            amount: winnings,
                            type: "win",
                            description: `Sỏ dép: ${description}`,
                            balanceAfter: playerUser.credit
                        })
                        await transactionRepo.save(tx)
                    }
                    if (dealerUser) {
                        dealerUser.credit -= winnings
                        await userRepo.save(dealerUser)
                    }
                } else if (winnings < 0) {
                    if (dealerUser) {
                        dealerUser.credit += p.currentBet
                        await userRepo.save(dealerUser)
                    }
                } else {
                    if (playerUser) {
                        playerUser.credit += p.currentBet
                        await userRepo.save(playerUser)
                    }
                }

                results.push({ userId: p.userId, hand: pHand, bet: p.currentBet, winnings, description })
            }

            table.status = "finished"
            table.gameState = JSON.stringify({ ...gameState, results })
            await tableRepo.save(table)

            try {
                const io = getIO()
                io.emit("games:game_finished", { tableId: tableIdNum, dealerId: gameState.dealerId, results })
            } catch (e) { }

            return res.json({ timedOut: true, finished: true, dealerId: gameState.dealerId, results })
        }

        res.json({
            timedOut: wasTimeout,
            currentTurn: gameState.currentTurn,
            turnStartTime: gameState.turnStartTime
        })
    } catch (error) {
        console.error("Error checking timeout:", error)
        res.status(500).json({ error: "Internal server error" })
    }
})

// POST /games/tables/:tableId/transfer-dealer - Transfer dealer role to another player
router.post("/tables/:tableId/transfer-dealer", async (req: any, res) => {
    try {
        const user = await getUserFromResponse(res)
        if (!user) return res.status(401).json({ error: "Unauthorized" })

        const { tableId } = req.params
        const { newDealerId } = req.body
        const tableIdNum = parseInt(tableId)

        if (!newDealerId) {
            return res.status(400).json({ error: "newDealerId is required" })
        }

        const tableRepo = AppDataSource.getRepository(GameTable)
        const participantRepo = AppDataSource.getRepository(GameTableParticipant)

        const table = await tableRepo.findOne({ where: { id: tableIdNum } })
        if (!table) {
            return res.status(404).json({ error: "Table not found" })
        }

        if (table.status !== "waiting") {
            return res.status(400).json({ error: "Chỉ có thể chuyển cái khi chưa bắt đầu" })
        }

        // Only current dealer or room owner can transfer
        if (table.dealerId !== user.id && table.createdById !== user.id) {
            return res.status(403).json({ error: "Chỉ nhà cái hoặc chủ phòng mới có thể chuyển cái" })
        }

        // Check if new dealer is in the table
        const newDealerParticipant = await participantRepo.findOne({
            where: { tableId: tableIdNum, userId: newDealerId, status: "joined" }
        })
        if (!newDealerParticipant) {
            return res.status(400).json({ error: "Người chơi không có trong bàn" })
        }

        // Transfer dealer
        table.dealerId = newDealerId
        await tableRepo.save(table)

        // Emit socket event
        try {
            const io = getIO()
            io.emit("games:dealer_changed", { tableId: tableIdNum, dealerId: newDealerId })
        } catch (e) { }

        res.json({ success: true, dealerId: newDealerId })
    } catch (error) {
        console.error("Error transferring dealer:", error)
        res.status(500).json({ error: "Internal server error" })
    }
})

export default router
