import multer from 'multer';
import {
    processDocument,
    getDocuments,
    deleteDocument,
    toggleDocumentActive,
    extractTextFromPDF
} from '../../services/knowledge.service.js';
import { KnowledgeDocument } from '../../models/KnowledgeDocument.js';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'text/plain'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos PDF y TXT'));
        }
    }
});

export const uploadMiddleware = upload.single('file');

/**
 * Get all knowledge documents
 */
export async function listDocuments(req, res) {
    try {
        const documents = await getDocuments(req.user.organization);
        res.json({ documents });
    } catch (error) {
        console.error('Error listing documents:', error);
        res.status(500).json({ error: 'Error al obtener documentos' });
    }
}

/**
 * Get a single document
 */
export async function getDocument(req, res) {
    try {
        const document = await KnowledgeDocument.findOne({
            _id: req.params.id,
            organization: req.user.organization
        }).select('-chunks.embedding');

        if (!document) {
            return res.status(404).json({ error: 'Documento no encontrado' });
        }

        res.json({ document });
    } catch (error) {
        console.error('Error getting document:', error);
        res.status(500).json({ error: 'Error al obtener documento' });
    }
}

/**
 * Upload and process a new document
 */
export async function uploadDocument(req, res) {
    try {
        const { title, description, type, category } = req.body;
        let content = '';

        if (req.file) {
            // Handle file upload
            if (req.file.mimetype === 'application/pdf') {
                content = await extractTextFromPDF(req.file.buffer);
            } else {
                content = req.file.buffer.toString('utf-8');
            }
        } else if (req.body.content) {
            // Handle text content
            content = req.body.content;
        } else {
            return res.status(400).json({ error: 'Se requiere un archivo o contenido de texto' });
        }

        if (!content || content.trim().length < 50) {
            return res.status(400).json({ error: 'El contenido es muy corto (mínimo 50 caracteres)' });
        }

        const document = await processDocument({
            organizationId: req.user.organization,
            title: title || req.file?.originalname || 'Sin título',
            description,
            type: type || (req.file?.mimetype === 'application/pdf' ? 'pdf' : 'text'),
            category: category || 'general',
            content,
            originalFileName: req.file?.originalname,
            fileSize: req.file?.size,
            createdBy: req.user._id
        });

        res.status(201).json({
            message: 'Documento subido. Procesando...',
            document: {
                _id: document._id,
                title: document.title,
                status: document.status
            }
        });
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ error: error.message || 'Error al procesar documento' });
    }
}

/**
 * Create document from text
 */
export async function createTextDocument(req, res) {
    try {
        const { title, content, description, category } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Se requiere título y contenido' });
        }

        if (content.trim().length < 50) {
            return res.status(400).json({ error: 'El contenido es muy corto (mínimo 50 caracteres)' });
        }

        const document = await processDocument({
            organizationId: req.user.organization,
            title,
            description,
            type: 'text',
            category: category || 'general',
            content,
            createdBy: req.user._id
        });

        res.status(201).json({
            message: 'Documento creado. Procesando...',
            document: {
                _id: document._id,
                title: document.title,
                status: document.status
            }
        });
    } catch (error) {
        console.error('Error creating document:', error);
        res.status(500).json({ error: 'Error al crear documento' });
    }
}

/**
 * Delete a document
 */
export async function removeDocument(req, res) {
    try {
        const deleted = await deleteDocument(req.params.id, req.user.organization);

        if (!deleted) {
            return res.status(404).json({ error: 'Documento no encontrado' });
        }

        res.json({ message: 'Documento eliminado' });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ error: 'Error al eliminar documento' });
    }
}

/**
 * Toggle document active status
 */
export async function toggleActive(req, res) {
    try {
        const { isActive } = req.body;

        const document = await toggleDocumentActive(
            req.params.id,
            req.user.organization,
            isActive
        );

        if (!document) {
            return res.status(404).json({ error: 'Documento no encontrado' });
        }

        res.json({ document });
    } catch (error) {
        console.error('Error toggling document:', error);
        res.status(500).json({ error: 'Error al actualizar documento' });
    }
}

/**
 * Get document processing status
 */
export async function getDocumentStatus(req, res) {
    try {
        const document = await KnowledgeDocument.findOne({
            _id: req.params.id,
            organization: req.user.organization
        }).select('status totalChunks totalTokens errorMessage');

        if (!document) {
            return res.status(404).json({ error: 'Documento no encontrado' });
        }

        res.json({ document });
    } catch (error) {
        console.error('Error getting document status:', error);
        res.status(500).json({ error: 'Error al obtener estado' });
    }
}
