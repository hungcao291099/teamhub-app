// Blackjack game logic helpers

export interface Card {
    suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
    rank: string; // '2'-'10', 'J', 'Q', 'K', 'A'
    value: number; // Base value (A = 11, will be adjusted)
}

export interface Hand {
    cards: Card[];
    score: number;
    isBusted: boolean;
    isBlackjack: boolean;
    isDoubleAce: boolean; // Xì bàng
    isFiveCard: boolean; // Ngũ linh
}

export interface GameState {
    deck: Card[];
    dealer: Hand;
    players: { [oderId: number]: Hand };
    currentTurn: number | 'dealer' | 'finished';
    turnOrder: number[];
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

    return {
        cards,
        score,
        isBusted: score > 21,
        isBlackjack: cards.length === 2 && score === 21,
        isDoubleAce: cards.length === 2 && cards.every(c => c.rank === 'A'),
        isFiveCard: cards.length === 5 && score <= 21
    };
}

// Check if hand is "non" (under 16 points without special)
export function isNon(hand: Hand): boolean {
    if (hand.isBlackjack || hand.isDoubleAce || hand.isFiveCard) return false;
    return hand.score < 16;
}

// Deal initial 2 cards to each player and dealer
export function dealInitialCards(state: GameState, playerIds: number[]): void {
    // Deal 2 cards to each player
    for (const playerId of playerIds) {
        const cards: Card[] = [];
        cards.push(drawCard(state.deck)!);
        cards.push(drawCard(state.deck)!);
        state.players[playerId] = evaluateHand(cards);
    }

    // Deal 2 cards to dealer
    const dealerCards: Card[] = [];
    dealerCards.push(drawCard(state.deck)!);
    dealerCards.push(drawCard(state.deck)!);
    state.dealer = evaluateHand(dealerCards);

    // Set turn order
    state.turnOrder = [...playerIds];
    state.currentTurn = playerIds[0];
}

// Player hits - draw another card
export function playerHit(state: GameState, playerId: number): Hand {
    const hand = state.players[playerId];
    if (!hand || hand.isBusted) {
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
    if (state.currentTurn === 'dealer' || state.currentTurn === 'finished') {
        return;
    }

    const currentIndex = state.turnOrder.indexOf(state.currentTurn);
    if (currentIndex < state.turnOrder.length - 1) {
        state.currentTurn = state.turnOrder[currentIndex + 1];
    } else {
        state.currentTurn = 'dealer';
    }
}

// Dealer auto-play (hit until >= 17)
export function dealerPlay(state: GameState): void {
    while (state.dealer.score < 17 && !state.dealer.isBusted) {
        const newCard = drawCard(state.deck);
        if (newCard) {
            state.dealer.cards.push(newCard);
            state.dealer = evaluateHand(state.dealer.cards);
        } else {
            break;
        }
    }
    state.currentTurn = 'finished';
}

// Calculate winnings for a player
export function calculateWinnings(playerHand: Hand, dealerHand: Hand, bet: number): number {
    // Player busted
    if (playerHand.isBusted) {
        return -bet;
    }

    // Xì bàng (double aces) - wins 2:1
    if (playerHand.isDoubleAce) {
        if (dealerHand.isDoubleAce) return 0; // Push
        return bet * 2;
    }

    // Xì dách (blackjack) - wins 1.5:1
    if (playerHand.isBlackjack) {
        if (dealerHand.isBlackjack || dealerHand.isDoubleAce) return 0; // Push or lose
        return Math.floor(bet * 1.5);
    }

    // Ngũ linh (5 cards under 21) - wins 2:1
    if (playerHand.isFiveCard) {
        if (dealerHand.isFiveCard && dealerHand.score < playerHand.score) return -bet;
        if (dealerHand.isDoubleAce || dealerHand.isBlackjack) return -bet;
        return bet * 2;
    }

    // Non (under 16) - loses
    if (isNon(playerHand)) {
        return -bet;
    }

    // Dealer busted
    if (dealerHand.isBusted) {
        return bet;
    }

    // Dealer has special hand
    if (dealerHand.isDoubleAce || dealerHand.isBlackjack || dealerHand.isFiveCard) {
        return -bet;
    }

    // Compare scores
    if (playerHand.score > dealerHand.score) {
        return bet;
    } else if (playerHand.score < dealerHand.score) {
        return -bet;
    }

    return 0; // Push (tie)
}

// Get result description
export function getResultDescription(playerHand: Hand, dealerHand: Hand, winnings: number): string {
    if (playerHand.isDoubleAce) return 'Xì Bàng! 🎉';
    if (playerHand.isBlackjack) return 'Xì Dách! 🃏';
    if (playerHand.isFiveCard) return 'Ngũ Linh! ⭐';
    if (playerHand.isBusted) return 'Quắc! 💥';
    if (isNon(playerHand)) return 'Non! 😢';

    if (winnings > 0) return 'Thắng! 💰';
    if (winnings < 0) return 'Thua! 😔';
    return 'Hòa! 🤝';
}
