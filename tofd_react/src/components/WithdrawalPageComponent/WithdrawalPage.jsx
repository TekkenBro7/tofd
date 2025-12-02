import React, { useState } from 'react';
import './WithdrawalPage.css';

const WithdrawalPage = () => {
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [targetGoal, setTargetGoal] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  // Заглушечные данные
  const goals = [
    { id: 'goal1', title: 'Новый ноутбук', saved: 45000, total: 80000 },
    { id: 'goal2', title: 'Отпуск', saved: 15000, total: 60000 },
    { id: 'goal3', title: 'Курсы', saved: 8000, total: 25000 },
  ];

  const cards = [
    { id: 'card1', number: '**** 1234', type: 'Visa', bank: 'Тинькофф' },
    { id: 'card2', number: '**** 5678', type: 'MasterCard', bank: 'Сбербанк' },
  ];

  const handleWithdrawal = (e) => {
    e.preventDefault();
    
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      alert('Пожалуйста, введите корректную сумму');
      return;
    }
    
    if (!targetGoal) {
      alert('Пожалуйста, выберите цель для снятия');
      return;
    }
    
    if (!selectedCard) {
      alert('Пожалуйста, выберите карту для зачисления');
      return;
    }
    
    // Генерируем ID транзакции
    const newTransactionId = 'TXN-' + Date.now();
    setTransactionId(newTransactionId);
    setShowConfirmation(true);
  };

  const handleConfirmWithdrawal = () => {
    alert(`Средства успешно переведены! ID транзакции: ${transactionId}`);
    setShowConfirmation(false);
    setWithdrawalAmount('');
    setTargetGoal('');
    setSelectedCard('');
    setTransactionId('');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const calculateAvailableForGoal = (goalId) => {
    const goal = goals.find(g => g.id === goalId);
    return goal ? goal.saved : 0;
  };

  const selectedGoal = goals.find(g => g.id === targetGoal);
  const availableAmount = selectedGoal ? selectedGoal.saved : 0;

  return (
    <div className="withdrawal-container">
      <header className="page-header">
        <div className="header-content">
          <h1 className="page-title">Снятие средств</h1>
          <div className="total-saved">
            <span className="saved-label">Всего накоплено:</span>
            <span className="saved-value">
              {formatCurrency(goals.reduce((sum, goal) => sum + goal.saved, 0))}
            </span>
          </div>
        </div>
      </header>
      
      <main className="page-main-content">
        <div className="withdrawal-process">
          <div className="process-steps">
            <div className={`step ${!targetGoal ? 'active' : 'completed'}`}>
              <div className="step-number">1</div>
              <div className="step-info">
                <h3>Выберите цель</h3>
                <p>Из какой цели снимаем средства</p>
              </div>
            </div>
            <div className={`step ${targetGoal && !withdrawalAmount ? 'active' : targetGoal ? 'completed' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-info">
                <h3>Укажите сумму</h3>
                <p>Сколько хотите снять</p>
              </div>
            </div>
            <div className={`step ${withdrawalAmount && !selectedCard ? 'active' : selectedCard ? 'completed' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-info">
                <h3>Выберите карту</h3>
                <p>Куда перевести деньги</p>
              </div>
            </div>
          </div>
          
          <div className="withdrawal-form-section">
            <h2>Снятие средств из копилки</h2>
            <p>Переведите накопленные средства на свою банковскую карту</p>
            
            <form onSubmit={handleWithdrawal} className="withdrawal-form">
              {/* Шаг 1: Выбор цели */}
              <div className="form-step">
                <h3>1. Выберите цель</h3>
                <div className="goals-list">
                  {goals.map((goal) => (
                    <div 
                      key={goal.id}
                      className={`goal-item ${targetGoal === goal.id ? 'selected' : ''}`}
                      onClick={() => {
                        setTargetGoal(goal.id);
                        if (parseFloat(withdrawalAmount) > goal.saved) {
                          setWithdrawalAmount(goal.saved.toString());
                        }
                      }}
                    >
                      <div className="goal-icon">🎯</div>
                      <div className="goal-info">
                        <div className="goal-title">{goal.title}</div>
                        <div className="goal-amounts">
                          <span className="saved-amount">{formatCurrency(goal.saved)}</span>
                          <span className="total-amount">из {formatCurrency(goal.total)}</span>
                        </div>
                      </div>
                      <div className="goal-selector">
                        {targetGoal === goal.id && <div className="selected-indicator">✓</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Шаг 2: Ввод суммы */}
              <div className="form-step">
                <h3>2. Укажите сумму снятия</h3>
                <div className="amount-section">
                  <div className="available-amount">
                    <span>Доступно для снятия:</span>
                    <span className="available-value">
                      {targetGoal ? formatCurrency(calculateAvailableForGoal(targetGoal)) : 'Выберите цель'}
                    </span>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="withdrawalAmount">Сумма снятия (руб)</label>
                    <div className="amount-input-group">
                      <input
                        type="number"
                        id="withdrawalAmount"
                        value={withdrawalAmount}
                        onChange={(e) => setWithdrawalAmount(e.target.value)}
                        placeholder="Введите сумму"
                        className="form-input"
                        min="10"
                        max={availableAmount}
                        step="10"
                        disabled={!targetGoal}
                      />
                      <button 
                        type="button" 
                        className="max-amount-btn"
                        onClick={() => setWithdrawalAmount(availableAmount.toString())}
                        disabled={!targetGoal}
                      >
                        Макс. сумма
                      </button>
                    </div>
                    <div className="amount-hint">
                      Минимальная сумма для снятия: 10 ₽
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Шаг 3: Выбор карты */}
              <div className="form-step">
                <h3>3. Выберите карту для зачисления</h3>
                <div className="cards-list">
                  {cards.map((card) => (
                    <div 
                      key={card.id}
                      className={`card-item ${selectedCard === card.id ? 'selected' : ''}`}
                      onClick={() => setSelectedCard(card.id)}
                    >
                      <div className="card-icon">{card.type === 'Visa' ? '💳' : '🏦'}</div>
                      <div className="card-info">
                        <div className="card-number">{card.number}</div>
                        <div className="card-bank">{card.bank}</div>
                      </div>
                      <div className="card-selector">
                        {selectedCard === card.id && <div className="selected-indicator">✓</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Сводка */}
              <div className="withdrawal-summary">
                <h4>Сводка операции:</h4>
                <div className="summary-items">
                  <div className="summary-item">
                    <span>Цель:</span>
                    <span>{selectedGoal?.title || 'Не выбрана'}</span>
                  </div>
                  <div className="summary-item">
                    <span>Сумма снятия:</span>
                    <span>{withdrawalAmount ? formatCurrency(parseFloat(withdrawalAmount)) : '0 ₽'}</span>
                  </div>
                  <div className="summary-item">
                    <span>Карта получения:</span>
                    <span>{cards.find(c => c.id === selectedCard)?.number || 'Не выбрана'}</span>
                  </div>
                  <div className="summary-item total">
                    <span>Будет зачислено:</span>
                    <span>{withdrawalAmount ? formatCurrency(parseFloat(withdrawalAmount)) : '0 ₽'}</span>
                  </div>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="submit-button"
                disabled={!withdrawalAmount || !targetGoal || !selectedCard}
              >
                Снять средства
              </button>
            </form>
          </div>
          
          <div className="withdrawal-info-section">
            <div className="info-card">
              <h3>Важная информация</h3>
              <ul className="info-list">
                <li>⏱️ Средства поступают на карту в течение 1-3 рабочих дней</li>
                <li>💸 Комиссия за снятие отсутствует</li>
                <li>🔒 Все операции защищены и логируются</li>
                <li>📧 Вы получите уведомление о переводе</li>
                <li>⚖️ Снимать можно только собранную часть цели</li>
              </ul>
              
              <div className="limits-info">
                <h4>Ограничения:</h4>
                <p>• Минимальная сумма снятия: 10 ₽</p>
                <p>• Не более 3 операций снятия в день</p>
                <p>• Максимальная сумма за операцию: 50 000 ₽</p>
                <p>• Снятие возможно только с целей, где есть накопления</p>
              </div>
              
              <div className="balance-after-withdrawal">
                <h4>После снятия:</h4>
                <p>Остаток в цели "{selectedGoal?.title || "___"}":</p>
                <p className="remaining-amount">
                  {targetGoal && withdrawalAmount 
                    ? formatCurrency(availableAmount - parseFloat(withdrawalAmount))
                    : formatCurrency(availableAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Модальное окно подтверждения */}
        {showConfirmation && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Подтверждение снятия</h2>
                <button 
                  onClick={() => setShowConfirmation(false)} 
                  className="close-modal"
                >
                  ×
                </button>
              </div>
              
              <div className="modal-body">
                <div className="confirmation-icon">⚠️</div>
                <h3>Вы уверены, что хотите снять средства?</h3>
                
                <div className="confirmation-details">
                  <div className="detail-item">
                    <span>Цель:</span>
                    <span>{selectedGoal?.title}</span>
                  </div>
                  <div className="detail-item">
                    <span>Сумма:</span>
                    <span>{formatCurrency(parseFloat(withdrawalAmount))}</span>
                  </div>
                  <div className="detail-item">
                    <span>Карта получения:</span>
                    <span>{cards.find(c => c.id === selectedCard)?.number}</span>
                  </div>
                  <div className="detail-item">
                    <span>ID транзакции:</span>
                    <span className="transaction-id">{transactionId}</span>
                  </div>
                </div>
                
                <p className="confirmation-warning">
                  После подтверждения операцию нельзя будет отменить. 
                  Средства будут переведены на вашу карту в течение 1-3 рабочих дней.
                </p>
                
                <div className="modal-actions">
                  <button 
                    onClick={() => setShowConfirmation(false)} 
                    className="cancel-button"
                  >
                    Отмена
                  </button>
                  <button 
                    onClick={handleConfirmWithdrawal} 
                    className="confirm-button"
                  >
                    Подтвердить снятие
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="withdrawal-history">
          <h3>История снятий</h3>
          <div className="empty-history">
            <div className="empty-icon">📋</div>
            <p>Здесь будет отображаться история ваших снятий</p>
            <p className="empty-subtext">Совершите первое снятие, чтобы увидеть историю операций</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WithdrawalPage;