import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },

    // Item type: product or service
    itemType: {
        type: String,
        enum: ['product', 'service'],
        default: 'product'
    },

    // Basic info
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    shortDescription: {
        type: String,
        trim: true,
        maxlength: 200
    },
    sku: {
        type: String,
        trim: true
    },

    // Pricing
    price: {
        type: Number,
        required: function () { return this.pricingType === 'fixed'; },
        min: 0
    },
    compareAtPrice: {
        type: Number,
        min: 0
    },
    currency: {
        type: String,
        default: 'MXN'
    },

    // Flexible pricing for services
    pricingType: {
        type: String,
        enum: ['fixed', 'from', 'range', 'quote'],  // quote = "cotizar"
        default: 'fixed'
    },
    priceFrom: {
        type: Number,
        min: 0
    },
    priceRange: {
        min: { type: Number, min: 0 },
        max: { type: Number, min: 0 }
    },
    priceFactors: [{
        type: String,
        trim: true
    }],  // e.g., ["project complexity", "number of pages"]

    // Service-specific fields
    duration: {
        type: String,
        trim: true
    },  // e.g., "2-4 weeks", "per hour"
    deliverables: [{
        type: String,
        trim: true
    }],  // What the service includes

    // Inventory
    available: {
        type: Boolean,
        default: true
    },
    stock: {
        type: Number,
        default: -1 // -1 means unlimited/not tracking
    },
    trackInventory: {
        type: Boolean,
        default: false
    },

    // Categorization
    category: {
        type: String,
        trim: true
    },
    subcategory: {
        type: String,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],

    // Media
    images: [{
        url: String,
        alt: String,
        isPrimary: { type: Boolean, default: false }
    }],

    // Variants (for products with options like size, color)
    variants: [{
        name: String,
        sku: String,
        price: Number,
        stock: Number,
        available: { type: Boolean, default: true },
        attributes: {
            type: Map,
            of: String
        }
    }],

    // Attributes (flexible key-value pairs)
    attributes: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },

    // SEO / Display
    slug: {
        type: String,
        trim: true
    },

    // Vector embedding for RAG search
    embedding: {
        type: [Number],
        select: false // Don't return by default (large field)
    },
    embeddingModel: {
        type: String,
        default: 'text-embedding-3-small'
    },
    embeddingUpdatedAt: Date,

    // For catalog messages
    catalogData: {
        whatsappProductId: String,
        facebookProductId: String
    },

    // Metrics
    stats: {
        views: { type: Number, default: 0 },
        inquiries: { type: Number, default: 0 },
        sales: { type: Number, default: 0 }
    },

    // Status
    status: {
        type: String,
        enum: ['draft', 'active', 'archived'],
        default: 'active'
    },

    // Ordering
    sortOrder: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes for multi-tenant and search
productSchema.index({ organization: 1, status: 1 });
productSchema.index({ organization: 1, category: 1 });
productSchema.index({ organization: 1, sku: 1 }, { sparse: true });
productSchema.index({ organization: 1, slug: 1 }, { sparse: true });
productSchema.index({ organization: 1, available: 1 });
productSchema.index({ organization: 1, tags: 1 });
productSchema.index({ organization: 1, name: 'text', description: 'text' });

// Generate slug from name
productSchema.pre('save', function (next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
    next();
});

// Generate text for embedding
productSchema.methods.getEmbeddingText = function () {
    const parts = [
        this.name,
        this.description,
        this.category,
        this.subcategory,
        ...(this.tags || [])
    ].filter(Boolean);

    return parts.join(' ');
};

// Format price for display (used by AI agent)
productSchema.methods.formatPriceForDisplay = function () {
    const currency = this.currency || 'MXN';
    const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency });

    switch (this.pricingType) {
        case 'from':
            return `Desde ${formatter.format(this.priceFrom || this.price)}`;
        case 'range':
            if (this.priceRange?.min && this.priceRange?.max) {
                return `${formatter.format(this.priceRange.min)} - ${formatter.format(this.priceRange.max)}`;
            }
            return 'Precio variable';
        case 'quote':
            const factors = this.priceFactors?.length
                ? ` (depende de: ${this.priceFactors.join(', ')})`
                : '';
            return `Cotizar${factors}`;
        case 'fixed':
        default:
            return formatter.format(this.price || 0);
    }
};

// Check stock availability
productSchema.methods.isInStock = function (quantity = 1) {
    if (!this.trackInventory) return this.available;
    return this.available && this.stock >= quantity;
};

// Decrement stock
productSchema.methods.decrementStock = async function (quantity = 1) {
    if (this.trackInventory && this.stock > 0) {
        this.stock = Math.max(0, this.stock - quantity);
        if (this.stock === 0) {
            this.available = false;
        }
        await this.save();
    }
};

export const Product = mongoose.model('Product', productSchema);
