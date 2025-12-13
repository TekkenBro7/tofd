import React, { useState, useEffect } from 'react';
import { makeAuthenticatedRequest } from '../../services/authApi';
import { solanaService } from '../../services/solanaService';
import { contractService } from '../../services/contractService';
import './GoalsPage.css';

const GoalsPage = () => {
  const [goal, setGoal] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vaultBalance, setVaultBalance] = useState(0);
  const [vaultAddress, setVaultAddress] = useState('');
  const [isClosingGoal, setIsClosingGoal] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  
  // Данные для формы
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [periodicityDays, setPeriodicityDays] = useState('7');
  
  // Загрузка активной цели и баланса копилки при монтировании
  useEffect(() => {
    fetchActiveGoal();
    fetchVaultBalance();
    checkWalletConnection();
  }, []);
  
  // Проверка подключения кошелька
  const checkWalletConnection = async () => {
    try {
      const storedWallet = await solanaService.getWalletFromStorage();
      setWalletConnected(!!storedWallet);
    } catch (error) {
      console.error('Ошибка проверки подключения кошелька:', error);
      setWalletConnected(false);
    }
  };
  
  // Функция загрузки активной цели
  const fetchActiveGoal = async () => {
    try {
      setLoading(true);
      const data = await makeAuthenticatedRequest('/goals/active');
      if (data) {
        setGoal(data);
      } else {
        setGoal(null);
      }
      setError('');
    } catch (err) {
      console.error('Ошибка при загрузке цели:', err);
      if (err.message !== 'Активная цель не найдена') {
        setError('Не удалось загрузить цель');
      }
      setGoal(null);
    } finally {
      setLoading(false);
    }
  };
  
  // Функция загрузки баланса копилки
  const fetchVaultBalance = async () => {
    try {
      // Получаем кошелек из localStorage или Phantom
      const phantomWallet = localStorage.getItem('phantom_wallet');
      if (!phantomWallet) {
        console.log('Кошелек Phantom не подключен');
        return;
      }
      
      const vaultInfo = await solanaService.getVaultBalance(phantomWallet);
      if (vaultInfo) {
        setVaultBalance(vaultInfo.balance);
        setVaultAddress(vaultInfo.vaultAddress);
      }
    } catch (error) {
      console.error('Ошибка получения баланса копилки:', error);
      setVaultBalance(0);
    }
  };
  
  // Сброс формы
  const resetForm = () => {
    setTitle('');
    setTargetAmount('');
    setDeadline('');
    setPeriodicityDays('7');
    setError('');
  };
  
  // Создание новой цели
  const handleCreateGoal = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !targetAmount || !deadline) {
      setError('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    try {
      setLoading(true);
      const newGoal = await makeAuthenticatedRequest('/goals', {
        method: 'POST',
        body: JSON.stringify({
          title,
          targetAmount,
          deadline,
          periodicityDays
        })
      });
      
      setGoal(newGoal);
      
      // Обновляем баланс копилки после создания цели
      await fetchVaultBalance();
      
      resetForm();
      setShowForm(false);
      setError('');
    } catch (err) {
      console.error('Ошибка при создании цели:', err);
      setError(err.message || 'Не удалось создать цель');
    } finally {
      setLoading(false);
    }
  };
  
  // Отмена активной цели (ранний вывод)
  const handleCancelGoal = async () => {
    if (!window.confirm('Вы уверены, что хотите отменить эту цель?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      // // Получаем адрес кошелька
      // const walletAddress = localStorage.getItem('phantom_wallet');
      // if (!walletAddress) {
      //   throw new Error('Кошелек не найден');
      // }
      
      // // Инициализируем провайдер контракта
      // if (window.solana) {
      //   await contractService.initializeProvider(window.solana);
      // }
      
      // // Выводим ВСЮ сумму из копилки (текущий баланс)
      // const amount = vaultBalance;
      // const result = await contractService.withdraw(walletAddress, amount);
      
      // // Отправляем подпись транзакции на сервер для подтверждения раннего вывода
      // const response = await makeAuthenticatedRequest('/sync/confirm-withdraw', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     signature: result.transaction
      //   })
      // });
      
      setGoal(null);
      
      // Обновляем баланс копилки после отмены цели
      // await fetchVaultBalance();
      
      alert(`✅ Цель отменена!`);
      
      setError('');
    } catch (err) {
      console.error('Ошибка при отмене цели:', err);
      setError(err.message || 'Не удалось отменить цель');
    } finally {
      setLoading(false);
    }
  };
  
  // Закрытие цели (вывод денег при достижении 100%)
  const handleCompleteGoal = async () => {
    if (!goal) return;
    
    if (!window.confirm(`Вы уверены, что хотите закрыть цель "${goal.title}"? На ваш кошелек будет переведено ${goal.targetAmount} SOL.`)) {
      return;
    }
    
    if (!walletConnected) {
      alert('Пожалуйста, подключите Phantom кошелек для выполнения операции.');
      return;
    }
    
    try {
      setIsClosingGoal(true);
      
      // Получаем адрес кошелька из localStorage
      const walletAddress = localStorage.getItem('phantom_wallet');
      if (!walletAddress) {
        throw new Error('Кошелек не найден');
      }
      
      // Инициализируем провайдер контракта
      if (window.solana) {
        await contractService.initializeProvider(window.solana);
      }
      
      // Выводим сумму цели из копилки
      const amount = parseFloat(goal.targetAmount);
      const result = await contractService.withdraw(walletAddress, amount);
      
      // Отправляем подпись транзакции на сервер для подтверждения вывода
      // Используем endpoint из sync-service.js
      try {
        const response = await makeAuthenticatedRequest('/sync/confirm-withdraw', {
          method: 'POST',
          body: JSON.stringify({
            signature: result.transaction
          })
        });
        
        console.log('Сервер подтвердил вывод:', response);
        
        // Сервер должен был отметить цель как завершенную в функции confirmWithdraw
        // Но давайте явно обновим статус цели на клиенте
        
      } catch (serverError) {
        console.warn('Не удалось подтвердить вывод на сервере:', serverError);
        // Продолжаем выполнение, так как транзакция в блокчейне уже выполнена
      }
      
      // Обновляем состояние - удаляем цель из интерфейса
      setGoal(null);
      
      // Обновляем баланс копилки
      await fetchVaultBalance();
      
      alert(`✅ Цель успешно закрыта! ${amount.toFixed(4)} SOL переведены на ваш кошелек.\n\nТранзакция: ${result.transaction}`);
      
    } catch (error) {
      console.error('Ошибка при закрытии цели:', error);
      alert('Ошибка при закрытии цели: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setIsClosingGoal(false);
    }
  };
  
  // Форматирование даты
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  // Форматирование валюты
  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount);
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'SOL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(numAmount);
  };
  
  // Расчет прогресса НА ОСНОВЕ РЕАЛЬНОГО БАЛАНСА КОПИЛКИ
  const calculateProgress = () => {
    if (!goal || !goal.targetAmount) return 0;
    const target = parseFloat(goal.targetAmount);
    if (target <= 0) return 0;
    const progress = (vaultBalance / target) * 100;
    return Math.min(100, Math.max(0, progress)); // Ограничиваем от 0 до 100%
  };
  
  // Проверка, достигнута ли цель (100% или больше)
  const isGoalCompleted = () => {
    return calculateProgress() >= 100;
  };
  
  // Расчет ежедневного взноса НА ОСНОВЕ РЕАЛЬНОГО БАЛАНСА КОПИЛКИ
  const calculateDailyContribution = () => {
    if (!goal) return 0;
    
    const target = parseFloat(goal.targetAmount);
    const accumulated = vaultBalance; // Используем реальный баланс копилки
    const deadlineDate = new Date(goal.deadline);
    const now = new Date();
    
    // Количество дней до дедлайна
    const timeDiff = deadlineDate.getTime() - now.getTime();
    const daysDiff = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
    
    if (daysDiff <= 0) return Math.max(0, target - accumulated);
    
    return (target - accumulated) / daysDiff;
  };
  
  // Расчет периодического взноса НА ОСНОВЕ РЕАЛЬНОГО БАЛАНСА КОПИЛКИ
  const calculatePeriodicContribution = () => {
    if (!goal) return 0;
    
    const target = parseFloat(goal.targetAmount);
    const accumulated = vaultBalance; // Используем реальный баланс копилки
    const periodDays = parseInt(goal.periodicityDays) || 7;
    
    // Количество периодов до дедлайна
    const deadlineDate = new Date(goal.deadline);
    const now = new Date();
    const timeDiff = deadlineDate.getTime() - now.getTime();
    const daysDiff = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
    const periodsCount = Math.max(1, Math.ceil(daysDiff / periodDays));
    
    if (periodsCount <= 0) return Math.max(0, target - accumulated);
    
    return (target - accumulated) / periodsCount;
  };
  
  const getPeriodicityLabel = (days) => {
    const daysNum = parseInt(days);
    switch (daysNum) {
      case 1: return 'Ежедневно';
      case 7: return 'Еженедельно';
      case 30: return 'Ежемесячно';
      default: return `Каждые ${daysNum} дней`;
    }
  };
  
  // Функция для обновления баланса копилки
  const handleRefreshBalance = async () => {
    await fetchVaultBalance();
  };
  
  if (loading && !goal) {
    return (
      <div className="goals-container">
        <div className="loading-spinner">Загрузка...</div>
      </div>
    );
  }
  
  return (
    <div className="goals-container">      
      <main className="main-content">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {goal ? (
          <div className="goals-list">
            <div className="goal-card">
              <div className="goal-header">
                <h3 className="goal-title">{goal.title}</h3>
                <div className="goal-actions">
                  {/* Кнопка обновления баланса */}
                  <button 
                    onClick={handleRefreshBalance}
                    className="refresh-balance-button"
                    title="Обновить баланс копилки"
                    disabled={isClosingGoal}
                  >
                    🔄
                  </button>
                  
                  {/* Условный рендеринг кнопок в зависимости от прогресса */}
                  {isGoalCompleted() ? (
                    <button 
                      onClick={handleCompleteGoal}
                      className="complete-goal-button"
                      disabled={isClosingGoal || !walletConnected}
                    >
                      {isClosingGoal ? 'Закрытие...' : 'Закрыть цель'}
                    </button>
                  ) : (
                    <button 
                      onClick={handleCancelGoal} 
                      className="delete-goal-button"
                      disabled={loading || isClosingGoal}
                    >
                      Отменить цель
                    </button>
                  )}
                </div>
              </div>
              
              <div className="goal-details">
                <div className="goal-detail">
                  <span className="detail-label">Цель:</span>
                  <span className="detail-value">{formatCurrency(goal.targetAmount)}</span>
                </div>
                <div className="goal-detail">
                  <span className="detail-label">Собрано:</span>
                  <span className="detail-value">
                    {vaultBalance.toFixed(4)} SOL
                    {vaultAddress && (
                      <span className="vault-hint" title={`Адрес копилки: ${vaultAddress}`}>
                        *
                      </span>
                    )}
                  </span>
                </div>
                <div className="goal-detail">
                  <span className="detail-label">Срок:</span>
                  <span className="detail-value">{formatDate(goal.deadline)}</span>
                </div>
                <div className="goal-detail">
                  <span className="detail-label">Период взносов:</span>
                  <span className="detail-value">{getPeriodicityLabel(goal.periodicityDays)}</span>
                </div>
                <div className="goal-detail">
                  <span className="detail-label">Взнос за период:</span>
                  <span className="detail-value">
                    {formatCurrency(calculatePeriodicContribution())}
                  </span>
                </div>
                <div className="goal-detail">
                  <span className="detail-label">Ежедневно:</span>
                  <span className="detail-value">
                    {formatCurrency(calculateDailyContribution())}
                  </span>
                </div>
              </div>
              
              <div className="goal-progress">
                <div className="progress-header">
                  <span>Прогресс</span>
                  <span>
                    {formatCurrency(vaultBalance)} из {formatCurrency(goal.targetAmount)}
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${calculateProgress()}%`,
                      background: isGoalCompleted() 
                        ? 'linear-gradient(90deg, #14F195 0%, #00D18C 100%)' 
                        : 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                    }}
                  ></div>
                </div>
                <div className="progress-percentage">
                  {calculateProgress().toFixed(1)}%
                  {isGoalCompleted() && (
                    <span style={{ marginLeft: '10px', color: '#14F195', fontWeight: 'bold' }}>
                      ✅ Цель достигнута!
                    </span>
                  )}
                </div>
              </div>
              
              <div className="goal-footer">
                <span className="created-date">
                  Статус: 
                  <span className={`status-${isGoalCompleted() ? 'completed' : 'active'}`} 
                        style={{ 
                          color: isGoalCompleted() ? '#14F195' : '#667eea',
                          fontWeight: 'bold',
                          marginLeft: '5px'
                        }}>
                    {isGoalCompleted() ? 'Готова к закрытию' : 'Активна'}
                  </span>
                </span>
                {isGoalCompleted() && !walletConnected && (
                  <div style={{ marginTop: '10px', color: '#f56565', fontSize: '12px' }}>
                    ⚠️ Для закрытия цели подключите Phantom кошелек
                  </div>
                )}
                {isGoalCompleted() && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#4a5568' }}>
                    🎉 Поздравляем! Вы накопили нужную сумму. Нажмите "Закрыть цель", чтобы вывести средства на кошелек.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3>У вас пока нет цели</h3>
            <p>Создайте цель для накопления</p>
            <button 
              onClick={() => setShowForm(true)} 
              className="create-first-goal-button"
              disabled={loading}
            >
              Создать цель
            </button>
          </div>
        )}
        
        {/* Информация о системе целей */}
        <div className="info-section" style={{ marginTop: '40px', background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
          <h3>Как работает система целей?</h3>
          <p>Баланс копилки отображается в реальном времени из Solana блокчейна. Прогресс рассчитывается на основе текущего баланса.</p>
          <ul className="info-list" style={{ marginTop: '15px', paddingLeft: '20px' }}>
            <li>✅ Реальный баланс из Solana блокчейна</li>
            <li>✅ Автоматическое отслеживание прогресса</li>
            <li>✅ При достижении 100% - кнопка "Закрыть цель" для вывода средств</li>
            <li>✅ Возможность отменить цель в любой момент (ранний вывод)</li>
            <li>✅ Деньги возвращаются на ваш счет при отмене</li>
            <li>✅ Настройте периодичность взносов под свои возможности</li>
          </ul>
          
          <div style={{ marginTop: '20px', padding: '15px', background: '#f0f9ff', borderRadius: '10px', borderLeft: '4px solid #667eea' }}>
            <h4 style={{ color: '#2d3748', marginBottom: '10px' }}>Важно!</h4>
            <p style={{ fontSize: '14px', color: '#4a5568', marginBottom: '10px' }}>
              При закрытии цели (достижении 100%) средства автоматически выводятся на ваш Phantom кошелек.
              При отмене цели (раннем выводе) также происходит возврат средств, но это может повлиять на вашу статистику.
            </p>
          </div>
          
          {vaultAddress && (
            <div className="vault-info-section" style={{ marginTop: '15px', padding: '10px', background: '#f0f8ff', borderRadius: '8px' }}>
              <small style={{ fontSize: '12px' }}>
                Адрес копилки: {vaultAddress.substring(0, 20)}...{vaultAddress.substring(vaultAddress.length - 6)}
                <button 
                  onClick={() => navigator.clipboard.writeText(vaultAddress)}
                  style={{ marginLeft: '10px', background: 'none', border: 'none', cursor: 'pointer' }}
                  title="Скопировать адрес"
                >
                  📋
                </button>
              </small>
            </div>
          )}
        </div>
      </main>
      
      {/* Модальное окно для создания цели */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Создать новую цель</h2>
              <button 
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }} 
                className="close-modal"
                disabled={loading}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleCreateGoal} className="goal-form">
              <div className="form-group">
                <label htmlFor="title">Название цели *</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: Новый ноутбук"
                  className="form-input"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="targetAmount">Целевая сумма (SOL) *</label>
                  <input
                    type="number"
                    id="targetAmount"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="50000"
                    className="form-input"
                    min="1"
                    step="0.0001"
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="deadline">Срок достижения *</label>
                  <input
                    type="date"
                    id="deadline"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="form-input"
                    min={new Date().toISOString().split('T')[0]}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="periodicityDays">Периодичность взносов (в днях)</label>
                <select
                  id="periodicityDays"
                  value={periodicityDays}
                  onChange={(e) => setPeriodicityDays(e.target.value)}
                  className="form-input"
                  disabled={loading}
                >
                  <option value="1">Ежедневно (1 день)</option>
                  <option value="7">Еженедельно (7 дней)</option>
                  <option value="14">Раз в две недели (14 дней)</option>
                  <option value="30">Ежемесячно (30 дней)</option>
                  <option value="90">Ежеквартально (90 дней)</option>
                </select>
                <small className="form-help">
                  С какой периодичностью вы планируете делать взносы для достижения цели
                </small>
              </div>
              
              {error && (
                <div className="error-message" style={{ marginBottom: '20px' }}>
                  {error}
                </div>
              )}
              
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }} 
                  className="cancel-button"
                  disabled={loading}
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? 'Создание...' : 'Создать цель'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default GoalsPage;
