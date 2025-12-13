import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { achievementsApi } from '../services/achievementsApi'
import './Layout.css';

const Layout = () => {
  const [currentUser, setCurrentUser] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userLevel, setUserLevel] = useState(1);
  const [userXP, setUserXP] = useState(0);
  const [levelProgress, setLevelProgress] = useState(0);
  const [xpToNextLevel, setXpToNextLevel] = useState(100);
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

  // Загружаем данные пользователя и уровень при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      // Проверяем авторизацию через sessionStorage
      const accessToken = sessionStorage.getItem('accessToken');
      const isAuth = sessionStorage.getItem('isAuthenticated') === 'true';
      const userData = sessionStorage.getItem('user');

      if (isAuth && accessToken && userData) {
        try {
          const user = JSON.parse(userData);
          setIsAuthenticated(true);
          setCurrentUser(user.login || 'Пользователь');

          // Загружаем уровень и XP с бэкенда
          await loadUserLevel();
        } catch (error) {
          console.error('Ошибка при разборе данных пользователя:', error);
          clearAuthData();
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser('');

        // Если пользователь не авторизован и находится не на главной странице,
        // перенаправляем на главную
        if (location.pathname !== '/' && location.pathname !== '') {
          navigate('/');
        }
      }
    };

    checkAuth();

    // Слушаем изменения в sessionStorage для обновления авторизации
    const handleStorageChange = (e) => {
      if (e.key === 'isAuthenticated' || e.key === 'accessToken' || e.key === 'user') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [location.pathname, navigate]);

  // Функция загрузки уровня пользователя с бэкенда
  const loadUserLevel = async () => {
    try {
      if (!isAuthenticated) return;

      const levelData = await achievementsApi.getUserLevel();
      setUserLevel(levelData.level);
      setUserXP(levelData.xp);
      setLevelProgress(levelData.progress);
      setXpToNextLevel(levelData.xpToNextLevel);

      // Сохраняем в localStorage для быстрого доступа
      localStorage.setItem('userLevel', levelData.level.toString());
      localStorage.setItem('userXP', levelData.xp.toString());
    } catch (error) {
      console.error('Ошибка загрузки уровня:', error);
      // Используем значения по умолчанию
      setUserLevel(1);
      setUserXP(0);
      setLevelProgress(0);
      setXpToNextLevel(100);
    }
  };

  // Функция для очистки данных аутентификации
  const clearAuthData = () => {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userLevel');
    localStorage.removeItem('userXP');
    setIsAuthenticated(false);
    setCurrentUser('');
    setUserXP(0);
    setUserLevel(1);
    setLevelProgress(0);
  };

  // Функция для добавления XP
  const addXP = async (xpToAdd) => {
    if (!isAuthenticated || xpToAdd <= 0) return;

    try {
      // Обновляем локально для быстрой обратной связи
      const newXP = userXP + xpToAdd;
      const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;

      setUserXP(newXP);
      setUserLevel(newLevel);

      // Рассчитываем новый прогресс
      const xpForCurrentLevel = (newLevel - 1) * XP_PER_LEVEL;
      const xpInCurrentLevel = newXP - xpForCurrentLevel;
      const progress = (xpInCurrentLevel / XP_PER_LEVEL) * 100;
      setLevelProgress(progress);
      setXpToNextLevel(XP_PER_LEVEL - xpInCurrentLevel);

      // Сохраняем в localStorage
      localStorage.setItem('userLevel', newLevel.toString());
      localStorage.setItem('userXP', newXP.toString());

      // Показываем уведомление о получении XP
      showXPNotification(xpToAdd);

    } catch (error) {
      console.error('Ошибка при добавлении XP:', error);
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
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };

  // Выход из системы
  const handleLogout = () => {
    // Очищаем все данные
    clearAuthData();

    // Вызываем API logout если есть authApi
    if (window.authApi) {
      window.authApi.logout().catch(console.error);
    }

    // Перенаправляем на главную
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

  // Определяем, нужно ли показывать навигацию
  const shouldShowNavigation = isAuthenticated;

  return (
    <div className="layout">
      <header className="layout-header single-line-header">
        <div className="header-content">
          {/* Заголовок */}
          <div className="header-section logo-section">
            <Link to="/" className="logo">
              <span className="logo-icon">💰</span>
              <span className="logo-text">SaveChain</span>
            </Link>
          </div>

          {/* Навигация (только для авторизованных) */}
          {shouldShowNavigation && (
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
                {/* <Link
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
                </Link> */}
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
        {/* Передаем функцию addXP в дочерние компоненты через контекст */}
        <Outlet context={{ addXP, isAuthenticated, userLevel, userXP, loadUserLevel }} />
      </main>

      <footer className="layout-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>ТОФД Копилка</h3>
            <p>Ваш личный финансовый помощник для достижения целей</p>
          </div>

          <div className="footer-section">
            <h4>Система уровней</h4>
            <p>Зарабатывайте XP за достижения и повышайте свой уровень!</p>
            <p>100 XP = 1 уровень</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} ТОФД Копилка. Все права защищены.</p>
          <p className="version">Версия 2.0.0 (интеграция с бэкендом)</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
