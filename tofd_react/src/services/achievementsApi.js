const API_URL = 'http://localhost:5000/api';

class AchievementsApi {
  // Получить статистику пользователя (рейтинг и ачивки)
  async getUserStats() {
    try {
      const accessToken = sessionStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Пользователь не авторизован');
      }

      const response = await fetch(`${API_URL}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Требуется авторизация');
        }
        throw new Error('Не удалось загрузить статистику');
      }

      return await response.json();
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
      throw error;
    }
  }

  // Получить уровень пользователя
  async getUserLevel() {
    try {
      const stats = await this.getUserStats();
      const rating = parseInt(stats.rating || '0', 10);
      const level = Math.floor(rating / 100) + 1;
      const xpInLevel = rating % 100;
      
      return {
        level,
        xp: rating,
        xpInLevel,
        xpToNextLevel: 100 - xpInLevel,
        progress: (xpInLevel / 100) * 100
      };
    } catch (error) {
      console.error('Ошибка получения уровня:', error);
      return {
        level: 1,
        xp: 0,
        xpInLevel: 0,
        xpToNextLevel: 100,
        progress: 0
      };
    }
  }

  // Выполнить достижение (если понадобится в будущем)
  async completeAchievement(achievementCode) {
    try {
      const accessToken = sessionStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('Пользователь не авторизован');
      }

      const response = await fetch(`${API_URL}/achievements/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        credentials: 'include',
        body: JSON.stringify({ code: achievementCode })
      });

      if (!response.ok) {
        throw new Error('Не удалось выполнить достижение');
      }

      return await response.json();
    } catch (error) {
      console.error('Ошибка выполнения достижения:', error);
      throw error;
    }
  }
}

export const achievementsApi = new AchievementsApi();
