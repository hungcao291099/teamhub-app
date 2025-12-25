import api from "./api";

// Credit endpoints
export const getCredits = async () => {
    const response = await api.get("/games/credits");
    return response.data;
};

export const getCreditHistory = async () => {
    const response = await api.get("/games/credits/history");
    return response.data;
};

export const applyCheatcode = async () => {
    const response = await api.post("/games/credits/cheat");
    return response.data;
};

// Active table check
export const getActiveTable = async () => {
    const response = await api.get("/games/active-table");
    return response.data;
};

// Table endpoints
export const getTables = async (gameType: string) => {
    const response = await api.get(`/games/tables/${gameType}`);
    return response.data;
};

export const getTable = async (gameType: string, tableId: number) => {
    const response = await api.get(`/games/tables/${gameType}/${tableId}`);
    return response.data;
};

export const createTable = async (data: { gameType: string; name: string }) => {
    const response = await api.post("/games/tables", data);
    return response.data;
};

export const joinTable = async (tableId: number) => {
    const response = await api.post(`/games/tables/${tableId}/join`);
    return response.data;
};

export const leaveTable = async (tableId: number) => {
    const response = await api.post(`/games/tables/${tableId}/leave`);
    return response.data;
};


// Game action endpoints
export const placeBet = async (tableId: number, amount: number) => {
    const response = await api.post(`/games/tables/${tableId}/bet`, { amount });
    return response.data;
};

export const startGame = async (tableId: number) => {
    const response = await api.post(`/games/tables/${tableId}/start`);
    return response.data;
};

export const hit = async (tableId: number) => {
    const response = await api.post(`/games/tables/${tableId}/hit`);
    return response.data;
};

export const stand = async (tableId: number) => {
    const response = await api.post(`/games/tables/${tableId}/stand`);
    return response.data;
};

export const checkTimeout = async (tableId: number) => {
    const response = await api.post(`/games/tables/${tableId}/check-timeout`);
    return response.data;
};

export const playAgain = async (tableId: number) => {
    const response = await api.post(`/games/tables/${tableId}/play-again`);
    return response.data;
};

export const transferDealer = async (tableId: number, newDealerId: number) => {
    const response = await api.post(`/games/tables/${tableId}/transfer-dealer`, { newDealerId });
    return response.data;
};

export const TURN_TIMEOUT_MS = 30 * 1000; // 30 seconds

// Game types (fixed list - only Blackjack for now)
export const GAMES = [
    {
        id: "blackjack",
        name: "Sỏ dép",
        description: "Đạt 21 điểm hoặc gần nhất. Thắng 1:1, Sỏ dép 3:2",
        icon: "🃏",
        minPlayers: 1,
        maxPlayers: 4,
    }
];

// Card display helpers
export const getSuitSymbol = (suit: string) => {
    const symbols: Record<string, string> = {
        hearts: '♥',
        diamonds: '♦',
        clubs: '♣',
        spades: '♠'
    };
    return symbols[suit] || suit;
};

export const getSuitColor = (suit: string) => {
    // Red for hearts/diamonds, black for clubs/spades
    return suit === 'hearts' || suit === 'diamonds' ? 'text-red-600' : 'text-gray-900';
};
