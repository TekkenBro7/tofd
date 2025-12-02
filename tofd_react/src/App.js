import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './ui/Layout';
import HomePage from './components/HomePageComponent/HomePage';
import GoalsPage from './components/GoalsPageComponent/GoalsPage';
import AchievementsPage from './components/AchievementsPageComponent/AchievementsPage';
import WithdrawalPage from './components/WithdrawalPageComponent/WithdrawalPage';
import DepositPage from './components/DepositPageComponent/DepositPage';
import { authApi } from './services/authApi';
import './App.css';

// Компонент для защищенных маршрутов
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, accessToken } = authApi.getAuthData();
  
  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/" />;
  }
  
  // Простая проверка срока действия
  if (!authApi.isTokenValid()) {
    // Пытаемся обновить токен
    authApi.refresh().then(data => {
      authApi.saveAuthData(data);
      window.location.reload();
    }).catch(() => {
      authApi.clearAuthData();
      return <Navigate to="/" />;
    });
    
    return <div>Обновление сессии...</div>;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Главный маршрут с Layout */}
          <Route path="/" element={<Layout />}>
            {/* Главная страница доступна всем */}
            <Route index element={<HomePage />} />
            
            {/* Защищенные маршруты - только для авторизованных пользователей */}
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