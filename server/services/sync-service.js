import { models } from '../models/index.js';
import { goalService } from './goal-service.js';
import { achievementService } from './achievement-service.js';
import { solanaService } from './solana-service.js';
import { Goal } from '../models/goal.js';
import { ApiError } from '../exceptions/api-error.js';


class SyncService {

  /**
   * @param {number} userId
   * @param {string} signature
   */
  async confirmDeposit(userId, signature) {
    const activeGoal = await goalService.getActiveGoal(userId);

    if (!activeGoal) {
      throw ApiError.BadRequest('У вас нет активной цели для пополнения или она уже завершена');
    }

    const { amount } = await solanaService.verifySignature(signature);

    const stats = await achievementService.handleDeposit(userId);

    const lamportsToAdd = BigInt(amount); 
    
    const currentAmount = BigInt(activeGoal.accumulatedAmount || '0');
    const targetAmount = BigInt(activeGoal.targetAmount || '0');
    
    const newTotalBigInt = currentAmount + lamportsToAdd;
    const newAmountStr = newTotalBigInt.toString();

    const goalReached = newTotalBigInt >= targetAmount;

    const updateData = { 
      accumulatedAmount: newAmountStr
    };

    if (goalReached) {
      updateData.status = 'completed';
    }

    await Goal.update(
      updateData,
      { where: { id: activeGoal.id } }
    );

    return {
      isCompleted: goalReached ? 'true' : 'false',
      rating: stats.rating,
      achievements: stats.achievements
    };
  }

  /**
   * @param {number} userId
   * @param {string} signature
   */
  async confirmWithdraw(userId, signature) {
    const { amount } = await solanaService.verifySignature(signature);

    const activeGoal = await goalService.getActiveGoal(userId);
    const now = new Date();

    let stats;

    if (activeGoal) {
      const deadlineDate = new Date(activeGoal.deadline);
      if (deadlineDate.getTime() > now.getTime()) {
        await achievementService.handleEarlyWithdraw(userId);
      }

      await Goal.update(
        { accumulatedAmount: '0' },
        { where: { id: activeGoal.id } }
      );
    }

    stats = await achievementService.getStats(userId);

    const isCompleted = !activeGoal || activeGoal.status === 'completed';    

    return {
      isCompleted: isCompleted ? 'true' : 'false',
      rating: stats.rating,
      achievements: stats.achievements
    };
  }

}


export const syncService = new SyncService();


