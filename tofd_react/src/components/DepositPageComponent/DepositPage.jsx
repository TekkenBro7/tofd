import React, { useState } from 'react';
import './DepositPage.css';

const DepositPage = () => {
  const [amount, setAmount] = useState('');
  const [depositType, setDepositType] = useState('one-time');
  const [autoDepositAmount, setAutoDepositAmount] = useState('');
  const [autoDepositPeriod, setAutoDepositPeriod] = useState('monthly');
  const [selectedCard, setSelectedCard] = useState('card1');
  const [showSuccess, setShowSuccess] = useState(false);

  // Заглушечные данные карт
  const cards = [
    { id: 'card1', number: '**** 1234', type: 'Visa', balance: 15430 },
    { id: 'card2', number: '**** 5678', type: 'MasterCard', balance: 8250 },
  ];

  const handleDeposit = (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      alert('Пожалуйста, введите корректную сумму');
      return;
    }
    
    // Симуляция успешного пополнения
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setAmount('');
    }, 3000);
  };

  const handleAutoDeposit = (e) => {
    e.preventDefault();
    
    if (!autoDepositAmount || parseFloat(autoDepositAmount) <= 0) {
      alert('Пожалуйста, введите корректную сумму');
      return;
    }
    
    alert(`Автоматическое пополнение настроено: ${autoDepositAmount} руб. ${autoDepositPeriod === 'monthly' ? 'ежемесячно' : autoDepositPeriod === 'weekly' ? 'еженедельно' : 'ежедневно'}`);
    setAutoDepositAmount('');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPeriodLabel = (period) => {
    const periods = {
      daily: 'Ежедневно',
      weekly: 'Еженедельно',
      monthly: 'Ежемесячно'
    };
    return periods[period] || period;
  };

  return (
    <div className="deposit-container">
      <header className="page-header">
        <div className="header-content">
          <h1 className="page-title">Пополнение счета</h1>
          <div className="balance-info">
            <span className="balance-label">Доступно на картах:</span>
            <span className="balance-value">{formatCurrency(cards.reduce((sum, card) => sum + card.balance, 0))}</span>
          </div>
        </div>
      </header>
      
      <main className="page-main-content">
        <div className="deposit-tabs">
          <button 
            className={`tab-button ${depositType === 'one-time' ? 'active' : ''}`}
            onClick={() => setDepositType('one-time')}
          >
            Разовое пополнение
          </button>
          <button 
            className={`tab-button ${depositType === 'auto' ? 'active' : ''}`}
            onClick={() => setDepositType('auto')}
          >
            Автоматическое пополнение
          </button>
        </div>
        
        {depositType === 'one-time' ? (
          <div className="one-time-deposit">
            <div className="deposit-form-section">
              <h2>Разовое пополнение копилки</h2>
              <p>Выберите карту и укажите сумму для пополнения</p>
              
              <div className="cards-section">
                <h3>Выберите карту</h3>
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
                        <div className="card-balance">{formatCurrency(card.balance)}</div>
                      </div>
                      <div className="card-selector">
                        {selectedCard === card.id && <div className="selected-indicator">✓</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <form onSubmit={handleDeposit} className="deposit-form">
                <div className="form-group">
                  <label htmlFor="amount">Сумма пополнения (руб)</label>
                  <div className="amount-input-group">
                    <input
                      type="number"
                      id="amount"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Введите сумму"
                      className="form-input"
                      min="10"
                      step="10"
                    />
                    <div className="quick-amounts">
                      <button 
                        type="button" 
                        className="quick-amount-btn"
                        onClick={() => setAmount('100')}
                      >
                        100 ₽
                      </button>
                      <button 
                        type="button" 
                        className="quick-amount-btn"
                        onClick={() => setAmount('500')}
                      >
                        500 ₽
                      </button>
                      <button 
                        type="button" 
                        className="quick-amount-btn"
                        onClick={() => setAmount('1000')}
                      >
                        1000 ₽
                      </button>
                      <button 
                        type="button" 
                        className="quick-amount-btn"
                        onClick={() => setAmount('5000')}
                      >
                        5000 ₽
                      </button>
                    </div>
                  </div>
                </div>
                
                <button type="submit" className="submit-button">
                  Пополнить копилку
                </button>
              </form>
              
              {showSuccess && (
                <div className="success-message">
                  <div className="success-icon">✅</div>
                  <div className="success-text">
                    <h4>Успешно!</h4>
                    <p>Счет пополнен на {formatCurrency(parseFloat(amount))}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="deposit-info-section">
              <div className="info-card">
                <h3>Как работает пополнение?</h3>
                <ul className="info-list">
                  <li>💸 Сумма списывается с выбранной банковской карты</li>
                  <li>⚡ Перевод происходит мгновенно</li>
                  <li>🔒 Все операции защищены шифрованием</li>
                  <li>📊 Сумма пополнения добавляется к общему балансу копилки</li>
                  <li>🎯 Средства можно распределить по вашим целям</li>
                </ul>
                
                <div className="limits-info">
                  <h4>Лимиты:</h4>
                  <p>• Минимальная сумма: 10 ₽</p>
                  <p>• Максимальная сумма: 50 000 ₽ за операцию</p>
                  <p>• Не более 5 операций в день</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="auto-deposit">
            <div className="deposit-form-section">
              <h2>Настройка автоматического пополнения</h2>
              <p>Установите регулярные автоматические переводы в копилку</p>
              
              <form onSubmit={handleAutoDeposit} className="deposit-form">
                <div className="form-group">
                  <label htmlFor="autoAmount">Сумма пополнения (руб)</label>
                  <input
                    type="number"
                    id="autoAmount"
                    value={autoDepositAmount}
                    onChange={(e) => setAutoDepositAmount(e.target.value)}
                    placeholder="Введите сумму"
                    className="form-input"
                    min="10"
                    step="10"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="period">Периодичность</label>
                  <select
                    id="period"
                    value={autoDepositPeriod}
                    onChange={(e) => setAutoDepositPeriod(e.target.value)}
                    className="form-input"
                  >
                    <option value="monthly">Ежемесячно (1-го числа)</option>
                    <option value="weekly">Еженедельно (по понедельникам)</option>
                    <option value="daily">Ежедневно (в 09:00)</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Карта для списания</label>
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
                          <div className="card-balance">{formatCurrency(card.balance)}</div>
                        </div>
                        <div className="card-selector">
                          {selectedCard === card.id && <div className="selected-indicator">✓</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="auto-deposit-summary">
                  <h4>Сводка:</h4>
                  <p>Вы будете пополнять копилку на {autoDepositAmount || '___'} ₽ {autoDepositPeriod ? getPeriodLabel(autoDepositPeriod).toLowerCase() : ''}</p>
                  <p className="summary-note">Списание будет происходить с выбранной карты автоматически</p>
                </div>
                
                <button type="submit" className="submit-button">
                  Настроить автопополнение
                </button>
              </form>
            </div>
            
            <div className="deposit-info-section">
              <div className="info-card">
                <h3>Преимущества автопополнения</h3>
                <ul className="info-list">
                  <li>📅 Не нужно помнить о регулярных платежах</li>
                  <li>🎯 Помогает быстрее достигать финансовых целей</li>
                  <li>📊 Формирует полезную финансовую привычку</li>
                  <li>🔔 Вы получите уведомление перед каждым списанием</li>
                  <li>⚙️ В любой момент можно изменить настройки или отменить</li>
                </ul>
                
                <div className="active-auto-deposits">
                  <h4>Активные автопополнения:</h4>
                  <div className="empty-state">
                    <p>У вас пока нет активных автопополнений</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="transactions-history">
          <h3>История пополнений</h3>
          <div className="empty-history">
            <div className="empty-icon">📊</div>
            <p>Здесь будет отображаться история ваших пополнений</p>
            <p className="empty-subtext">Совершите первое пополнение, чтобы увидеть историю операций</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DepositPage;