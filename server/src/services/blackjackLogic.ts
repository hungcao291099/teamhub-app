// Blackjack game logic helpers - Vietnamese rules (Sò dép)
// Human dealer model: one player is the dealer (nhà cái)

export interface Card {
    suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
    rank: string; // '2'-'10', 'J', 'Q', 'K', 'A'
    value: number; // Base value (A = 11, will be adjusted)
}

export interface Hand {
    cards: Card[];
    score: number;
    isBusted: boolean;
    isBlackjack: boolean; // Sò dép (A + 10/J/Q/K)
    isDoubleAce: boolean; // Xì bàng (2 lá A)
    isFiveCard: boolean; // Ngũ linh (5 lá <= 21)
    isNon: boolean; // Non (< 16 điểm, không có special)
}

export interface GameState {
    deck: Card[];
    dealerId: number; // Human dealer ID
    players: { [userId: number]: Hand }; // All players including dealer
    currentTurn: number | 'finished';
    turnOrder: number[]; // Player order (dealer is LAST)
    immediateWinners: number[]; // Players with Xì Bàng/Sò dép
    turnStartTime?: number; // For timeout
}

// Create a shuffled deck
export function createDeck(): Card[] {
    const suits: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    const deck: Card[] = [];
    for (const suit of suits) {
        for (const rank of ranks) {
            let value = parseInt(rank);
            if (isNaN(value)) {
                value = rank === 'A' ? 11 : 10;
            }
            deck.push({ suit, rank, value });
        }
    }

    // Shuffle using Fisher-Yates
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
}

// Draw a card from deck
export function drawCard(deck: Card[]): Card | null {
    return deck.pop() || null;
}

// Calculate hand score (handles Ace as 1 or 11)
export function calculateScore(cards: Card[]): number {
    let score = 0;
    let aces = 0;

    for (const card of cards) {
        if (card.rank === 'A') {
            aces++;
            score += 11;
        } else {
            score += card.value;
        }
    }

    // Convert Aces from 11 to 1 if busting
    while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
    }

    return score;
}

// Evaluate hand status
export function evaluateHand(cards: Card[]): Hand {
    const score = calculateScore(cards);
    const isDoubleAce = cards.length === 2 && cards.every(c => c.rank === 'A');
    const isBlackjack = cards.length === 2 && score === 21 && !isDoubleAce;
    const isFiveCard = cards.length === 5 && score <= 21;
    const isBusted = score > 21;
    const isNon = !isDoubleAce && !isBlackjack && !isFiveCard && !isBusted && score < 16;

    return {
        cards,
        score,
        isBusted,
        isBlackjack,
        isDoubleAce,
        isFiveCard,
        isNon
    };
}

// Get hand rank for comparison (higher = stronger)
// Xì Bàng(5) > Sò dép(4) > Ngũ Linh(3) > 16-21(2) > Non(1) > Quắc(0)
export function getHandRank(hand: Hand): number {
    if (hand.isDoubleAce) return 5; // Xì Bàng
    if (hand.isBlackjack) return 4; // Sò dép
    if (hand.isFiveCard) return 3; // Ngũ Linh
    if (hand.isBusted) return 0; // Quắc
    if (hand.isNon) return 1; // Non
    return 2; // Normal 16-21
}

// Check if player can stand (must have >= 16 points)
export function canStand(hand: Hand): boolean {
    if (hand.isDoubleAce || hand.isBlackjack || hand.isFiveCard) return true;
    if (hand.isBusted) return true;
    return hand.score >= 16;
}

// Deal initial 2 cards to each player (including dealer)
export function dealInitialCards(state: GameState, playerIds: number[], dealerId: number): void {
    state.immediateWinners = [];
    state.dealerId = dealerId;

    // Deal 2 cards to each player (including dealer)
    for (const playerId of playerIds) {
        const cards: Card[] = [];
        cards.push(drawCard(state.deck)!);
        cards.push(drawCard(state.deck)!);
        state.players[playerId] = evaluateHand(cards);

        // Check instant win (Xì Bàng or Sò dép) - except dealer
        if (playerId !== dealerId) {
            if (state.players[playerId].isDoubleAce || state.players[playerId].isBlackjack) {
                state.immediateWinners.push(playerId);
            }
        }
    }

    // Set turn order: non-dealers first, then dealer last
    // Skip immediate winners
    const nonDealers = playerIds.filter(id => id !== dealerId && !state.immediateWinners.includes(id));
    state.turnOrder = [...nonDealers, dealerId];
    state.currentTurn = state.turnOrder.length > 0 ? state.turnOrder[0] : 'finished';
    state.turnStartTime = Date.now();
}

// Player hits - draw another card
export function playerHit(state: GameState, playerId: number): Hand {
    const hand = state.players[playerId];
    if (!hand || hand.isBusted || hand.isFiveCard) {
        return hand;
    }

    const newCard = drawCard(state.deck);
    if (newCard) {
        hand.cards.push(newCard);
        const evaluated = evaluateHand(hand.cards);
        state.players[playerId] = evaluated;
        return evaluated;
    }

    return hand;
}

// Move to next turn
export function nextTurn(state: GameState): void {
    if (state.currentTurn === 'finished') {
        return;
    }

    const currentIndex = state.turnOrder.indexOf(state.currentTurn as number);
    if (currentIndex < state.turnOrder.length - 1) {
        state.currentTurn = state.turnOrder[currentIndex + 1];
    } else {
        state.currentTurn = 'finished';
    }
    state.turnStartTime = Date.now();
}

// Check if current turn is dealer
export function isDealerTurn(state: GameState): boolean {
    return state.currentTurn === state.dealerId;
}

// Calculate winnings for a player vs dealer
export function calculateWinnings(playerHand: Hand, dealerHand: Hand, bet: number): number {
    const playerRank = getHandRank(playerHand);
    const dealerRank = getHandRank(dealerHand);

    // Both bust - Dealer wins
    if (playerHand.isBusted && dealerHand.isBusted) {
        return -bet;
    }

    // Player bust
    if (playerHand.isBusted) {
        return -bet;
    }

    // Dealer bust
    if (dealerHand.isBusted) {
        if (playerHand.isDoubleAce) return bet * 2;
        if (playerHand.isBlackjack) return Math.floor(bet * 1.5);
        if (playerHand.isFiveCard) return bet * 2;
        return bet;
    }

    // Compare ranks
    if (playerRank > dealerRank) {
        if (playerHand.isDoubleAce) return bet * 2;
        if (playerHand.isBlackjack) return Math.floor(bet * 1.5);
        if (playerHand.isFiveCard) return bet * 2;
        return bet;
    } else if (playerRank < dealerRank) {
        return -bet;
    }

    // Same rank - Ngũ Linh: lower score wins
    if (playerHand.isFiveCard && dealerHand.isFiveCard) {
        if (playerHand.score < dealerHand.score) return bet * 2;
        if (playerHand.score > dealerHand.score) return -bet;
        return 0;
    }

    // Same rank, compare scores
    if (playerHand.score > dealerHand.score) {
        return bet;
    } else if (playerHand.score < dealerHand.score) {
        return -bet;
    }

    return 0; // Push
}

// Get result description
export function getResultDescription(playerHand: Hand, dealerHand: Hand, winnings: number): string {
    if (playerHand.isDoubleAce) return 'Xì Bàng! 🎉';
    if (playerHand.isBlackjack) return 'Sò dép! 🃏';
    if (playerHand.isFiveCard) return 'Ngũ Linh! ⭐';
    if (playerHand.isBusted) return 'Quắc! 💥';
    if (playerHand.isNon) return 'Non! 😢';

    if (winnings > 0) return 'Thắng! 💰';
    if (winnings < 0) return 'Thua! 😔';
    return 'Hòa! 🤝';
}
