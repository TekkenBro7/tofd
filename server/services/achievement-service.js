import { models } from '../models/index.js';
import { ACHIEVEMENTS } from './achievements-config.js';


class AchievementService {

  /**
   * @param {number} userId
   * @param {string} code
   */
  async addAchievement(userId, code) {
    const achievement = ACHIEVEMENTS[code];
    if (!achievement) {
      return await this.getStats(userId);
    }

    const stats = await this._getOrCreateStats(userId);
    const achievements = this._parseAchievements(stats.achievements);

    if (!achievements.includes(code)) {
      achievements.push(code);
      const currentRating = parseInt(stats.rating || '0', 10);
      stats.rating = (currentRating + achievement.points).toString();
      stats.achievements = achievements.join(',');
      await stats.save();
    }

    await this._checkRatingMilestones(stats);
    return this._formatStats(stats);
  }

  /**
   * Ачивка FG: первая цель
   * @param {number} userId
   */
  async handleGoalCreated(userId) {
    const goalsCount = await models.Goal.count({ where: { userId } });
    if (goalsCount === 1) {
      await this.addAchievement(userId, 'FG');
    }
  }

  /**
   * Ачивка EW: сорвался (вывод до достижения цели)
   * @param {number} userId
   */
  async handleEarlyWithdraw(userId) {
    await this.addAchievement(userId, 'EW');
  }

  /**
   * Вернуть текущие stats (с уже распарсенными ачивками)
   * @param {number} userId
   */
  async getStats(userId) {
    const stats = await this._getOrCreateStats(userId);
    return this._formatStats(stats);
  }

  /**
   * Обработка депозита: стрики, ночные/крупные/быстрые вклады и т.д.
   * @param {number} userId
   * @param {{ amountSol?: number, now?: Date }} options
   */
  async handleDeposit(userId, options = {}) {
    const now = options.now || new Date();
    const amountSol = options.amountSol;

    const stats = await this._getOrCreateStats(userId);
    const moscowNow = this._getMoscowDate(now);
    const today = moscowNow.date;
    const hour = moscowNow.hour;

    // Обновляем стрик по дням
    const prevDate = stats.lastDepositDate;
    let streak = stats.streakDays || 0;

    if (!prevDate) {
      streak = 1;
    } else if (prevDate === today) {
      // депозит в тот же день — стрик не меняем
    } else if (this._isNextDay(prevDate, today)) {
      streak += 1;
    } else {
      streak = 1;
    }

    stats.streakDays = streak;
    stats.lastDepositDate = today;
    await stats.save();

    // 7D / 30D стрики
    if (streak >= 7) {
      await this.addAchievement(userId, '7D');
    }
    if (streak >= 30) {
      await this.addAchievement(userId, '30D');
    }

    // Ночной вкладчик (00:00-05:59 МСК)
    if (hour >= 0 && hour < 6) {
      await this.addAchievement(userId, 'NIGHT');
    }

    // Крупный вклад (>= 5 SOL)
    if (typeof amountSol === 'number' && amountSol >= 5) {
      await this.addAchievement(userId, 'BIG');
    }

    // Молниеносный старт (первый депозит в течение 5 минут после создания цели)
    const activeGoal = await models.Goal.findOne({
      where: { userId, status: 'active' }
    });
    if (activeGoal && activeGoal.createdAt) {
      const createdAtMs = new Date(activeGoal.createdAt).getTime();
      const nowMs = now.getTime();
      const diffMinutes = (nowMs - createdAtMs) / (60 * 1000);

      const currentStats = await this._getOrCreateStats(userId);
      const achievements = this._parseAchievements(currentStats.achievements);
      if (diffMinutes <= 5 && !achievements.includes('FAST')) {
        await this.addAchievement(userId, 'FAST');
      }
    }

    return this.getStats(userId);
  }

  /**
   * Увеличиваем счетчик завершенных целей и проверяем SV/PG
   * @param {number} userId
   */
  async handleGoalCompleted(userId) {
    const stats = await this._getOrCreateStats(userId);

    stats.completedGoals = (stats.completedGoals || 0) + 1;
    await stats.save();

    if (stats.completedGoals === 1) {
      await this.addAchievement(userId, 'PG');
    }

    if (stats.completedGoals >= 5) {
      await this.addAchievement(userId, 'SV');
    }

    return this.getStats(userId);
  }

  async _getOrCreateStats(userId) {
    let stats = await models.UserStats.findByPk(userId);
    if (!stats) {
      stats = await models.UserStats.create({
        userId,
        rating: '0',
        achievements: ''
      });
    }
    return stats;
  }

  _parseAchievements(raw) {
    if (!raw) {
      return [];
    }
    return raw.split(',').filter(Boolean);
  }

  _formatStats(statsInstance) {
    const stats = statsInstance.toJSON();
    const achievements = this._parseAchievements(stats.achievements);

    return {
      rating: stats.rating,
      achievements
    };
  }

  _getMoscowDate(date) {
    // Используем Intl для получения времени в зоне Europe/Moscow
    const formatter = new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Europe/Moscow',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const parts = formatter.formatToParts(date);
    const get = (type) => parts.find(p => p.type === type)?.value;

    const year = get('year');
    const month = get('month');
    const day = get('day');
    const hour = parseInt(get('hour') || '0', 10);

    return {
      date: `${year}-${month}-${day}`, // YYYY-MM-DD
      hour
    };
  }

  _isNextDay(prev, current) {
    const [py, pm, pd] = prev.split('-').map(Number);
    const [cy, cm, cd] = current.split('-').map(Number);

    const prevDate = new Date(Date.UTC(py, pm - 1, pd));
    const currDate = new Date(Date.UTC(cy, cm - 1, cd));

    const diffDays = (currDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000);
    return diffDays === 1;
  }

  async _checkRatingMilestones(statsInstance) {
    const stats = statsInstance;
    const rating = parseInt(stats.rating || '0', 10);
    const achievements = this._parseAchievements(stats.achievements);

    const toAdd = [];
    if (rating >= 100 && !achievements.includes('R100')) {
      toAdd.push('R100');
    }
    if (rating >= 500 && !achievements.includes('R500')) {
      toAdd.push('R500');
    }

    if (toAdd.length === 0) {
      return;
    }

    let delta = 0;
    for (const code of toAdd) {
      const achievement = ACHIEVEMENTS[code];
      if (achievement) {
        delta += achievement.points;
        achievements.push(code);
      }
    }

    stats.rating = (rating + delta).toString();
    stats.achievements = achievements.join(',');
    await stats.save();
  }
}


export const achievementService = new AchievementService();


