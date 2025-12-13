import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { achievementsApi } from '../../services/achievementsApi';
import { ACHIEVEMENTS_CONFIG, CATEGORIES } from '../../config/achievementsConfig';
import './AchievementsPage.css';

const AchievementsPage = () => {
  const [achievements, setAchievements] = useState([]);
  const [userStats, setUserStats] = useState({ rating: '0', achievements: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Получаем данные из Layout через контекст
  const { isAuthenticated } = useOutletContext() || {};

  // Загружаем достижения и статистику при монтировании
  useEffect(() => {
    if (isAuthenticated) {
      fetchAchievementsData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Загрузка всех данных
  const fetchAchievementsData = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Загружаем статистику пользователя
      const stats = await achievementsApi.getUserStats();
      setUserStats(stats);

      // 2. Рассчитываем уровень на основе рейтинга
      const rating = parseInt(stats.rating || '0', 10);
      const level = Math.floor(rating / 100) + 1;
      const xpToNextLevel = 100 - (rating % 100);

      // Сохраняем в контекст или локальное состояние
      localStorage.setItem('userLevel', level.toString());
      localStorage.setItem('userXP', rating.toString());
      localStorage.setItem('userRating', stats.rating || '0');

      // 3. Преобразуем конфиг достижений
      const backendAchievements = Object.values(ACHIEVEMENTS_CONFIG);

      // 4. Отмечаем выполненные достижения
      const userAchievementCodes = stats.achievements || [];
      const updatedAchievements = backendAchievements.map(achievement => ({
        ...achievement,
        completed: userAchievementCodes.includes(achievement.code),
        earnedXP: achievement.points,
        xp: Math.abs(achievement.points)
      }));

      setAchievements(updatedAchievements);

    } catch (err) {
      console.error('Ошибка загрузки достижений:', err);
      setError('Не удалось загрузить достижения. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  // Статистика достижений
  const completedCount = achievements.filter(a => a.completed).length;
  const totalXP = achievements
    .filter(a => a.completed)
    .reduce((sum, a) => sum + Math.max(0, a.points), 0);

  const categories = ['цели', 'пополнения', 'снятия', 'рейтинг', 'другие'];

  if (loading) {
    return (
      <div className="achievements-container">
        <div className="loading-spinner">
          <div className="spinner">⏳</div>
          <p>Загрузка достижений...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="achievements-container">
      <header className="page-header">
        <div className="header-content">
          <h1 className="page-title">Достижения</h1>
          <div className="user-stats">
            <div className="stat-item">
              <span className="stat-label">Выполнено:</span>
              <span className="stat-value">{completedCount}/{achievements.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Всего XP:</span>
              <span className="stat-value">{userStats.rating || '0'} XP</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Уровень:</span>
              <span className="stat-value">
                {Math.floor(parseInt(userStats.rating || '0', 10) / 100) + 1}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="page-main-content">
        <div className="welcome-section">
          <h2>Достижения!</h2>
          <p>Выполняйте достижения, чтобы получать опыт и повышать уровень</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="achievements-summary">
          <div className="summary-card">
            <div className="summary-icon">🏆</div>
            <div className="summary-info">
              <h3>Система достижений</h3>
              <p>Достижения начисляются автоматически при выполнении условий</p>
              <p className="summary-note">100 XP = 1 уровень</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">📊</div>
            <div className="summary-info">
              <h3>Ваш прогресс</h3>
              <p>Выполнено {completedCount} из {achievements.length} достижений</p>
              <p className="summary-note">Это {Math.round((completedCount / achievements.length) * 100)}% всех достижений</p>
            </div>
          </div>
        </div>

        {/* Категории достижений */}
        <div className="categories-section">
          <h3>Категории достижений</h3>
          <div className="categories-grid">
            {categories.map(category => {
              const categoryAchievements = achievements.filter(a => a.category === category);
              const completedInCategory = categoryAchievements.filter(a => a.completed).length;

              return (
                <div key={category} className="category-card">
                  <div className="category-icon">
                    {category === 'цели' && '🎯'}
                    {category === 'пополнения' && '💰'}
                    {category === 'снятия' && '🏆'}
                    {category === 'рейтинг' && '⭐'}
                    {category === 'другие' && '🔒'}
                  </div>
                  <div className="category-info">
                    <h4>
                      {category === 'цели' && 'Цели'}
                      {category === 'пополнения' && 'Пополнения'}
                      {category === 'снятия' && 'Снятия'}
                      {category === 'рейтинг' && 'Рейтинг'}
                      {category === 'другие' && 'Другие'}
                    </h4>
                    <p>{completedInCategory}/{categoryAchievements.length} выполнено</p>
                    <div className="category-progress">
                      <div
                        className="category-progress-fill"
                        style={{
                          width: `${categoryAchievements.length > 0
                            ? (completedInCategory / categoryAchievements.length) * 100
                            : 0}%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="achievements-list">
          <h3>Все достижения</h3>
          <div className="achievements-grid">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`achievement-card ${achievement.completed ? 'completed' : 'locked'}`}
              >
                <div className="achievement-header">
                  <div className="achievement-icon">{achievement.icon}</div>
                  <div className="achievement-status">
                    {achievement.completed ? (
                      <span className="status-badge completed-badge">
                        <span className="check-icon">✓</span> Выполнено
                      </span>
                    ) : (
                      <span className="status-badge locked-badge">Не выполнено</span>
                    )}
                  </div>
                </div>

                <div className="achievement-body">
                  <h4>{achievement.name}</h4>
                  <p className="achievement-description">{achievement.description}</p>

                  <div className="achievement-category">
                    <span className="category-tag">{achievement.category}</span>
                  </div>

                  {achievement.completed ? (
                    <div className="achievement-completed-info">
                      <div className="xp-earned">
                        <span className="xp-icon">✨</span>
                        <span className="xp-amount">
                          {achievement.points >= 0 ? '+' : ''}{achievement.points} XP
                        </span>
                      </div>
                      <p className="hint-text">Получено автоматически</p>
                    </div>
                  ) : (
                    <div className="achievement-locked">
                      <div className="xp-to-earn">
                        <span className="xp-icon">⭐</span>
                        <span className="xp-amount">
                          {achievement.points >= 0 ? '+' : ''}{achievement.points} XP
                        </span>
                      </div>
                      <p className="hint-text">
                        {achievement.points < 0
                          ? 'Штрафное достижение'
                          : 'Выполните условие для получения'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="achievement-footer">
                  {achievement.completed ? (
                    <span className="completed-date">Достижение получено автоматически</span>
                  ) : (
                    <span className="locked-date">
                      {achievement.points >= 0
                        ? 'Выполните условие'
                        : 'Штрафное достижение'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="info-section">
          <h3>Как работают достижения?</h3>
          <div className="info-card">
            <p>
              Достижения помогают сохранять мотивацию и следить за своим прогрессом в накоплении средств.
              Все достижения начисляются автоматически при выполнении условий в процессе использования приложения.
            </p>
            <ul className="info-list">
              <li>✅ Достижения начисляются автоматически</li>
              <li>✅ За каждое достижение вы получаете очки опыта (XP)</li>
              <li>✅ 100 XP = 1 уровень</li>
              <li>✅ Уровень отображается в хедере рядом с вашим именем</li>
              <li>⚠️ Некоторые достижения могут быть штрафными (отнимают XP)</li>
            </ul>

            <div className="levels-info">
              <h4>Система уровней:</h4>
              <p>Ваш текущий рейтинг: <strong>{userStats.rating || '0'}</strong> XP</p>
              <p>Ваш текущий уровень: <strong>{Math.floor(parseInt(userStats.rating || '0') / 100) + 1}</strong></p>
              <div className="levels-grid">
                <div className="level-example">
                  <span className="level-number">Ур. 1</span>
                  <span className="level-xp">0-99 XP</span>
                </div>
                <div className="level-example">
                  <span className="level-number">Ур. 2</span>
                  <span className="level-xp">100-199 XP</span>
                </div>
                <div className="level-example">
                  <span className="level-number">Ур. 3</span>
                  <span className="level-xp">200-299 XP</span>
                </div>
                <div className="level-example">
                  <span className="level-number">Ур. 10</span>
                  <span className="level-xp">900-999 XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AchievementsPage;
