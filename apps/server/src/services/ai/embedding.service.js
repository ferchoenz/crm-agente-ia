import { GoogleGenerativeAI } from '@google/generative-ai';
import { Product } from '../../models/index.js';
import { logger } from '../../utils/logger.js';

/**
 * Embedding Service for RAG using Google Gemini
 * Generates and manages vector embeddings for products
 */

const EMBEDDING_MODEL = 'text-embedding-004';

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
export async function generateEmbedding(text) {
    if (!text || typeof text !== 'string') return [];

    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

        const result = await model.embedContent(text);
        const embedding = result.embedding;
        return embedding.values;
    } catch (error) {
        logger.error('Failed to generate embedding (Google):', error.message, error.stack);
        return [];
    }
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateEmbeddings(texts) {
    // Google SDK doesn't always support batch conveniently in all versions, 
    // but we can map promises.
    try {
        const promises = texts.map(text => generateEmbedding(text));
        return Promise.all(promises);
    } catch (error) {
        logger.error('Failed to generate batch embeddings:', error);
        return texts.map(() => []);
    }
}

/**
 * Generate embeddings for a product and save
 */
export async function embedProduct(productId) {
    const product = await Product.findById(productId);

    if (!product) {
        throw new Error('Product not found');
    }

    const text = product.getEmbeddingText();

    if (!text || text.trim().length < 10) {
        logger.warn(`Product ${productId} has insufficient text for embedding`);
        return null;
    }

    try {
        const embedding = await generateEmbedding(text);

        product.embedding = embedding;
        product.embeddingModel = 'text-embedding-004';
        product.embeddingUpdatedAt = new Date();

        await product.save();

        logger.info(`Embedded product ${productId}`);
        return embedding;
    } catch (error) {
        logger.error(`Failed to embed product ${productId}:`, error);
        throw error;
    }
}

/**
 * Embed all products for an organization
 */
export async function embedAllProducts(organizationId) {
    const products = await Product.find({
        organization: organizationId,
        status: 'active'
    }).select('_id name');

    let success = 0;
    let failed = 0;

    for (const product of products) {
        try {
            await embedProduct(product._id);
            success++;
            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            failed++;
        }
    }

    logger.info(`Embedded ${success} products, ${failed} failed for org ${organizationId}`);
    return { success, failed };
}

/**
 * Find similar products using cosine similarity
 * Note: For production, use MongoDB Atlas Vector Search
 */
export async function findSimilarProducts(organizationId, queryText, limit = 5) {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(queryText);

    // Get products with embeddings
    const products = await Product.find({
        organization: organizationId,
        status: 'active',
        available: true,
        embedding: { $exists: true, $ne: [] }
    }).select('name description price category embedding');

    if (products.length === 0) {
        // Fallback to text search
        return Product.find({
            organization: organizationId,
            status: 'active',
            available: true,
            $text: { $search: queryText }
        })
            .limit(limit)
            .select('name description price category');
    }

    // Calculate cosine similarity
    const productsWithScores = products.map(product => {
        const similarity = cosineSimilarity(queryEmbedding, product.embedding);
        return {
            product: {
                _id: product._id,
                name: product.name,
                description: product.description,
                price: product.price,
                category: product.category
            },
            similarity
        };
    });

    // Sort by similarity and return top results
    productsWithScores.sort((a, b) => b.similarity - a.similarity);

    return productsWithScores.slice(0, limit).map(item => ({
        ...item.product,
        relevanceScore: item.similarity
    }));
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
        return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
        return 0;
    }

    return dotProduct / (normA * normB);
}

/**
 * Check if embedding service is available
 */
export function isEmbeddingAvailable() {
    return !!process.env.GOOGLE_AI_API_KEY;
}
