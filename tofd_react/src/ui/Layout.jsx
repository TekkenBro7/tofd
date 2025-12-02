import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import './Layout.css';

const Layout = () => {
  const [currentUser, setCurrentUser] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userLevel, setUserLevel] = useState(1);
  const [userXP, setUserXP] = useState(0);
  const [levelProgress, setLevelProgress] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  // Константы для системы уровней
  const XP_PER_LEVEL = 100;

  // Обновляем время каждую минуту
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Загружаем данные пользователя при загрузке
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedAuth = localStorage.getItem('isAuthenticated');
    
    if (savedAuth === 'true' && savedUser) {
      setIsAuthenticated(true);
      setCurrentUser(savedUser);
      
      // Загружаем XP и уровень из localStorage
      const savedXP = parseInt(localStorage.getItem('userXP') || '0');
      const savedLevel = parseInt(localStorage.getItem('userLevel') || '1');
      setUserXP(savedXP);
      setUserLevel(savedLevel);
      calculateLevelProgress(savedXP, savedLevel);
    } else {
      setIsAuthenticated(false);
      setCurrentUser('');
      
      // Если пользователь не авторизован и находится не на главной странице,
      // перенаправляем на главную
      if (location.pathname !== '/') {
        navigate('/');
      }
    }
  }, [location.pathname, navigate]);

  // Функция для расчета прогресса уровня
  const calculateLevelProgress = (xp, level) => {
    const xpForCurrentLevel = (level - 1) * XP_PER_LEVEL;
    const xpInCurrentLevel = xp - xpForCurrentLevel;
    const progress = (xpInCurrentLevel / XP_PER_LEVEL) * 100;
    setLevelProgress(Math.min(100, Math.max(0, progress)));
  };

  // Обновляем прогресс при изменении XP или уровня
  useEffect(() => {
    calculateLevelProgress(userXP, userLevel);
  }, [userXP, userLevel]);

  // Функция для добавления XP (будет вызываться из других компонентов)
  const addXP = (xpToAdd) => {
    const newXP = userXP + xpToAdd;
    const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
    
    setUserXP(newXP);
    setUserLevel(newLevel);
    
    // Сохраняем в localStorage
    localStorage.setItem('userXP', newXP.toString());
    localStorage.setItem('userLevel', newLevel.toString());
    
    // Показываем уведомление о получении XP
    if (xpToAdd > 0) {
      showXPNotification(xpToAdd);
    }
  };

  // Функция для показа уведомления о получении XP
  const showXPNotification = (xp) => {
    const notification = document.createElement('div');
    notification.className = 'xp-notification';
    notification.innerHTML = `
      <div class="xp-notification-content">
        <span class="xp-icon">✨</span>
        <span class="xp-text">+${xp} XP</span>
      </div>
    `;
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Удаление через 3 секунды
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  };

  // Выход из системы
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    localStorage.removeItem('userXP');
    localStorage.removeItem('userLevel');
    setIsAuthenticated(false);
    setCurrentUser('');
    setUserXP(0);
    setUserLevel(1);
    navigate('/');
  };

  // Форматирование времени
  const formatTime = (date) => {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatWeekday = (date) => {
    const weekday = date.toLocaleDateString('ru-RU', {
      weekday: 'short'
    });
    return weekday.charAt(0).toUpperCase() + weekday.slice(1);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Определяем текущую страницу для отображения в заголовке
  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/goals': return 'Цели';
      case '/achievements': return 'Достижения';
      case '/withdrawal': return 'Снятие средств';
      case '/deposit': return 'Пополнение счета';
      default: return 'Главная';
    }
  };

  // Расчет XP до следующего уровня
  const xpToNextLevel = userLevel * XP_PER_LEVEL - userXP;

  return (
    <div className="layout">
      <header className="layout-header single-line-header">
        <div className="header-content">
          {/* Заголовок */}
          <div className="header-section logo-section">
            <Link to="/" className="logo">
              <span className="logo-icon">💰</span>
              <span className="logo-text">ТОФД Копилка</span>
            </Link>
            {/* <div className="current-page-title">
              <span className="page-title-separator">|</span>
              <span className="page-title">{getPageTitle()}</span>
            </div> */}
          </div>

          {/* Время и дата */}
          {/* <div className="header-section datetime-section">
            <div className="time-display">
              <span className="time-icon">🕒</span>
              <span className="time-text">{formatTime(currentTime)}</span>
            </div>
            <div className="date-display">
              <span className="date-icon">📅</span>
              <span className="weekday-text">{formatWeekday(currentTime)}</span>
              <span className="date-text">{formatDate(currentTime)}</span>
            </div>
          </div> */}

          {/* Навигация (только для авторизованных) */}
          {isAuthenticated && (
            <div className="header-section nav-section">
              <nav className="main-nav">
                <Link 
                  to="/" 
                  className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                >
                  Главная
                </Link>
                <Link 
                  to="/goals" 
                  className={`nav-link ${location.pathname === '/goals' ? 'active' : ''}`}
                >
                  Цели
                </Link>
                <Link 
                  to="/achievements" 
                  className={`nav-link ${location.pathname === '/achievements' ? 'active' : ''}`}
                >
                  Достижения
                </Link>
                <Link 
                  to="/deposit" 
                  className={`nav-link ${location.pathname === '/deposit' ? 'active' : ''}`}
                >
                  Пополнение
                </Link>
                <Link 
                  to="/withdrawal" 
                  className={`nav-link ${location.pathname === '/withdrawal' ? 'active' : ''}`}
                >
                  Снятие
                </Link>
              </nav>
            </div>
          )}

          {/* Система уровней и информация о пользователе */}
          <div className="header-section user-section">
            {isAuthenticated ? (
              <div className="user-info">
                {/* Плашка с уровнем */}
                <div className="level-display">
                  <div className="level-badge">
                    <span className="level-icon">⭐</span>
                    <span className="level-text">Ур. {userLevel}</span>
                  </div>
                  <div className="xp-progress">
                    <div className="xp-progress-bar">
                      <div 
                        className="xp-progress-fill" 
                        style={{ width: `${levelProgress}%` }}
                      ></div>
                    </div>
                    <div className="xp-stats">
                      <span className="current-xp">{userXP} XP</span>
                      <span className="xp-to-next">+{xpToNextLevel} до след.</span>
                    </div>
                  </div>
                </div>
                
                {/* Имя пользователя и кнопка выхода */}
                <div className="user-display">
                  <span className="user-icon">👤</span>
                  <span className="user-name">{currentUser}</span>
                </div>
                <button onClick={handleLogout} className="logout-btn" title="Выйти">
                  <span className="logout-icon">🚪</span>
                  <span className="logout-text">Выйти</span>
                </button>
              </div>
            ) : (
              <div className="auth-status">
                <span className="status-icon">🔒</span>
                <span className="status-text">Гость</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="layout-main">
        {/* Передаем функцию addXP в дочерние компоненты через контекст или пропсы */}
        <Outlet context={{ addXP }} />
      </main>

      <footer className="layout-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>ТОФД Копилка</h3>
            <p>Ваш личный финансовый помощник для достижения целей</p>
          </div>
          
          <div className="footer-section">
            <h4>Контакты</h4>
            <p>Email: support@tofd-kopilka.ru</p>
            <p>Телефон: 8-800-XXX-XX-XX</p>
          </div>
          
          <div className="footer-section">
            <h4>Система уровней</h4>
            <p>Зарабатывайте XP за достижения и повышайте свой уровень!</p>
            <p>1 уровень = 100 XP</p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} ТОФД Копилка. Все права защищены.</p>
          <p className="version">Версия 1.1.0 (с системой уровней)</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;