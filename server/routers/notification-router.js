import { Router } from 'express';
import { notificationController } from '../controllers/notification-controller.js';
import authMiddleware from '../middlewares/auth-middleware.js';

const notificationRouter = Router();

notificationRouter.get('/notifications', authMiddleware, notificationController.getUnread);
notificationRouter.post('/notifications/read', authMiddleware, notificationController.markRead);

export { notificationRouter };

