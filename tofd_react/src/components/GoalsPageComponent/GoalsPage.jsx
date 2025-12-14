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
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [userStats, setUserStats] = useState({
    rating: 0,
    achievements: []
  });

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
    fetchUserStats();
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

  // Загрузка статистики пользователя
  const fetchUserStats = async () => {
    try {
      const stats = await makeAuthenticatedRequest('/stats');
      if (stats) {
        setUserStats(stats);
      }
    } catch (error) {
      console.warn('Не удалось загрузить статистику пользователя:', error);
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

 
  // Функция для расчета суммы с учетом комиссии (выводим меньше чем есть)
  const calculateWithdrawAmountWithFee = (balance, isFullWithdraw = true) => {
    // Комиссия Phantom (около 0.000005 SOL - меньше 0.00001)
    const FEE = 0.00001;

    if (isFullWithdraw) {
      // Для полного вывода (отмена цели) - выводим на FEE меньше
      if (balance <= FEE) {
        return {
          withdrawAmount: 0,
          fee: FEE,
          canWithdraw: false,
          message: `Недостаточно средств для вывода. Баланс должен быть больше ${FEE.toFixed(6)} SOL`
        };
      }

      // Выводим на комиссию меньше
      const withdrawAmount = balance - FEE;

      return {
        withdrawAmount,
        fee: FEE,
        canWithdraw: true,
        message: `Будет выведено: ${withdrawAmount.toFixed(6)} SOL (остаток ${FEE.toFixed(6)} SOL на комиссию)`
      };
    } else {
      // Для частичного вывода (завершенная цель) - выводим целевую сумму минус комиссия
      if (balance <= FEE) {
        return {
          withdrawAmount: 0,
          fee: FEE,
          canWithdraw: false,
          message: `Целевая сумма слишком мала для вывода. Должна быть больше ${FEE.toFixed(6)} SOL`
        };
      }

      // Для целевой суммы просто вычитаем комиссию
      const withdrawAmount = balance - FEE;

      return {
        withdrawAmount,
        fee: FEE,
        canWithdraw: true,
        message: `Будет выведено: ${withdrawAmount.toFixed(6)} SOL (комиссия: ${FEE.toFixed(6)} SOL)`
      };
    }
  };

  // Отмена активной цели - ВЫВОД ВСЕГО БАЛАНСА КОПИЛКИ С УЧЕТОМ КОМИССИИ
  const handleCancelGoal = async () => {
    if (!goal) return;

    // Рассчитываем сумму вывода с учетом комиссии (полный вывод)
    const withdrawInfo = calculateWithdrawAmountWithFee(vaultBalance, true);

    if (!withdrawInfo.canWithdraw) {
      alert(withdrawInfo.message);
      return;
    }

    const confirmMessage = `Вы уверены, что хотите отменить цель "${goal.title}"?\n\n` +
      `Баланс копилки: ${vaultBalance.toFixed(6)} SOL\n` +
      `${withdrawInfo.message}\n\n` +
      `Цель будет удалена.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    if (!walletConnected) {
      alert('Пожалуйста, подключите Phantom кошелек для выполнения операции.');
      return;
    }

    try {
      setIsProcessing(true);

      // Получаем адрес кошелька
      const walletAddress = localStorage.getItem('phantom_wallet');
      if (!walletAddress) {
        throw new Error('Кошелек не найден');
      }

      // Инициализируем провайдер контракта
      if (window.solana) {
        await contractService.initializeProvider(window.solana);
      }

      // Выводим баланс с учетом комиссии (на FEE меньше)
      const amount = withdrawInfo.withdrawAmount;
      const result = await contractService.withdraw(walletAddress, amount);

      // Отправляем подпись транзакции на сервер для подтверждения снятия
      const response = await makeAuthenticatedRequest('/sync/withdraw', {
        method: 'POST',
        body: JSON.stringify({
          signature: result.transaction
        })
      });

      // Обновляем статистику
      if (response) {
        setUserStats({
          rating: response.rating || userStats.rating,
          achievements: response.achievements || userStats.achievements
        });
      }

      // Удаляем цель из интерфейса (сервер отметит ее как cancelled)
      setGoal(null);

      // Обновляем баланс копилки
      await fetchVaultBalance();

      alert(`✅ Цель отменена! Выведено: ${amount.toFixed(6)} SOL\n` +
        `Комиссия: ${withdrawInfo.fee.toFixed(6)} SOL\n` +
        `Транзакция: ${result.transaction}`);

    } catch (err) {
      console.error('Ошибка при отмене цели:', err);
      alert('Ошибка при отмене цели: ' + (err.message || 'Неизвестная ошибка'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Вывод средств после завершения цели С УЧЕТОМ КОМИССИИ
  const handleWithdrawCompletedGoal = async () => {
    if (!goal) return;

    const targetAmountNum = parseFloat(goal.targetAmount);

    // Проверяем, достаточно ли средств для вывода цели с учетом комиссии
    const withdrawInfo = calculateWithdrawAmountWithFee(targetAmountNum, false);

    if (!withdrawInfo.canWithdraw) {
      alert(`Недостаточно средств для вывода цели.\n${withdrawInfo.message}`);
      return;
    }

    // Проверяем, что в копилке достаточно средств для вывода цели
    if (vaultBalance < targetAmountNum) {
      alert(`В копилке недостаточно средств для вывода цели.\n` +
        `Требуется: ${targetAmountNum.toFixed(6)} SOL\n` +
        `В копилке: ${vaultBalance.toFixed(6)} SOL`);
      return;
    }

    const confirmMessage = `Вывести средства по завершенной цели "${goal.title}"?\n\n` +
      `Целевая сумма: ${targetAmountNum.toFixed(6)} SOL\n` +
      `${withdrawInfo.message}\n\n` +
      `Цель будет удалена.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    if (!walletConnected) {
      alert('Пожалуйста, подключите Phantom кошелек для выполнения операции.');
      return;
    }

    try {
      setIsProcessing(true);

      // Получаем адрес кошелька
      const walletAddress = localStorage.getItem('phantom_wallet');
      if (!walletAddress) {
        throw new Error('Кошелек не найден');
      }

      // Инициализируем провайдер контракта
      if (window.solana) {
        await contractService.initializeProvider(window.solana);
      }

      // Выводим сумму цели из копилки (целевая сумма за вычетом комиссии)
      const amount = withdrawInfo.withdrawAmount;
      const result = await contractService.withdraw(walletAddress, amount);

      // Отправляем подпись транзакции на сервер
      const response = await makeAuthenticatedRequest('/sync/withdraw', {
        method: 'POST',
        body: JSON.stringify({
          signature: result.transaction
        })
      });

      // Обновляем статистику
      if (response) {
        setUserStats({
          rating: response.rating || userStats.rating,
          achievements: response.achievements || userStats.achievements
        });
      }

      // Удаляем цель из интерфейса
      setGoal(null);

      // Обновляем баланс копилки
      await fetchVaultBalance();

      alert(`✅ Средства по завершенной цели выведены! Выведено: ${amount.toFixed(6)} SOL\n` +
        `Комиссия: ${withdrawInfo.fee.toFixed(6)} SOL\n` +
        `Транзакция: ${result.transaction}`);

    } catch (error) {
      console.error('Ошибка при выводе средств по завершенной цели:', error);
      alert('Ошибка при выводе средств: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Проверка, достигнута ли цель (100% или больше)
  const isGoalCompleted = () => {
    if (!goal || !goal.targetAmount) return false;
    const target = parseFloat(goal.targetAmount);
    if (target <= 0) return false;
    const progress = (vaultBalance / target) * 100;
    return progress >= 100;
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
      maximumFractionDigits: 6
    }).format(numAmount);
  };

  // Расчет прогресса
  const calculateProgress = () => {
    if (!goal || !goal.targetAmount) return 0;
    const target = parseFloat(goal.targetAmount);
    if (target <= 0) return 0;
    const progress = (vaultBalance / target) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  // Расчет ежедневного взноса
  const calculateDailyContribution = () => {
    if (!goal) return 0;

    const target = parseFloat(goal.targetAmount);
    const accumulated = vaultBalance;
    const deadlineDate = new Date(goal.deadline);
    const now = new Date();

    const timeDiff = deadlineDate.getTime() - now.getTime();
    const daysDiff = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));

    if (daysDiff <= 0) return Math.max(0, target - accumulated);

    return (target - accumulated) / daysDiff;
  };

  // Расчет периодического взноса
  const calculatePeriodicContribution = () => {
    if (!goal) return 0;

    const target = parseFloat(goal.targetAmount);
    const accumulated = vaultBalance;
    const periodDays = parseInt(goal.periodicityDays) || 7;

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
                    disabled={isProcessing}
                  >
                    🔄
                  </button>

                  {/* Условный рендеринг кнопок в зависимости от статуса */}
                  {isGoalCompleted() ? (
                    <button
                      onClick={handleWithdrawCompletedGoal}
                      className="complete-goal-button"
                      disabled={isProcessing || !walletConnected}
                    >
                      {isProcessing ? 'Вывод...' : 'Вывести средства'}
                    </button>
                  ) : (
                    <button
                      onClick={handleCancelGoal}
                      className="delete-goal-button"
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Отмена...' : 'Отменить цель'}
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
                    {vaultBalance.toFixed(6)} SOL
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
                    {isGoalCompleted() ? 'Выполнена' : 'Активна'}
                  </span>
                </span>

                {isGoalCompleted() && !walletConnected && (
                  <div style={{ marginTop: '10px', color: '#f56565', fontSize: '12px' }}>
                    ⚠️ Для вывода средств подключите Phantom кошелек
                  </div>
                )}

                {isGoalCompleted() && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#4a5568' }}>
                    🎉 Поздравляем! Цель достигнута. Нажмите "Вывести средства" для получения средств на ваш кошелек.
                    <br />
                    <small style={{ color: '#a0aec0' }}>
                      * Комиссия Phantom составляет ~0.00001 SOL
                    </small>
                  </div>
                )}

                {!isGoalCompleted() && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#4a5568' }}>
                    💡 Цель завершится автоматически при достижении 100%. Для отмены нажмите "Отменить цель".
                    <br />
                    <small style={{ color: '#a0aec0' }}>
                      * При отмене будет выведен весь баланс копилки за вычетом комиссии
                    </small>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3>У вас пока нет активной цели</h3>
            <p>Создайте новую цель для накопления</p>
            <button
              onClick={() => setShowForm(true)}
              className="create-first-goal-button"
              disabled={loading}
            >
              Создать цель
            </button>

            {vaultBalance > 0 && (
              <div style={{ marginTop: '30px', padding: '20px', background: '#f0f9ff', borderRadius: '10px' }}>
                <h4 style={{ color: '#2d3748', marginBottom: '10px' }}>Средства в копилке</h4>
                <p style={{ color: '#4a5568', marginBottom: '15px' }}>
                  В вашей копилке есть {vaultBalance.toFixed(6)} SOL. Создайте новую цель, чтобы продолжить накопления.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Информация о системе целей */}
        <div className="info-section" style={{ marginTop: '40px', background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
          <h3>Как работает система целей?</h3>
          <p>1. Создайте цель с указанием суммы и срока</p>
          <p>2. Пополняйте копилку на главной странице (кнопка "Пополнить копилку")</p>
          <p>3. При каждом пополнении система автоматически проверяет достижение цели</p>
          <p>4. При достижении 100% цель переходит в статус "Выполнена" автоматически</p>
          <p>5. Выведите средства по завершенной цели нажатием кнопки "Вывести средства"</p>

          <div style={{ marginTop: '20px', padding: '15px', background: '#f0f9ff', borderRadius: '10px', borderLeft: '4px solid #667eea' }}>
            <h4 style={{ color: '#2d3748', marginBottom: '10px' }}>Важно! Комиссии Phantom</h4>
            <p style={{ fontSize: '14px', color: '#4a5568', marginBottom: '10px' }}>
              <strong>Комиссия за транзакцию:</strong> ~0.00001 SOL
            </p>
            <p style={{ fontSize: '14px', color: '#4a5568', marginBottom: '10px' }}>
              <strong>Отмена цели:</strong> Выводится весь баланс копилки <strong>за вычетом комиссии</strong>.
            </p>
            <p style={{ fontSize: '14px', color: '#4a5568' }}>
              <strong>Завершение цели:</strong> Выводится целевая сумма <strong>за вычетом комиссии</strong>.
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
                    min="0.00002" // Минимум больше чем комиссия
                    step="0.00001"
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

              <div className="form-group">
                <small style={{ color: '#a0aec0', fontSize: '12px' }}>
                  * Минимальная целевая сумма: 0.00002 SOL (больше чем комиссия Phantom)
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
