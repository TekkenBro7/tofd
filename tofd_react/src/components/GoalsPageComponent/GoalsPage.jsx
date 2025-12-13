import React, { useState, useEffect } from 'react';
import { makeAuthenticatedRequest } from '../../services/authApi';
import './GoalsPage.css';

const GoalsPage = () => {
  const [goal, setGoal] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Данные для формы
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [periodicityDays, setPeriodicityDays] = useState('7');
  
  // Загрузка активной цели при монтировании
  useEffect(() => {
    fetchActiveGoal();
  }, []);
  
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
  
  // Отмена активной цели
  const handleCancelGoal = async () => {
    if (!window.confirm('Вы уверены, что хотите отменить эту цель? Деньги будут возвращены на ваш счет.')) {
      return;
    }
    
    try {
      setLoading(true);
      await makeAuthenticatedRequest('/goals/cancel', {
        method: 'POST'
      });
      
      setGoal(null);
      setError('');
    } catch (err) {
      console.error('Ошибка при отмене цели:', err);
      setError(err.message || 'Не удалось отменить цель');
    } finally {
      setLoading(false);
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
      minimumFractionDigits: 0
    }).format(numAmount);
  };
  
  // Расчет прогресса
  const calculateProgress = () => {
    if (!goal) return 0;
    const target = parseFloat(goal.targetAmount);
    const accumulated = parseFloat(goal.accumulatedAmount);
    return Math.min(100, (accumulated / target) * 100);
  };
  
  // Расчет ежедневного взноса
  const calculateDailyContribution = () => {
    if (!goal) return 0;
    
    const target = parseFloat(goal.targetAmount);
    const accumulated = parseFloat(goal.accumulatedAmount);
    const deadlineDate = new Date(goal.deadline);
    const now = new Date();
    
    // Количество дней до дедлайна
    const timeDiff = deadlineDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff <= 0) return target - accumulated;
    
    return (target - accumulated) / daysDiff;
  };
  
  // Расчет ежедневного взноса на основе периодичности
  const calculatePeriodicContribution = () => {
    if (!goal) return 0;
    
    const target = parseFloat(goal.targetAmount);
    const accumulated = parseFloat(goal.accumulatedAmount);
    const periodDays = parseInt(goal.periodicityDays) || 7;
    
    // Количество периодов до дедлайна
    const deadlineDate = new Date(goal.deadline);
    const now = new Date();
    const timeDiff = deadlineDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const periodsCount = Math.ceil(daysDiff / periodDays);
    
    if (periodsCount <= 0) return target - accumulated;
    
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
                  <button 
                    onClick={handleCancelGoal} 
                    className="delete-goal-button"
                    disabled={loading}
                  >
                    Отменить цель
                  </button>
                </div>
              </div>
              
              <div className="goal-details">
                <div className="goal-detail">
                  <span className="detail-label">Цель:</span>
                  <span className="detail-value">{formatCurrency(goal.targetAmount)}</span>
                </div>
                <div className="goal-detail">
                  <span className="detail-label">Собрано:</span>
                  <span className="detail-value">{formatCurrency(goal.accumulatedAmount)}</span>
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
                    {formatCurrency(goal.accumulatedAmount)} из {formatCurrency(goal.targetAmount)}
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${calculateProgress()}%` }}
                  ></div>
                </div>
                <div className="progress-percentage">
                  {calculateProgress().toFixed(1)}%
                </div>
              </div>
              
              <div className="goal-footer">
                <span className="created-date">
                  Статус: <span className="status-active">Активна</span>
                </span>
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
          <p>Вы можете создать только одну активную цель одновременно. Это помогает сосредоточиться на достижении одного финансового результата.</p>
          <ul className="info-list" style={{ marginTop: '15px', paddingLeft: '20px' }}>
            <li>✅ Одна активная цель одновременно</li>
            <li>✅ Автоматическое отслеживание прогресса</li>
            <li>✅ Возможность отменить цель в любой момент</li>
            <li>✅ Деньги возвращаются на ваш счет при отмене</li>
            <li>✅ Настройте периодичность взносов под свои возможности</li>
          </ul>
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