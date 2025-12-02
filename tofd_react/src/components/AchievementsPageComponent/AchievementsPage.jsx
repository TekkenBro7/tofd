import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import './AchievementsPage.css';

const AchievementsPage = () => {
  const [achievements, setAchievements] = useState([]);
  const [currentUser] = useState(localStorage.getItem('user') || '');
  const { addXP } = useOutletContext();

  // Загружаем достижения из localStorage или используем заглушечные
  useEffect(() => {
    const savedAchievements = JSON.parse(localStorage.getItem('userAchievements') || 'null');
    
    if (savedAchievements) {
      setAchievements(savedAchievements);
    } else {
      // Инициализируем заглушечные данные
      const initialAchievements = [
        {
          id: 1,
          title: 'Первая цель',
          description: 'Создайте свою первую цель для накопления',
          icon: '🎯',
          completed: false,
          xp: 25,
          category: 'цели'
        },
        {
          id: 2,
          title: 'Начало пути',
          description: 'Пополните копилку на 1000 рублей',
          icon: '💰',
          completed: false,
          xp: 50,
          category: 'пополнения'
        },
        {
          id: 3,
          title: 'Планировщик',
          description: 'Создайте 3 цели одновременно',
          icon: '📋',
          completed: false,
          xp: 75,
          category: 'цели'
        },
        {
          id: 4,
          title: 'Накопитель',
          description: 'Соберите общую сумму 10 000 рублей',
          icon: '🏦',
          completed: false,
          xp: 150,
          category: 'накопления'
        },
        {
          id: 5,
          title: 'Дисциплинированный',
          description: 'Настройте автоматическое пополнение',
          icon: '📅',
          completed: false,
          xp: 100,
          category: 'пополнения'
        },
        {
          id: 6,
          title: 'Первое снятие',
          description: 'Снимите деньги для достижения первой цели',
          icon: '🏆',
          completed: false,
          xp: 100,
          category: 'снятия'
        },
        {
          id: 7,
          title: 'Стратег',
          description: 'Достигните 5 целей',
          icon: '♟️',
          completed: false,
          xp: 200,
          category: 'цели'
        },
        {
          id: 8,
          title: 'Миллионер',
          description: 'Накопите 100 000 рублей',
          icon: '💎',
          completed: false,
          xp: 500,
          category: 'накопления'
        },
        {
          id: 9,
          title: 'Регулярный вкладчик',
          description: 'Выполняйте автопополнение 3 месяца подряд',
          icon: '🔄',
          completed: false,
          xp: 150,
          category: 'пополнения'
        },
        {
          id: 10,
          title: 'Мастер целей',
          description: 'Завершите 10 целей',
          icon: '👑',
          completed: false,
          xp: 300,
          category: 'цели'
        }
      ];
      
      setAchievements(initialAchievements);
      localStorage.setItem('userAchievements', JSON.stringify(initialAchievements));
    }
  }, []);

  // Сохраняем достижения при изменении
  useEffect(() => {
    if (achievements.length > 0) {
      localStorage.setItem('userAchievements', JSON.stringify(achievements));
    }
  }, [achievements]);

  // Обработка выполнения достижения
  const handleCompleteAchievement = (achievementId) => {
    setAchievements(prev => prev.map(achievement => {
      if (achievement.id === achievementId && !achievement.completed) {
        const updated = { ...achievement, completed: true };
        addXP(updated.xp); // Добавляем XP через контекст
        return updated;
      }
      return achievement;
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Статистика достижений
  const completedCount = achievements.filter(a => a.completed).length;
  const totalXP = achievements.filter(a => a.completed).reduce((sum, a) => sum + a.xp, 0);
  const categories = ['цели', 'пополнения', 'снятия', 'накопления'];

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
              <span className="stat-value">{totalXP} XP</span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="page-main-content">
        <div className="welcome-section">
          <h2>Достижения {currentUser}!</h2>
          <p>Выполняйте достижения, чтобы получать опыт и повышать уровень</p>
        </div>
        
        <div className="achievements-summary">
          <div className="summary-card">
            <div className="summary-icon">🏆</div>
            <div className="summary-info">
              <h3>Система достижений</h3>
              <p>Каждое выполненное достижение приносит вам очки опыта (XP)</p>
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
                    {category === 'накопления' && '💎'}
                  </div>
                  <div className="category-info">
                    <h4>{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                    <p>{completedInCategory}/{categoryAchievements.length} выполнено</p>
                    <div className="category-progress">
                      <div 
                        className="category-progress-fill" 
                        style={{ width: `${(completedInCategory / categoryAchievements.length) * 100}%` }}
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
                onClick={() => !achievement.completed && handleCompleteAchievement(achievement.id)}
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
                  <h4>{achievement.title}</h4>
                  <p className="achievement-description">{achievement.description}</p>
                  
                  <div className="achievement-category">
                    <span className="category-tag">{achievement.category}</span>
                  </div>
                  
                  {achievement.completed ? (
                    <div className="achievement-completed-info">
                      <div className="xp-earned">
                        <span className="xp-icon">✨</span>
                        <span className="xp-amount">+{achievement.xp} XP</span>
                      </div>
                    </div>
                  ) : (
                    <div className="achievement-locked">
                      <div className="xp-to-earn">
                        <span className="xp-icon">⭐</span>
                        <span className="xp-amount">{achievement.xp} XP</span>
                      </div>
                      <p className="hint-text">Нажмите, чтобы выполнить</p>
                    </div>
                  )}
                </div>
                
                <div className="achievement-footer">
                  {achievement.completed ? (
                    <span className="completed-date">Достижение получено</span>
                  ) : (
                    <button 
                      className="complete-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompleteAchievement(achievement.id);
                      }}
                    >
                      Получить {achievement.xp} XP
                    </button>
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
              Выполняйте условия для получения достижений и зарабатывайте очки опыта (XP).
            </p>
            <ul className="info-list">
              <li>✅ За каждое достижение вы получаете определенное количество XP</li>
              <li>✅ 100 XP = 1 уровень</li>
              <li>✅ Уровень отображается в хедере рядом с вашим именем</li>
              <li>✅ Достижения обновляются автоматически при выполнении условий</li>
              <li>✅ Некоторые достижения можно выполнить несколько раз</li>
            </ul>
            
            <div className="levels-info">
              <h4>Система уровней:</h4>
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