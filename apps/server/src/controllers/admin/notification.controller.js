import { Notification } from '../../models/Notification.js';

/**
 * Get user notifications
 */
export async function getNotifications(req, res) {
    try {
        const { limit = 20, unreadOnly = false } = req.query;

        const query = {
            organization: req.user.organization,
            $or: [
                { user: req.user._id },
                { user: null } // Broadcast notifications
            ]
        };

        if (unreadOnly === 'true') {
            query.read = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('relatedConversation', 'customer')
            .populate('relatedCustomer', 'name phone')
            .lean();

        const unreadCount = await Notification.getUnreadCount(
            req.user._id,
            req.user.organization
        );

        res.json({ notifications, unreadCount });
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({ error: 'Error al obtener notificaciones' });
    }
}

/**
 * Mark notification as read
 */
export async function markAsRead(req, res) {
    try {
        const notification = await Notification.markAsRead(
            req.params.id,
            req.user._id
        );

        if (!notification) {
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }

        res.json({ notification });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Error al marcar como leída' });
    }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(req, res) {
    try {
        await Notification.markAllAsRead(req.user._id, req.user.organization);
        res.json({ message: 'Todas las notificaciones marcadas como leídas' });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ error: 'Error al marcar todas como leídas' });
    }
}

/**
 * Get unread count
 */
export async function getUnreadCount(req, res) {
    try {
        const count = await Notification.getUnreadCount(
            req.user._id,
            req.user.organization
        );
        res.json({ count });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ error: 'Error al obtener contador' });
    }
}

/**
 * Create notification (helper function)
 */
export async function createNotification({
    organizationId,
    userId = null,
    type,
    title,
    message,
    relatedConversation = null,
    relatedCustomer = null,
    priority = 'normal',
    actionUrl = null
}) {
    try {
        const notification = new Notification({
            organization: organizationId,
            user: userId,
            type,
            title,
            message,
            relatedConversation,
            relatedCustomer,
            priority,
            actionUrl
        });

        await notification.save();
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
}
