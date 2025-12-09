import { models } from '../models/index.js';

class NotificationService {
  /**
   * Создает напоминание о пополнении цели, если аналогичное непрочитанное уже не существует.
   * @param {{id:number,title:string,periodicityDays:string,createdAt:Date,userId:number}} goal
   * @param {number} daysSinceLastDeposit
   * @param {string|null} nextDepositDate
   */
  async ensureGoalTopUpNotification(goal, daysSinceLastDeposit, nextDepositDate) {
    const existing = await models.Notification.findOne({
      where: {
        userId: goal.userId,
        goalId: goal.id,
        type: 'goal_topup',
        isRead: false
      }
    });

    if (existing) {
      return existing;
    }

    return models.Notification.create({
      userId: goal.userId,
      goalId: goal.id,
      type: 'goal_topup',
      title: 'Пора пополнить цель',
      message: this._buildMessage(goal, daysSinceLastDeposit, nextDepositDate)
    });
  }

  /**
   * Возвращает непрочитанные уведомления пользователя.
   * @param {number} userId
   */
  async getUnread(userId) {
    return models.Notification.findAll({
      where: { userId, isRead: false },
      order: [['createdAt', 'DESC']]
    });
  }

  /**
   * Помечает уведомления как прочитанные.
   * @param {number} userId
   * @param {number[]} ids
   */
  async markAsRead(userId, ids = []) {
    if (!ids.length) return 0;
    const [count] = await models.Notification.update(
      { isRead: true },
      { where: { userId, id: ids } }
    );
    return count;
  }

  _buildMessage(goal, daysSinceLastDeposit, nextDepositDate) {
    const days = parseInt(goal.periodicityDays || '7', 10) || 7;
    const parts = [
      `Цель "${goal.title}" требует пополнения каждые ${days} дн.`
    ];

    if (nextDepositDate) {
      parts.push(`Рекомендовано пополнить до ${nextDepositDate}.`);
    }

    return parts.join(' ');
  }
}

export const notificationService = new NotificationService();

