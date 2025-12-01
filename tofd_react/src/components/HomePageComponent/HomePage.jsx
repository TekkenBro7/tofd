import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  // Проверяем авторизацию при загрузке
  useEffect(() => {
    const savedAuth = localStorage.getItem('isAuthenticated');
    const savedUser = localStorage.getItem('user');
    
    // Если пользователь уже авторизован, перенаправляем на главную с контентом
    if (savedAuth === 'true' && savedUser) {
      // Ничего не делаем - Layout покажет контент
    }
  }, []);

  // Обработка отправки формы
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Валидация
    if (!login.trim() || !password.trim()) {
      setErrorMessage('Пожалуйста, заполните все поля');
      return;
    }

    if (login.length < 3) {
      setErrorMessage('Логин должен содержать минимум 3 символа');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Пароль должен содержать минимум 6 символов');
      return;
    }

    if (isRegisterMode) {
      // Режим регистрации
      if (password !== confirmPassword) {
        setErrorMessage('Пароли не совпадают');
        return;
      }

      // Проверяем, не занят ли логин
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const userExists = existingUsers.some(user => user.login === login);
      
      if (userExists) {
        setErrorMessage('Пользователь с таким логином уже существует');
        return;
      }

      // Сохраняем нового пользователя
      const newUser = { login, password };
      const updatedUsers = [...existingUsers, newUser];
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      
      // Авторизуем пользователя
      localStorage.setItem('user', login);
      localStorage.setItem('isAuthenticated', 'true');
      setErrorMessage('');
      
      // Перезагружаем страницу для обновления Layout
      window.location.reload();
      
    } else {
      // Режим входа
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const user = existingUsers.find(user => 
        user.login === login && user.password === password
      );
      
      if (user) {
        localStorage.setItem('user', login);
        localStorage.setItem('isAuthenticated', 'true');
        setErrorMessage('');
        
        // Перезагружаем страницу для обновления Layout
        window.location.reload();
      } else {
        setErrorMessage('Неверный логин или пароль');
      }
    }
  };

  // Переключение между регистрацией и входом
  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setErrorMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  // Проверяем, авторизован ли пользователь
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  // Если пользователь авторизован, показываем контент главной страницы
  if (isAuthenticated) {
    return (
      <div className="home-content">
        <section className="hero-section">
          <div className="hero-content">
            <h2>Добро пожаловать в Копилку!</h2>
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
        
        {/* <section className="quick-stats">
          <h3>Быстрая статистика</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <h4>Текущий баланс</h4>
                <p className="stat-value">0 ₽</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-info">
                <h4>Активных целей</h4>
                <p className="stat-value">0</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">🏆</div>
              <div className="stat-info">
                <h4>Достижений</h4>
                <p className="stat-value">0</p>
              </div>
            </div>
          </div>
        </section> */}
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
              />
            </div>
          )}
          
          {errorMessage && (
            <div className="error-message">{errorMessage}</div>
          )}
          
          <button type="submit" className="submit-button">
            {isRegisterMode ? 'Зарегистрироваться' : 'Войти'}
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