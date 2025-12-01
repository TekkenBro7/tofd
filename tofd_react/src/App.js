import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './ui/Layout';
import HomePage from './components/HomePageComponent/HomePage';
import GoalsPage from './components/GoalsPageComponent/GoalsPage';
import AchievementsPage from './components/AchievementsPageComponent/AchievementsPage';
import WithdrawalPage from './components/WithdrawalPageComponent/WithdrawalPage';
import DepositPage from './components/DepositPageComponent/DepositPage';
import './App.css';

// Компонент для защищенных маршрутов
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? children : <Navigate to="/" />;
};

// Компонент для проверки аутентификации и обновления состояния
const AuthWrapper = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const savedAuth = localStorage.getItem('isAuthenticated');
      const savedUser = localStorage.getItem('user');
      setIsAuthenticated(savedAuth === 'true' && !!savedUser);
    };

    // Проверяем сразу при монтировании
    checkAuth();

    // Подписываемся на изменения localStorage
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Функция для выхода
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    navigate('/');
    // Принудительно обновляем страницу для сброса состояния
    window.location.reload();
  };

  return (
    <Layout 
      isAuthenticated={isAuthenticated}
      onLogout={handleLogout}
    />
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Все маршруты обернуты в AuthWrapper */}
          <Route path="/*" element={<AuthWrapper />}>
            {/* Главная страница доступна всем */}
            <Route index element={<HomePage />} />
            
            {/* Защищенные маршруты - только для авторизованных пользователей */}
            {/* Используем относительные пути вместо абсолютных */}
            <Route 
              path="goals" 
              element={
                <ProtectedRoute>
                  <GoalsPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="achievements" 
              element={
                <ProtectedRoute>
                  <AchievementsPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="withdrawal" 
              element={
                <ProtectedRoute>
                  <WithdrawalPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="deposit" 
              element={
                <ProtectedRoute>
                  <DepositPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Редирект на главную для несуществующих страниц */}
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;