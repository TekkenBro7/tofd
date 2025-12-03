import { syncService } from '../services/sync-service.js';
import { achievementService } from '../services/achievement-service.js';


/**
 * @import {Request, Response, NextFunction} from "express"
 */

class SyncController {

  /**
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async confirmDeposit(req, res, next) {
    try {
      const userId = req.user.id;
      const { signature } = req.body;

      const result = await syncService.confirmDeposit(userId, signature);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async confirmWithdraw(req, res, next) {
    try {
      const userId = req.user.id;
      const { signature } = req.body;

      const result = await syncService.confirmWithdraw(userId, signature);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

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


