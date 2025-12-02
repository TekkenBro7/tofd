import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { authApi } from '../../services/authApi';
import './HomePage.css';

const HomePage = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Получаем данные из Layout через контекст
  const { isAuthenticated, addXP } = useOutletContext() || {};

  // Проверяем авторизацию при загрузке
  useEffect(() => {
    // Если уже авторизованы, ничего не делаем
  }, []);

  // Обработка отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    // Валидация
    if (!login.trim() || !password.trim()) {
      setErrorMessage('Пожалуйста, заполните все поля');
      setIsLoading(false);
      return;
    }

    if (login.length < 3) {
      setErrorMessage('Логин должен содержать минимум 3 символа');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Пароль должен содержать минимум 6 символов');
      setIsLoading(false);
      return;
    }

    if (isRegisterMode && password !== confirmPassword) {
      setErrorMessage('Пароли не совпадают');
      setIsLoading(false);
      return;
    }

    try {
      let response;
      if (isRegisterMode) {
        // Регистрация
        response = await authApi.register(login, password);
      } else {
        // Вход
        response = await authApi.login(login, password);
      }

      // Сохраняем accessToken и информацию о пользователе
      authApi.saveAccessToken(response.accessToken);
      authApi.saveUser(response.user);

      // При регистрации даем начальный XP
      if (isRegisterMode && addXP) {
        addXP(50); // 50 XP за регистрацию
      }

      // Перезагружаем страницу для обновления Layout
      window.location.reload();
      
    } catch (error) {
      console.error('Auth error:', error);
      setErrorMessage(error.message || 'Произошла ошибка. Пожалуйста, попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  // Выход из системы
  const handleLogout = async () => {
    try {
      await authApi.logout();
      authApi.clearAuthData();
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Переключение между регистрацией и входом
  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setErrorMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  // Если пользователь авторизован, показываем контент главной страницы
  if (isAuthenticated) {
    const user = authApi.getUser();
    
    return (
      <div className="home-content">   
        <section className="hero-section">
          <div className="hero-content">
            <h2>Добро пожаловать в SaveChain!</h2>
            <p>Управляйте своими финансами, ставьте цели и отслеживайте прогресс</p>
          </div>
        </section>
        
        <section className="features-section">
          <h3>Доступные функции:</h3>
          <div className="features-grid">
            <div className="feature-card">
              <a href="/achievements" className="feature-link">
                <div className="feature-icon">📊</div>
                <h4>Достижения</h4>
                <p>Просмотр достижений и аналитических данных</p>
              </a>
            </div>
            
            <div className="feature-card">
              <a href="/withdrawal" className="feature-link">
                <div className="feature-icon">📉</div>
                <h4>Снятие</h4>
                <p>Снятие денег со счета копилки</p>
              </a>
            </div>
            
            <div className="feature-card">
              <a href="/deposit" className="feature-link">
                <div className="feature-icon">💲</div>
                <h4>Пополнение</h4>
                <p>Настройка автоматического пополнения и ручное пополнение счета копилки</p>
              </a>
            </div>
            
            <div className="feature-card">
              <a href="/goals" className="feature-link">
                <div className="feature-icon">📈</div>
                <h4>Цели</h4>
                <p>Создание и отслеживание целей</p>
              </a>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Если пользователь не авторизован, показываем форму
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{isRegisterMode ? 'Регистрация' : 'Вход'}</h1>
          <p className="auth-subtitle">
            {isRegisterMode 
              ? 'Создайте новый аккаунт' 
              : 'Войдите в свой аккаунт'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="login">Логин</label>
            <input
              type="text"
              id="login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Введите логин"
              className="form-input"
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              className="form-input"
              disabled={isLoading}
            />
          </div>
          
          {isRegisterMode && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Подтвердите пароль</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите пароль"
                className="form-input"
                disabled={isLoading}
              />
            </div>
          )}
          
          {errorMessage && (
            <div className="error-message">{errorMessage}</div>
          )}
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Загрузка...' : (isRegisterMode ? 'Зарегистрироваться' : 'Войти')}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            {isRegisterMode 
              ? 'Уже есть аккаунт?' 
              : 'Еще нет аккаунта?'}
            <button 
              type="button" 
              onClick={toggleMode} 
              className="mode-toggle"
              disabled={isLoading}
            >
              {isRegisterMode ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;