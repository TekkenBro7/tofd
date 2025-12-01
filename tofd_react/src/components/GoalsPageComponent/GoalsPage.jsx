import React, { useState, useEffect } from 'react';
import './GoalsPage.css';

const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [currentUser, setCurrentUser] = useState('');
  
  // Данные для формы
  const [title, setTitle] = useState('');
  const [cost, setCost] = useState('');
  const [deadline, setDeadline] = useState('');
  const [period, setPeriod] = useState('monthly');
  
  // Загрузка целей при монтировании
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setCurrentUser(user);
      const savedGoals = JSON.parse(localStorage.getItem(`goals_${user}`) || '[]');
      setGoals(savedGoals);
    }
  }, []);
  
  // Сохранение целей в localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`goals_${currentUser}`, JSON.stringify(goals));
    }
  }, [goals, currentUser]);
  
  const resetForm = () => {
    setTitle('');
    setCost('');
    setDeadline('');
    setPeriod('monthly');
    setEditingGoal(null);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!title.trim() || !cost || !deadline) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }
    
    const newGoal = {
      id: editingGoal ? editingGoal.id : Date.now(),
      title,
      cost: parseFloat(cost),
      deadline,
      period,
      createdAt: editingGoal ? editingGoal.createdAt : new Date().toISOString(),
      progress: editingGoal ? editingGoal.progress : 0,
      currentAmount: editingGoal ? editingGoal.currentAmount : 0
    };
    
    if (editingGoal) {
      setGoals(goals.map(goal => goal.id === editingGoal.id ? newGoal : goal));
    } else {
      setGoals([...goals, newGoal]);
    }
    
    resetForm();
    setShowForm(false);
  };
  
  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setTitle(goal.title);
    setCost(goal.cost.toString());
    setDeadline(goal.deadline);
    setPeriod(goal.period);
    setShowForm(true);
  };
  
  const handleDelete = (id) => {
    if (window.confirm('Вы уверены, что хотите удалить эту цель?')) {
      setGoals(goals.filter(goal => goal.id !== id));
    }
  };
  
  const calculateMonthlyPayment = (goal) => {
    const deadlineDate = new Date(goal.deadline);
    const now = new Date();
    const monthsDiff = (deadlineDate.getFullYear() - now.getFullYear()) * 12 
                     + (deadlineDate.getMonth() - now.getMonth());
    
    if (monthsDiff <= 0) return goal.cost;
    return (goal.cost - goal.currentAmount) / monthsDiff;
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-BY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-BY', {
      style: 'currency',
      currency: 'BYN',
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
  
  const calculateProgress = (goal) => {
    return Math.min(100, (goal.currentAmount / goal.cost) * 100);
  };
  
  return (
    <div className="goals-container">
      <header className="header">
        <div className="header-content">
          <h1 className="welcome-title">Мои цели</h1>
          <div className="header-actions">
            <button 
              onClick={() => {
                resetForm();
                setShowForm(true);
              }} 
              className="create-goal-button"
            >
              + Создать цель
            </button>
          </div>
        </div>
      </header>
      
      <main className="main-content">
        <div className="goals-summary">
          <div className="summary-card">
            <h3>Всего целей</h3>
            <p className="summary-value">{goals.length}</p>
          </div>
          <div className="summary-card">
            <h3>Общая сумма</h3>
            <p className="summary-value">
              {formatCurrency(goals.reduce((sum, goal) => sum + goal.cost, 0))}
            </p>
          </div>
          <div className="summary-card">
            <h3>Собрано</h3>
            <p className="summary-value">
              {formatCurrency(goals.reduce((sum, goal) => sum + goal.currentAmount, 0))}
            </p>
          </div>
        </div>
        
        {goals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3>У вас пока нет целей</h3>
            <p>Создайте свою первую цель для накопления</p>
            <button 
              onClick={() => setShowForm(true)} 
              className="create-first-goal-button"
            >
              Создать первую цель
            </button>
          </div>
        ) : (
          <div className="goals-list">
            {goals.map((goal) => (
              <div key={goal.id} className="goal-card">
                <div className="goal-header">
                  <h3 className="goal-title">{goal.title}</h3>
                  <div className="goal-actions">
                    <button 
                      onClick={() => handleEdit(goal)} 
                      className="edit-goal-button"
                    >
                      Изменить
                    </button>
                    <button 
                      onClick={() => handleDelete(goal.id)} 
                      className="delete-goal-button"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                
                <div className="goal-details">
                  <div className="goal-detail">
                    <span className="detail-label">Стоимость:</span>
                    <span className="detail-value">{formatCurrency(goal.cost)}</span>
                  </div>
                  <div className="goal-detail">
                    <span className="detail-label">Срок:</span>
                    <span className="detail-value">{formatDate(goal.deadline)}</span>
                  </div>
                  <div className="goal-detail">
                    <span className="detail-label">Период отчислений:</span>
                    <span className="detail-value">{getPeriodLabel(goal.period)}</span>
                  </div>
                  <div className="goal-detail">
                    <span className="detail-label">Ежемесячный платеж:</span>
                    <span className="detail-value">
                      {formatCurrency(calculateMonthlyPayment(goal))}
                    </span>
                  </div>
                </div>
                
                <div className="goal-progress">
                  <div className="progress-header">
                    <span>Прогресс</span>
                    <span>{formatCurrency(goal.currentAmount)} из {formatCurrency(goal.cost)}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${calculateProgress(goal)}%` }}
                    ></div>
                  </div>
                  <div className="progress-percentage">
                    {calculateProgress(goal).toFixed(1)}%
                  </div>
                </div>
                
                <div className="goal-footer">
                  <span className="created-date">
                    Создано: {formatDate(goal.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* Модальное окно для создания/редактирования цели */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingGoal ? 'Изменить цель' : 'Создать новую цель'}</h2>
              <button 
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }} 
                className="close-modal"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="goal-form">
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
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cost">Стоимость (руб) *</label>
                  <input
                    type="number"
                    id="cost"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    placeholder="50000"
                    className="form-input"
                    min="1"
                    required
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
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="period">Период автоматических отчислений</label>
                <select
                  id="period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="form-input"
                >
                  <option value="daily">Ежедневно</option>
                  <option value="weekly">Еженедельно</option>
                  <option value="monthly">Ежемесячно</option>
                </select>
                <small className="form-help">
                  Сумма будет автоматически переводиться с вашего кошелька в копилку
                </small>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }} 
                  className="cancel-button"
                >
                  Отмена
                </button>
                <button type="submit" className="submit-button">
                  {editingGoal ? 'Сохранить изменения' : 'Создать цель'}
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