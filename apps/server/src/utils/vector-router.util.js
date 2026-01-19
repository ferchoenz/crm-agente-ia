
import { generateEmbedding } from '../services/ai/embedding.service.js';
import { logger } from '../utils/logger.js';

/**
 * Calculate cosine similarity between two vectors
 * Inline implementation to avoid external dependency
 */
function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Semantic Router Utility
 * Classifies text intent using vector embeddings
 */
export class VectorRouter {
    constructor() {
        this.routes = [];
        this.initialized = false;
    }

    /**
     * Define a route with anchor phrases
     * @param {string} name - Route name (e.g., 'objection', 'purchase')
     * @param {string[]} phrases - Example phrases for this intent
     */
    async addRoute(name, phrases) {
        try {
            // Generate embedding for the concept (average of phrases)
            const embeddings = await Promise.all(phrases.map(p => generateEmbedding(p)));

            // Calculate centroid (average embedding)
            const centroid = this.calculateCentroid(embeddings);

            this.routes.push({
                name,
                embedding: centroid,
                phrases
            });

            logger.info(`Added semantic route: ${name}`);
        } catch (error) {
            logger.error(`Failed to add route ${name}:`, error);
        }
    }

    /**
     * Initialize standard routes
     */
    async initializeRoutes() {
        if (this.initialized) return;

        // Route: Objection (Needs DeepSeek)
        await this.addRoute('objection', [
            "es muy caro", "el precio es alto", "lo voy a pensar",
            "necesito consultarlo", "no estoy seguro", "la competencia es mas barata",
            "no tengo presupuesto", "es mucho dinero"
        ]);

        // Route: Closing / Purchase (Needs Speed/Action)
        await this.addRoute('purchase', [
            "quiero comprar", "donde pago", "mándame el link",
            "me interesa", "lo quiero", "como procedemos",
            "acepto la oferta", "facturan?"
        ]);

        // Route: Support (Needs Knowledge Base)
        await this.addRoute('support', [
            "no funciona", "tengo un problema", "error",
            "ayuda con mi cuenta", "no me llego el correo",
            "como configuro x", "soporte tecnico"
        ]);

        // Route: Info/Greeting (Needs Speed - L1)
        await this.addRoute('greeting', [
            "hola", "buenos dias", "que tal", "info",
            "que horarios tienen", "donde estan ubicados"
        ]);

        this.initialized = true;
    }

    /**
     * Classify text into a route
     * @param {string} text - Input text
     * @param {number} threshold - Min similarity (0-1)
     */
    async classify(text, threshold = 0.75) {
        if (!this.initialized) await this.initializeRoutes();

        const inputEmbedding = await generateEmbedding(text);

        let bestMatch = { name: 'unknown', score: 0 };

        for (const route of this.routes) {
            const score = cosineSimilarity(inputEmbedding, route.embedding);
            if (score > bestMatch.score) {
                bestMatch = { name: route.name, score };
            }
        }

        return bestMatch.score >= threshold ? bestMatch : { name: 'unknown', score: bestMatch.score };
    }

    /**
     * Calculate centroid of multiple vectors
     */
    calculateCentroid(vectors) {
        if (!vectors.length) return [];
        const dim = vectors[0].length;
        const centroid = new Array(dim).fill(0);

        for (const vec of vectors) {
            for (let i = 0; i < dim; i++) {
                centroid[i] += vec[i];
            }
        }

        return centroid.map(val => val / vectors.length);
    }
}

// Singleton
export const vectorRouter = new VectorRouter();
