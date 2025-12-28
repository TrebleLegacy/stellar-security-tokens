import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { NotificationController } from '../controllers/notificationController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// Get notifications (infers user type from token)
router.get('/', NotificationController.getNotifications);

// Mark as read
router.put('/:id/read', NotificationController.markAsRead);

// Mark all as read
router.put('/read-all', NotificationController.markAllAsRead);

export default router;
