import { achievementService } from '../services/achievement-service.js';


/**
 * @import {Request, Response, NextFunction} from "express"
 */

class SyncController {

  /**
   * Получить текущие статистики пользователя (рейтинг и ачивки)
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async getStats(req, res, next) {
    try {
      const userId = req.user.id;
      const stats = await achievementService.getStats(userId);

      return res.status(200).json(stats);
    } catch (error) {
      next(error);
    }
  }
}


export const syncController = new SyncController();


