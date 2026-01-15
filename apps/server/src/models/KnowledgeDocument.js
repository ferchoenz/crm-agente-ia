import mongoose from 'mongoose';

/**
 * Knowledge Document Model
 * Stores company documents with embeddings for RAG
 */
const knowledgeDocumentSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },

    // Document info
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    type: {
        type: String,
        enum: ['pdf', 'text', 'faq', 'policy', 'service', 'other'],
        default: 'other'
    },
    category: {
        type: String,
        enum: ['general', 'productos', 'servicios', 'politicas', 'faq', 'empresa'],
        default: 'general'
    },

    // Original file info
    originalFileName: String,
    fileSize: Number,
    filePath: String,

    // Processed content
    rawContent: {
        type: String,
        required: true
    },

    // Chunks with embeddings
    chunks: [{
        content: {
            type: String,
            required: true
        },
        embedding: {
            type: [Number],
            default: []
        },
        tokenCount: Number,
        chunkIndex: Number
    }],

    // Processing status
    status: {
        type: String,
        enum: ['pending', 'processing', 'ready', 'error'],
        default: 'pending'
    },
    errorMessage: String,

    // Stats
    totalChunks: {
        type: Number,
        default: 0
    },
    totalTokens: {
        type: Number,
        default: 0
    },

    // Metadata
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Index for vector search (if using MongoDB Atlas)
knowledgeDocumentSchema.index({ 'chunks.embedding': '2dsphere' });

/**
 * Find relevant chunks across all documents for an organization
 */
knowledgeDocumentSchema.statics.findRelevantChunks = async function (organizationId, queryEmbedding, limit = 5) {
    const documents = await this.find({
        organization: organizationId,
        status: 'ready',
        isActive: true
    }).select('title chunks category');

    const allChunks = [];

    for (const doc of documents) {
        for (const chunk of doc.chunks) {
            if (chunk.embedding && chunk.embedding.length > 0) {
                const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
                allChunks.push({
                    documentId: doc._id,
                    documentTitle: doc.title,
                    category: doc.category,
                    content: chunk.content,
                    similarity
                });
            }
        }
    }

    // Sort by similarity and return top results
    allChunks.sort((a, b) => b.similarity - a.similarity);
    return allChunks.slice(0, limit);
};

/**
 * Calculate cosine similarity
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

export const KnowledgeDocument = mongoose.model('KnowledgeDocument', knowledgeDocumentSchema);
