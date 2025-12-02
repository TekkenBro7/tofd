import { models } from '../models/index.js';
import { ApiError } from '../exceptions/api-error.js';


class GoalService {

  /**
   * @param {number} userId
   * @param {{ title: string, targetAmount: string, deadline: string, periodicityDays?: string|number }} data
   */
  async createGoal(userId, data) {
    const { title, targetAmount, deadline, periodicityDays } = data;

    const existingActiveGoal = await models.Goal.findOne({
      where: {
        userId,
        status: 'active'
      }
    });

    if (existingActiveGoal) {
      throw ApiError.BadRequest('У вас уже есть активная цель');
    }

    const goal = await models.Goal.create({
      userId,
      title,
      status: 'active',
      targetAmount,
      accumulatedAmount: '0',
      deadline: new Date(deadline),
      periodicityDays: this._normalizePeriodicity(periodicityDays)
    });

    return this._mapGoal(goal);
  }

  /**
   * @param {number} userId
   */
  async getActiveGoal(userId) {
    const goal = await models.Goal.findOne({
      where: {
        userId,
        status: 'active'
      }
    });

    if (!goal) {
      return null;
    }

    return this._mapGoal(goal);
  }

  /**
   * @param {number} userId
   */
  async cancelActiveGoal(userId) {
    const goal = await models.Goal.findOne({
      where: {
        userId,
        status: 'active'
      }
    });

    if (!goal) {
      throw ApiError.BadRequest('Активная цель не найдена');
    }

    await goal.update({ status: 'cancelled' });

    return this._mapGoal(goal);
  }

  _mapGoal(goalInstance) {
    const goal = goalInstance.toJSON();

    return {
      id: goal.id,
      title: goal.title,
      status: goal.status,
      targetAmount: goal.targetAmount,
      accumulatedAmount: goal.accumulatedAmount,
      deadline: goal.deadline.toISOString(),
      periodicityDays: goal.periodicityDays
    };
  }

  /**
   * @param {string|number|undefined} periodicity
   */
  _normalizePeriodicity(periodicity) {
    if (periodicity === undefined || periodicity === null || periodicity === '') {
      return '7';
    }
    return periodicity.toString();
  }
}


export const goalService = new GoalService();


