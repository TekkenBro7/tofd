import { goalService } from '../services/goal-service.js';


/**
 * @import {Request, Response, NextFunction} from "express"
 */

class GoalController {

  /**
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async createGoal(req, res, next) {
    try {
      const userId = req.user.id;
      const { title, targetAmount, deadline, periodicityDays } = req.body;

      const goal = await goalService.createGoal(userId, {
        title,
        targetAmount,
        deadline,
        periodicityDays
      });

      return res.status(201).json(goal);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} res
   */
  async getActiveGoal(req, res, next) {
    try {
      const userId = req.user.id;
      const goal = await goalService.getActiveGoal(userId);

      return res.status(200).json(goal);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} res
   */
  async cancelGoal(req, res, next) {
    try {
      const userId = req.user.id;
      const goal = await goalService.cancelActiveGoal(userId);

      return res.status(200).json(goal);
    } catch (error) {
      next(error);
    }
  }
}


export const goalController = new GoalController();


