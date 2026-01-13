import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

/**
 * Get encryption key from environment
 */
function getEncryptionKey() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || key.length !== 64) {
        throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
    }
    return Buffer.from(key, 'hex');
}

/**
 * Encrypt sensitive data (like API keys)
 * @param {string} text - Plain text to encrypt
 * @returns {object} - { iv, encrypted, authTag }
 */
export function encrypt(text) {
    if (!text) return null;

    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
        iv: iv.toString('hex'),
        encrypted,
        authTag: authTag.toString('hex')
    };
}

/**
 * Decrypt sensitive data
 * @param {object} data - { iv, encrypted, authTag }
 * @returns {string} - Decrypted plain text
 */
export function decrypt(data) {
    if (!data || !data.iv || !data.encrypted || !data.authTag) {
        return null;
    }

    const key = getEncryptionKey();

    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        key,
        Buffer.from(data.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));

    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Check if data is encrypted
 */
export function isEncrypted(data) {
    return data &&
        typeof data === 'object' &&
        'iv' in data &&
        'encrypted' in data &&
        'authTag' in data;
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a webhook verify token
 */
export function generateWebhookToken() {
    return crypto.randomBytes(16).toString('base64url');
}

/**
 * Hash a value (one-way, for verification)
 */
export function hash(value) {
    return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Compare a value with its hash
 */
export function verifyHash(value, hashedValue) {
    return hash(value) === hashedValue;
}
