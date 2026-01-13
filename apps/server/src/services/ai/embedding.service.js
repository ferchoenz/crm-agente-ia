import { OpenAIEmbeddings } from '@langchain/openai';
import { Product } from '../../models/index.js';
import { logger } from '../../utils/logger.js';

/**
 * Embedding Service for RAG
 * Generates and manages vector embeddings for products
 */

let embeddingsInstance = null;

/**
 * Get or create embeddings instance
 */
function getEmbeddings() {
    if (!embeddingsInstance) {
        embeddingsInstance = new OpenAIEmbeddings({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: 'text-embedding-3-small',
            dimensions: 1536
        });
    }
    return embeddingsInstance;
}

/**
 * Generate embedding for text
 */
export async function generateEmbedding(text) {
    const embeddings = getEmbeddings();
    const vector = await embeddings.embedQuery(text);
    return vector;
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
        product.embeddingModel = 'text-embedding-3-small';
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
