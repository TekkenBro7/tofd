import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import './Layout.css';

const Layout = ({ isAuthenticated, onLogout }) => {
  const [currentUser, setCurrentUser] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();

  // Обновляем время каждую минуту
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Обновляем пользователя при изменении аутентификации
  useEffect(() => {
    if (isAuthenticated) {
      const savedUser = localStorage.getItem('user');
      setCurrentUser(savedUser || '');
    } else {
      setCurrentUser('');
    }
  }, [isAuthenticated]);

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
          <div className="header-section datetime-section">
            <div className="time-display">
              <span className="time-icon">🕒</span>
              <span className="time-text">{formatTime(currentTime)}</span>
            </div>
            <div className="date-display">
              <span className="date-icon">📅</span>
              <span className="weekday-text">{formatWeekday(currentTime)}</span>
              <span className="date-text">{formatDate(currentTime)}</span>
            </div>
          </div>

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

          {/* Информация о пользователе */}
          <div className="header-section user-section">
            {isAuthenticated ? (
              <div className="user-info">
                <div className="user-display">
                  <span className="user-icon">👤</span>
                  <span className="user-name">{currentUser}</span>
                </div>
                <button onClick={onLogout} className="logout-btn" title="Выйти">
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
        <Outlet />
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
            <p>Телефон: +375 29 123-45-67</p>
          </div>
          
          <div className="footer-section">
            <h4>Безопасность</h4>
            <p>Все данные защищены</p>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} ТОФД Копилка</p>          
        </div>
      </footer>
    </div>
  );
};

export default Layout;