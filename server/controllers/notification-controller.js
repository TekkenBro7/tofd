import { notificationService } from '../services/notification-service.js';

/**
 * @import {Request, Response, NextFunction} from "express"
 */
class NotificationController {
  /**
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async getUnread(req, res, next) {
    try {
      const userId = req.user.id;
      const notifications = await notificationService.getUnread(userId);
      return res.status(200).json(notifications);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async markRead(req, res, next) {
    try {
      const userId = req.user.id;
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      await notificationService.markAsRead(userId, ids);
      return res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();

