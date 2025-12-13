import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { authApi } from '../../services/authApi';
import { solanaService } from '../../services/solanaService';
import { contractService } from '../../services/contractService';
import './HomePage.css';

const HomePage = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Состояния для Phantom кошелька
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [vaultBalance, setVaultBalance] = useState(0);
  const [vaultAddress, setVaultAddress] = useState('');
  const [isWalletLoading, setIsWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState('');
  const [phantomAvailable, setPhantomAvailable] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  
  // Получаем данные из Layout через контекст
  const { isAuthenticated, addXP } = useOutletContext() || {};

  // Проверяем наличие Phantom и авторизацию при загрузке
  useEffect(() => {
    checkPhantomAvailability();
    
    if (isAuthenticated) {
      checkWalletConnection();
    }
  }, [isAuthenticated]);

  // Проверка наличия Phantom
  const checkPhantomAvailability = async () => {
    try {
      await solanaService.checkPhantom();
      setPhantomAvailable(true);
    } catch (error) {
      setPhantomAvailable(false);
      console.warn('Phantom кошелек не найден:', error.message);
    }
  };

  // Проверка подключенного кошелька
  const checkWalletConnection = async () => {
    try {
      setIsWalletLoading(true);
      const storedWallet = await solanaService.getWalletFromStorage();
      
      if (storedWallet) {
        setWalletConnected(true);
        setWalletAddress(storedWallet.publicKey);
        
        // Получаем балансы
        await updateBalances(storedWallet.publicKey);
      } else {
        setWalletConnected(false);
        setWalletAddress('');
      }
    } catch (error) {
      console.error('Ошибка проверки кошелька:', error);
      setWalletConnected(false);
    } finally {
      setIsWalletLoading(false);
    }
  };

  // Обновление балансов
  const updateBalances = async (publicKey) => {
    try {
      // Баланс кошелька
      const balance = await solanaService.getBalance(publicKey);
      setWalletBalance(balance);
      
      // Баланс копилки
      const vaultInfo = await solanaService.getVaultBalance(publicKey);
      if (vaultInfo) {
        setVaultBalance(vaultInfo.balance);
        setVaultAddress(vaultInfo.vaultAddress);
        
        // Инициализируем контракт сервис
        await contractService.initializeProvider(window.solana);
      }
    } catch (error) {
      console.error('Ошибка обновления балансов:', error);
    }
  };

  // Подключение Phantom кошелька
  const handleConnectWallet = async () => {
    try {
      setWalletError('');
      setIsWalletLoading(true);
      
      const result = await solanaService.connectWallet();
      
      setWalletConnected(true);
      setWalletAddress(result.publicKey);
      
      // Обновляем балансы
      await updateBalances(result.publicKey);
      
      
      alert('✅ Кошелек Phantom успешно подключен!');
      
    } catch (error) {
      console.error('Ошибка подключения кошелька:', error);
      setWalletError(error.message || 'Ошибка подключения кошелька');
    } finally {
      setIsWalletLoading(false);
    }
  };

  // Отключение кошелька
  const handleDisconnectWallet = async () => {
    if (window.confirm('Вы уверены, что хотите отключить кошелек?')) {
      try {
        await solanaService.disconnectWallet();
        
        setWalletConnected(false);
        setWalletAddress('');
        setWalletBalance(0);
        setVaultBalance(0);
        setVaultAddress('');
        setDepositAmount('');
        setWithdrawAmount('');
        
        alert('Кошелек отключен');
      } catch (error) {
        console.error('Ошибка отключения кошелька:', error);
        alert('Ошибка при отключении кошелька');
      }
    }
  };

  // Пополнение копилки
  const handleDeposit = async () => {
    try {
      if (!walletConnected || !walletAddress) {
        alert('Пожалуйста, подключите кошелек');
        return;
      }
      
      const amount = parseFloat(depositAmount);
      if (!amount || amount <= 0) {
        alert('Введите корректную сумму');
        return;
      }
      
      if (amount > walletBalance) {
        alert('Недостаточно средств на кошельке');
        return;
      }
      
      setIsWalletLoading(true);
      
      const result = await contractService.deposit(walletAddress, amount);
      
      // Обновляем балансы
      await updateBalances(walletAddress);
      
      // Сбрасываем поле ввода
      setDepositAmount('');
      
      alert(`✅ Успешно пополнено ${amount} SOL\nТранзакция: ${result.transaction}`);
      
    
    } catch (error) {
      console.error('Ошибка пополнения:', error);
      alert('Ошибка при пополнении: ' + error.message);
    } finally {
      setIsWalletLoading(false);
    }
  };

  // Вывод из копилки
  const handleWithdraw = async () => {
    try {
      if (!walletConnected || !walletAddress) {
        alert('Пожалуйста, подключите кошелек');
        return;
      }
      
      const amount = parseFloat(withdrawAmount);
      if (!amount || amount <= 0 || amount > vaultBalance) {
        alert('Введите корректную сумму');
        return;
      }
      
      setIsWalletLoading(true);
      
      const result = await contractService.withdraw(walletAddress, amount);
      
      // Обновляем балансы
      await updateBalances(walletAddress);
      
      // Сбрасываем поле ввода
      setWithdrawAmount('');
      
      alert(`✅ Успешно выведено ${amount} SOL\nТранзакция: ${result.transaction}`);
      
    } catch (error) {
      console.error('Ошибка вывода:', error);
      alert('Ошибка при выводе: ' + error.message);
    } finally {
      setIsWalletLoading(false);
    }
  };

  // Создание копилки если её нет
  const handleCreateVault = async () => {
    try {
      if (!walletConnected || !walletAddress) {
        alert('Пожалуйста, подключите кошелек');
        return;
      }
      
      setIsWalletLoading(true);
      
      const result = await contractService.createVault(walletAddress);
      
      // Получаем информацию о копилке
      const vaultInfo = await contractService.getVaultInfo(walletAddress);
      if (vaultInfo) {
        setVaultBalance(vaultInfo.balance);
        setVaultAddress(vaultInfo.vaultAddress);
      }
      
      alert(`✅ Копилка создана!\nАдрес: ${result.vaultAddress}`);
      
      
    } catch (error) {
      console.error('Ошибка создания копилки:', error);
      alert('Ошибка при создании копилки: ' + error.message);
    } finally {
      setIsWalletLoading(false);
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

  // Форматирование адреса для отображения
  const formatAddress = (address) => {
    if (!address) return '';
    if (address.length <= 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
  };

  // Если пользователь авторизован, показываем главную страницу
  if (isAuthenticated) {
    const user = authApi.getUser();
    
    return (
      <div className="home-container">
        {/* <header className="header">
          <div className="header-content">
            <h1 className="welcome-title">Добро пожаловать, {user?.login}!</h1>
            <button onClick={handleLogout} className="logout-button">
              Выйти
            </button>
          </div>
        </header> */}

        <main className="main-content">
          {/* Основной контент */}
          <section className="hero-section">
            <div className="hero-content">
              <h2>Добро пожаловать в SaveChain!</h2>
              <p>Управляйте своими финансами, ставьте цели и отслеживайте прогресс</p>
            </div>
          </section>
          {/* Панель подключения Phantom */}
          <div className="wallet-panel">
            <div className="wallet-info">
              <h3>Solana Phantom Кошелек</h3>
              {walletConnected ? (
                <p className="wallet-address">
                  Подключен: {formatAddress(walletAddress)}
                </p>
              ) : (
                <p className="wallet-status">Кошелек не подключен</p>
              )}
            </div>
            
            <div className="wallet-actions">
              {!walletConnected ? (
                <button 
                  onClick={handleConnectWallet}
                  className={`connect-wallet-button ${!phantomAvailable ? 'disabled' : ''}`}
                  disabled={isWalletLoading || !phantomAvailable}
                >
                  {isWalletLoading ? 'Подключение...' : 'Подключить Phantom'}
                </button>
              ) : (
                <button 
                  onClick={handleDisconnectWallet}
                  className="disconnect-button"
                  disabled={isWalletLoading}
                >
                  {isWalletLoading ? '...' : 'Отключить'}
                </button>
              )}
            </div>
          </div>

          {walletError && (
            <div className="error-message wallet-error">{walletError}</div>
          )}

          {/* Информация о балансах */}
          {walletConnected && (
            <div className="balance-section">
              <div className="balance-card wallet-balance">
                <h4>Баланс кошелька</h4>
                <p className="balance-amount">{walletBalance.toFixed(4)} SOL</p>
                <button 
                  onClick={() => updateBalances(walletAddress)}
                  className="refresh-button"
                  disabled={isWalletLoading}
                >
                  <span className="refresh-icon">🔄</span> Обновить
                </button>
              </div>
              
              <div className="balance-card vault-balance">
                <h4>Баланс копилки</h4>
                <p className="balance-amount">{vaultBalance.toFixed(4)} SOL</p>
                {vaultAddress && (
                  <div className="vault-info">
                    <small className="vault-address">
                      Адрес: {formatAddress(vaultAddress)}
                    </small>
                    <button 
                      onClick={() => navigator.clipboard.writeText(vaultAddress)}
                      className="copy-button"
                      title="Скопировать адрес"
                    >
                      📋
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Управление копилкой */}
          {walletConnected && (
            <div className="vault-management-section">
              <h3 className="section-title">Управление копилкой</h3>
              
              {!vaultAddress ? (
                <div className="create-vault-container">
                  <p className="vault-description">
                    Создайте копилку для безопасного хранения SOL и получения достижений
                  </p>
                  <button 
                    onClick={handleCreateVault}
                    className="create-vault-button"
                    disabled={isWalletLoading}
                  >
                    {isWalletLoading ? 'Создание...' : 'Создать копилку'}
                  </button>
                </div>
              ) : (
                <div className="vault-controls">
                  <div className="deposit-control control-group">
                    <h4>Пополнить копилку</h4>
                    <div className="input-group">
                      <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="Сумма в SOL"
                        min="0.0001"
                        step="0.0001"
                        className="amount-input"
                        disabled={isWalletLoading}
                      />
                      <button 
                        onClick={handleDeposit}
                        className="action-button deposit-button"
                        disabled={isWalletLoading || !depositAmount}
                      >
                        Пополнить
                      </button>
                    </div>
                    <small className="input-hint">
                      Доступно: {walletBalance.toFixed(4)} SOL
                    </small>
                  </div>
                  
                  <div className="withdraw-control control-group">
                    <h4>Вывести из копилки</h4>
                    <div className="input-group">
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Сумма в SOL"
                        min="0.0001"
                        max={vaultBalance}
                        step="0.0001"
                        className="amount-input"
                        disabled={isWalletLoading}
                      />
                      <button 
                        onClick={handleWithdraw}
                        className="action-button withdraw-button"
                        disabled={isWalletLoading || !withdrawAmount}
                      >
                        Вывести
                      </button>
                    </div>
                    <small className="input-hint">
                      Доступно: {vaultBalance.toFixed(4)} SOL
                    </small>
                  </div>
                </div>
              )}
            </div>
          )}

          
          
          <section className="features-section">
            <h3 className="section-title">Доступные функции:</h3>
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
          
          {/* Информация о Solana */}
          <div className="info-section">
            <h3 className="section-title">Информация о Solana</h3>
            <p>Используйте Phantom кошелек для работы с Solana блокчейном</p>
            <ul className="info-list">
              <li>✅ Безопасное хранение SOL</li>
              <li>✅ Быстрые и дешевые транзакции</li>
              <li>✅ Интеграция со смарт-контрактами</li>
              <li>✅ Поддержка множества dApps</li>
            </ul>
            
            {!phantomAvailable && (
              <div className="phantom-install">
                <h4>Установите Phantom кошелек</h4>
                <p>Для работы с SaveChain необходимо установить Phantom кошелек</p>
                <a 
                  href="https://phantom.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="install-button"
                >
                  Установить Phantom
                </a>
              </div>
            )}
          </div>
        </main>
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