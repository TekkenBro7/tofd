import React, { useState, useEffect } from 'react';
import './HomePage.css';

const HomePage = () => {
  // Состояния для авторизации
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUser, setCurrentUser] = useState('');

  // Проверяем авторизацию при загрузке компонента
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedAuth = localStorage.getItem('isAuthenticated');
    
    if (savedAuth === 'true' && savedUser) {
      setIsAuthenticated(true);
      setCurrentUser(savedUser);
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
      setIsAuthenticated(true);
      setCurrentUser(login);
      setErrorMessage('');
      
    } else {
      // Режим входа
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const user = existingUsers.find(user => 
        user.login === login && user.password === password
      );
      
      if (user) {
        localStorage.setItem('user', login);
        localStorage.setItem('isAuthenticated', 'true');
        setIsAuthenticated(true);
        setCurrentUser(login);
        setErrorMessage('');
      } else {
        setErrorMessage('Неверный логин или пароль');
      }
    }
  };

  // Выход из системы
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setCurrentUser('');
    setLogin('');
    setPassword('');
    setConfirmPassword('');
  };

  // Переключение между регистрацией и входом
  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setErrorMessage('');
    setPassword('');
    setConfirmPassword('');
  };

  // Если пользователь не авторизован, показываем форму
  if (!isAuthenticated) {
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
  }

  // Если пользователь авторизован, показываем главную страницу
  return (
    <div className="home-container">
      <header className="header">
        <div className="header-content">
          <h1 className="welcome-title">Добро пожаловать, {currentUser}!</h1>
          <button onClick={handleLogout} className="logout-button">
            Выйти
          </button>
        </div>
      </header>
      
      <main className="main-content">
        <section className="hero-section">
          <div className="hero-content">
            <h2>Главная страница</h2>
            <p>Вы успешно авторизовались и теперь можете пользоваться всеми возможностями нашего приложения.</p>
          </div>
        </section>
        
        <section className="features-section">
          <h3>Доступные функции:</h3>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h4>Достижения</h4>
              <p>Просмотр достижений и аналитических данных</p>
            </div>  
            
            <div className="feature-card">
              <div className="feature-icon">📉</div>
              <h4>Снятие</h4>
              <p>Снятие денег со счета копилки</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">💲</div>
              <h4>Пополнение</h4>
              <p>Настройка автоматического пополнения и ручное пополнение счета копилки</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h4>Цели</h4>
              <p>Создание и отслеживание целей</p>
            </div>
          </div>
        </section>
        
        <section className="user-info-section">
          <h3>Информация о сессии</h3>
          <div className="info-card">
            <div className="info-row">
              <span className="info-label">Текущий пользователь:</span>
              <span className="info-value">{currentUser}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Статус:</span>
              <span className="info-value status-active">Активен</span>
            </div>
            <div className="info-row">
              <span className="info-label">Последний вход:</span>
              <span className="info-value">{new Date().toLocaleString()}</span>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="footer">
        <p>© 2025 ТОФД</p>
      </footer>
    </div>
  );
};

export default HomePage;