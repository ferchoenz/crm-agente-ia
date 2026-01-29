import crypto from 'crypto';
import { logger } from './logger.js';

const ALGORITHM = 'aes-256-cbc';
// Ensure key is 32 bytes. If env var is short, pad it. If long, truncate.
// Ideally usage of a properly generated key from env is expected.
const getCipherKey = (password) => {
    return crypto.createHash('sha256').update(password).digest();
};

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'default_secret_key_replace_me_please';

export function encrypt(text) {
    if (!text) return null;
    try {
        const iv = crypto.randomBytes(16);
        const key = getCipherKey(ENCRYPTION_KEY);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
        logger.error('Encryption error:', error);
        return null;
    }
}

export function decrypt(text) {
    if (!text) return null;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const key = getCipherKey(ENCRYPTION_KEY);
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        logger.error('Decryption error:', error);
        return null;
    }
}
