// Game card encryption utilities for secure transmission
import crypto from 'crypto'
import config from '../config'

// Use a secret key derived from JWT secret
const getEncryptionKey = (): Buffer => {
    const secret = config.jwtSecret || 'game-encryption-key'
    return crypto.createHash('sha256').update(secret).digest()
}

// Encrypt card data
export function encryptCards(cards: any[]): string {
    if (!cards || cards.length === 0) return ''

    const key = getEncryptionKey()
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)

    let encrypted = cipher.update(JSON.stringify(cards), 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // Return IV + encrypted data (IV needed for decryption)
    return iv.toString('hex') + ':' + encrypted
}

// Decrypt card data 
export function decryptCards(encryptedData: string): any[] {
    if (!encryptedData) return []

    try {
        const key = getEncryptionKey()
        const [ivHex, encrypted] = encryptedData.split(':')
        const iv = Buffer.from(ivHex, 'hex')
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)

        let decrypted = decipher.update(encrypted, 'hex', 'utf8')
        decrypted += decipher.final('utf8')

        return JSON.parse(decrypted)
    } catch (e) {
        console.error('Decryption error:', e)
        return []
    }
}

// Encrypt a single hand for transmission
export function encryptHand(hand: any): any {
    if (!hand || !hand.cards) return hand

    return {
        ...hand,
        encryptedCards: encryptCards(hand.cards),
        cards: undefined // Remove plaintext cards
    }
}

// Get encryption key in hex format for client-side decryption
// In production, this should be transmitted securely via https
export function getClientDecryptionKey(): string {
    return getEncryptionKey().toString('hex')
}
