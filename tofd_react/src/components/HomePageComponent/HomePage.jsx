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
  
  // Новые состояния для кошелька
  const [walletAddress, setWalletAddress] = useState('');
  const [showWalletForm, setShowWalletForm] = useState(false);
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState('');
  
  // Получаем данные из Layout через контекст
  const { isAuthenticated, addXP } = useOutletContext() || {};

  // Проверяем авторизацию и наличие кошелька при загрузке
  useEffect(() => {
    if (isAuthenticated) {
      checkWalletExists();
    }
  }, [isAuthenticated]);

  // Проверка, сохранен ли уже кошелек
  const checkWalletExists = () => {
    const savedWallet = localStorage.getItem('solana_wallet');
    if (!savedWallet) {
      setShowWalletForm(true);
    } else {
      setWalletAddress(savedWallet);
      setShowWalletForm(false);
    }
  };

  // Обработка подключения кошелька
  const handleConnectWallet = async (e) => {
    e.preventDefault();
    setWalletError('');
    setIsWalletLoading(true);

    // Базовая валидация адреса Solana (44 символа)
    if (!walletAddress.trim()) {
      setWalletError('Введите адрес кошелька');
      setIsWalletLoading(false);
      return;
    }

    if (walletAddress.length !== 44) {
      setWalletError('Адрес Solana кошелька должен содержать 44 символа');
      setIsWalletLoading(false);
      return;
    }

    // Проверка формата (обычно Base58)
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{44}$/;
    if (!base58Regex.test(walletAddress)) {
      setWalletError('Неверный формат адреса Solana кошелька');
      setIsWalletLoading(false);
      return;
    }

    try {
      // Сохраняем в localStorage
      localStorage.setItem('solana_wallet', walletAddress);
      
      // Также можно сохранить с привязкой к пользователю
      const user = authApi.getUser();
      if (user && user.id) {
        localStorage.setItem(`solana_wallet_${user.id}`, walletAddress);
      }
      
      // Показываем уведомление об успехе
      alert('✅ Кошелек успешно подключен!');
      
      // Даем XP за подключение кошелька
      if (addXP) {
        addXP(100); // 100 XP за подключение кошелька
      }
      
      // Скрываем форму
      setShowWalletForm(false);
      
    } catch (error) {
      console.error('Ошибка при сохранении кошелька:', error);
      setWalletError('Произошла ошибка при сохранении кошелька');
    } finally {
      setIsWalletLoading(false);
    }
  };

  // Отключение кошелька
  const handleDisconnectWallet = () => {
    if (window.confirm('Вы уверены, что хотите отключить кошелек?')) {
      localStorage.removeItem('solana_wallet');
      const user = authApi.getUser();
      if (user && user.id) {
        localStorage.removeItem(`solana_wallet_${user.id}`);
      }
      setWalletAddress('');
      setShowWalletForm(true);
      alert('Кошелек отключен');
    }
  };

  // Обработка отправки формы (регистрация/вход)
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

  // Если пользователь авторизован, но у него нет кошелька
  if (isAuthenticated && showWalletForm) {
    const user = authApi.getUser();
    
    return (
      <div className="auth-container">
        <div className="auth-card wallet-card">
          <div className="auth-header">
            <h1>Подключите Solana кошелек</h1>
            <p className="auth-subtitle">
              Для использования всех функций приложения необходимо подключить Solana кошелек
            </p>
          </div>
          
          <form onSubmit={handleConnectWallet} className="auth-form">
            <div className="form-group">
              <label htmlFor="walletAddress">Адрес Solana кошелька</label>
              <input
                type="text"
                id="walletAddress"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Введите ваш адрес Solana кошелька (44 символа)"
                className="form-input"
                disabled={isWalletLoading}
              />
              <small className="form-hint">
                Пример: DgG8zUQ1J2p4qR7sT9wXyZ3aB6cE5dF2gH4jK7mL8nP9qR3sT
              </small>
            </div>
            
            {walletError && (
              <div className="error-message">{walletError}</div>
            )}
            
            <div className="wallet-info">
              <h4>Как получить адрес кошелька?</h4>
              <ul>
                <li>1. Установите Phantom или Sollet кошелек</li>
                <li>2. Скопируйте адрес кошелька из приложения</li>
                <li>3. Вставьте его в поле выше</li>
              </ul>
            </div>
            
            <button 
              type="submit" 
              className="submit-button wallet-button"
              disabled={isWalletLoading}
            >
              {isWalletLoading ? 'Подключение...' : 'Подключить кошелек'}
            </button>
            
            <button 
              type="button" 
              onClick={handleLogout}
              className="logout-button"
              style={{
                background: 'transparent',
                color: '#667eea',
                border: '1px solid #667eea',
                marginTop: '10px',
                width: '100%'
              }}
            >
              Выйти из аккаунта
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Если пользователь авторизован и имеет кошелек, показываем контент главной страницы
  if (isAuthenticated) {
    const user = authApi.getUser();
    const savedWallet = localStorage.getItem('solana_wallet');
    
    return (
      <div className="home-content">   
        {/* Панель с информацией о кошельке */}
        <div className="wallet-panel">
          <div>
            <h3 style={{ marginBottom: '5px' }}>Подключен Solana кошелек</h3>
            <p style={{ fontSize: '14px', opacity: '0.9' }}>
              {savedWallet ? `${savedWallet.substring(0, 10)}...${savedWallet.substring(34)}` : 'Кошелек не подключен'}
            </p>
          </div>
          <button 
            onClick={handleDisconnectWallet}
            className="disconnect-button"
          >
            Изменить кошелек
          </button>
        </div>
        
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
        
        {/* Информация о Solana */}
        <div className="info-section" style={{
          background: 'white',
          padding: '25px',
          borderRadius: '15px',
          marginTop: '40px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
        }}>
          <h3>Информация о Solana кошельке</h3>
          <p>Ваш кошелек подключен и готов к использованию. Вы можете:</p>
          <ul className="info-list" style={{ marginTop: '15px', paddingLeft: '20px' }}>
            <li>✅ Получать депозиты в SOL</li>
            <li>✅ Отправлять средства на другие кошельки</li>
            <li>✅ Участвовать в стейкинге</li>
            <li>✅ Использовать dApps на Solana</li>
          </ul>
          <div className="wallet-balance" style={{ 
            marginTop: '20px', 
            padding: '15px', 
            background: '#f8f9fa', 
            borderRadius: '10px' 
          }}>
            <h4>Баланс</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '10px' }}>
              0.00 SOL
            </p>
            <small style={{ color: '#6c757d' }}>Для отображения баланса необходимо интегрировать с блокчейном</small>
          </div>
        </div>
      </div>
    );
  }

  // Если пользователь не авторизован, показываем форму входа/регистрации
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