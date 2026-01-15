import { KnowledgeDocument } from '../models/KnowledgeDocument.js';
import { generateEmbedding } from './ai/embedding.service.js';
import { logger } from '../utils/logger.js';
import { createRequire } from 'module';

// pdf-parse is CommonJS, need to use require
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * Knowledge Base Service
 * Handles document processing, chunking, and embedding generation
 */

const CHUNK_SIZE = 500; // tokens (approximately)
const CHUNK_OVERLAP = 50; // tokens overlap between chunks

/**
 * Process and store a new document
 */
export async function processDocument({
    organizationId,
    title,
    content,
    type = 'text',
    category = 'general',
    description = '',
    originalFileName = null,
    fileSize = null,
    createdBy = null
}) {
    try {
        // Create document record
        const document = new KnowledgeDocument({
            organization: organizationId,
            title,
            description,
            type,
            category,
            originalFileName,
            fileSize,
            rawContent: content,
            status: 'processing',
            createdBy
        });
        await document.save();

        // Process in background
        processDocumentAsync(document._id, content).catch(err => {
            logger.error(`Failed to process document ${document._id}:`, err);
        });

        return document;
    } catch (error) {
        logger.error('Error creating knowledge document:', error);
        throw error;
    }
}

/**
 * Async processing of document
 */
async function processDocumentAsync(documentId, content) {
    try {
        // Split content into chunks
        const chunks = splitIntoChunks(content);

        logger.info(`Processing document ${documentId}: ${chunks.length} chunks`);

        const processedChunks = [];
        let totalTokens = 0;

        for (let i = 0; i < chunks.length; i++) {
            const chunkContent = chunks[i];
            const tokenCount = Math.ceil(chunkContent.length / 4); // Rough estimate
            totalTokens += tokenCount;

            try {
                // Generate embedding for chunk
                const embedding = await generateEmbedding(chunkContent);

                processedChunks.push({
                    content: chunkContent,
                    embedding,
                    tokenCount,
                    chunkIndex: i
                });

                // Small delay to avoid rate limits
                if (i < chunks.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } catch (embeddingError) {
                logger.warn(`Failed to embed chunk ${i} of document ${documentId}:`, embeddingError.message);
                // Still add chunk without embedding
                processedChunks.push({
                    content: chunkContent,
                    embedding: [],
                    tokenCount,
                    chunkIndex: i
                });
            }
        }

        // Update document with chunks
        await KnowledgeDocument.findByIdAndUpdate(documentId, {
            chunks: processedChunks,
            totalChunks: processedChunks.length,
            totalTokens,
            status: 'ready'
        });

        logger.info(`Document ${documentId} processed successfully: ${processedChunks.length} chunks, ${totalTokens} tokens`);

    } catch (error) {
        logger.error(`Error processing document ${documentId}:`, error);
        await KnowledgeDocument.findByIdAndUpdate(documentId, {
            status: 'error',
            errorMessage: error.message
        });
    }
}

/**
 * Split text into chunks with overlap
 */
function splitIntoChunks(text) {
    const chunks = [];
    const sentences = text.split(/(?<=[.!?])\s+/);

    let currentChunk = '';
    let currentTokens = 0;

    for (const sentence of sentences) {
        const sentenceTokens = Math.ceil(sentence.length / 4);

        if (currentTokens + sentenceTokens > CHUNK_SIZE && currentChunk) {
            chunks.push(currentChunk.trim());

            // Keep some overlap
            const words = currentChunk.split(' ');
            const overlapWords = words.slice(-Math.ceil(CHUNK_OVERLAP / 4));
            currentChunk = overlapWords.join(' ') + ' ' + sentence;
            currentTokens = Math.ceil(currentChunk.length / 4);
        } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
            currentTokens += sentenceTokens;
        }
    }

    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

/**
 * Search for relevant knowledge chunks
 */
export async function searchKnowledge(organizationId, query, limit = 5) {
    try {
        // Generate embedding for query
        const queryEmbedding = await generateEmbedding(query);

        // Find relevant chunks
        const relevantChunks = await KnowledgeDocument.findRelevantChunks(
            organizationId,
            queryEmbedding,
            limit
        );

        return relevantChunks;
    } catch (error) {
        logger.error('Error searching knowledge:', error);
        return [];
    }
}

/**
 * Get all documents for an organization
 */
export async function getDocuments(organizationId) {
    return KnowledgeDocument.find({ organization: organizationId })
        .select('-chunks -rawContent')
        .sort({ createdAt: -1 });
}

/**
 * Delete a document
 */
export async function deleteDocument(documentId, organizationId) {
    const result = await KnowledgeDocument.deleteOne({
        _id: documentId,
        organization: organizationId
    });
    return result.deletedCount > 0;
}

/**
 * Toggle document active status
 */
export async function toggleDocumentActive(documentId, organizationId, isActive) {
    return KnowledgeDocument.findOneAndUpdate(
        { _id: documentId, organization: organizationId },
        { isActive },
        { new: true }
    ).select('-chunks -rawContent');
}

/**
 * Extract text from PDF buffer
 */
export async function extractTextFromPDF(buffer) {
    try {
        const data = await pdfParse(buffer);
        return data.text;
    } catch (error) {
        logger.error('Error parsing PDF:', error);
        throw new Error('No se pudo procesar el PDF. Asegúrate de que sea un archivo válido.');
    }
}
