import express from 'express';
import { param } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import { NotificationController } from '../controllers/notificationController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateToken);

// Get notifications (infers user type from token)
router.get('/', NotificationController.getNotifications);

// Mark as read
router.put('/:id/read',
    param('id').isInt({ min: 1 }).withMessage('Notification ID must be a positive integer'),
    validate,
    NotificationController.markAsRead
);

// Mark all as read
router.put('/read-all', NotificationController.markAllAsRead);

export default router;
