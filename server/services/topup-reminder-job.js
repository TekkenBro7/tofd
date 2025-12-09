import { models } from '../models/index.js';
import { notificationService } from './notification-service.js';

class TopupReminderJob {
  constructor() {
    this.interval = null;
  }

  start(intervalMs = 20000) {  // 3600000
    if (this.interval) return;
    this.interval = setInterval(() => this.run().catch(console.error), intervalMs);
    this.run().catch(console.error);
  }

  async run() {
    const goals = await models.Goal.findAll({
      where: { status: 'active' }
    });

    for (const goal of goals) {
      const periodicityDays = parseInt(goal.periodicityDays || '7', 10) || 7;
      const stats = await models.UserStats.findByPk(goal.userId);

      let lastDepositDate = stats?.lastDepositDate || null;
      if (!lastDepositDate && goal.createdAt) {
        lastDepositDate = this._formatDate(goal.createdAt);
      }

      if (!lastDepositDate) {
        await notificationService.ensureGoalTopUpNotification(goal, null, null);
        continue;
      }

      const today = this._getMoscowDate(new Date());
      const daysSinceLast = Math.max(0, this._calculateDaysDiff(lastDepositDate, today));
      const nextDate = this._addDays(lastDepositDate, periodicityDays);

      if (daysSinceLast >= periodicityDays) {
        await notificationService.ensureGoalTopUpNotification(goal, daysSinceLast, nextDate);
      }

      // Для демонстрации
      await notificationService.ensureGoalTopUpNotification(goal, null, null);
    }
  }

  _getMoscowDate(date) {
    const formatter = new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Europe/Moscow',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;

    return `${year}-${month}-${day}`;
  }

  _calculateDaysDiff(fromDateStr, toDateStr) {
    const [fy, fm, fd] = fromDateStr.split('-').map(Number);
    const [ty, tm, td] = toDateStr.split('-').map(Number);

    const from = Date.UTC(fy, fm - 1, fd);
    const to = Date.UTC(ty, tm - 1, td);

    return Math.floor((to - from) / (24 * 60 * 60 * 1000));
  }

  _addDays(dateStr, daysToAdd) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    date.setUTCDate(date.getUTCDate() + daysToAdd);
    const year = date.getUTCFullYear();
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    const day = `${date.getUTCDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  _formatDate(date) {
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = `${d.getUTCMonth() + 1}`.padStart(2, '0');
    const day = `${d.getUTCDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export const topupReminderJob = new TopupReminderJob();

