// Application constants

export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    AGENT: 'agent',
    VIEWER: 'viewer'
};

export const PLANS = {
    FREE: 'free',
    BASIC: 'basic',
    PRO: 'pro',
    ENTERPRISE: 'enterprise'
};

export const PLAN_LIMITS = {
    [PLANS.FREE]: {
        messagesPerMonth: 100,
        products: 20,
        agents: 1,
        channels: 1
    },
    [PLANS.BASIC]: {
        messagesPerMonth: 1000,
        products: 100,
        agents: 3,
        channels: 2
    },
    [PLANS.PRO]: {
        messagesPerMonth: 10000,
        products: 500,
        agents: 10,
        channels: 5
    },
    [PLANS.ENTERPRISE]: {
        messagesPerMonth: -1, // Unlimited
        products: -1,
        agents: -1,
        channels: -1
    }
};

export const CHANNEL_TYPES = {
    WHATSAPP: 'whatsapp',
    FACEBOOK: 'facebook',
    MESSENGER: 'messenger',
    INSTAGRAM: 'instagram'
};

export const CONVERSATION_STATUS = {
    OPEN: 'open',
    PENDING: 'pending',
    RESOLVED: 'resolved',
    ARCHIVED: 'archived'
};

export const LEAD_STAGES = {
    NEW: 'new',
    CONTACTED: 'contacted',
    QUALIFIED: 'qualified',
    PROPOSAL: 'proposal',
    NEGOTIATION: 'negotiation',
    WON: 'won',
    LOST: 'lost'
};

export const MESSAGE_TYPES = {
    TEXT: 'text',
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio',
    DOCUMENT: 'document',
    LOCATION: 'location',
    CONTACT: 'contact',
    TEMPLATE: 'template',
    INTERACTIVE: 'interactive'
};

export const SENDER_TYPES = {
    CUSTOMER: 'customer',
    AI: 'ai',
    HUMAN: 'human',
    SYSTEM: 'system'
};

export const AI_INTENTS = {
    GREETING: 'greeting',
    INQUIRY: 'inquiry',
    COMPLAINT: 'complaint',
    PURCHASE: 'purchase',
    APPOINTMENT: 'appointment',
    HUMAN_HANDOFF: 'human_handoff',
    UNKNOWN: 'unknown'
};
