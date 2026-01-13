import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

export async function connectDatabase() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_agente_ia';

        await mongoose.connect(uri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });

        logger.info('✅ MongoDB connected successfully');

        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });

    } catch (error) {
        logger.error('❌ MongoDB connection failed:', error);
        throw error;
    }
}

export function getDatabase() {
    return mongoose.connection;
}
