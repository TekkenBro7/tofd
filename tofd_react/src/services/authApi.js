// services/authApi.js
const API_URL = 'http://localhost:5000/api'; 

class AuthApi {
  async register(login, password) {
    const response = await fetch(`${API_URL}/registration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ login, password }),
      credentials: 'include', // Важно для отправки cookies
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Ошибка регистрации');
    }

    return await response.json();
  }

  async login(login, password) {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ login, password }),
      credentials: 'include', // Важно для отправки cookies
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Ошибка входа');
    }

    return await response.json();
  }

  async logout() {
    try {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        credentials: 'include', // Отправляем cookies для удаления refreshToken
      });
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    }
  }

  async refresh() {
    const response = await fetch(`${API_URL}/refresh`, {
      method: 'GET',
      credentials: 'include', // Refresh token берется из cookies
    });

    if (!response.ok) {
      throw new Error('Не удалось обновить токен');
    }

    return await response.json();
  }

  // Валидация JWT токена
  isTokenValid(token) {
    if (!token) return false;
    
    try {
      // Декодируем JWT токен (без проверки подписи)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const payload = JSON.parse(jsonPayload);
      const now = Math.floor(Date.now() / 1000);
      
      // Проверяем срок действия
      return payload.exp > now;
    } catch (error) {
      console.error('Ошибка валидации токена:', error);
      return false;
    }
  }

  // Получение обновленного access token если нужно
  async getValidAccessToken() {
    const accessToken = this.getAccessTokenFromStorage();
    
    if (accessToken && this.isTokenValid(accessToken)) {
      return accessToken;
    }

    try {
      const data = await this.refresh();
      this.saveAccessToken(data.accessToken);
      this.saveUser(data.user);
      return data.accessToken;
    } catch (error) {
      this.clearAuthData();
      throw error;
    }
  }

  // Работа с sessionStorage для accessToken
  getAccessTokenFromStorage() {
    return sessionStorage.getItem('accessToken');
  }

  saveAccessToken(token) {
    sessionStorage.setItem('accessToken', token);
  }

  saveUser(user) {
    sessionStorage.setItem('user', JSON.stringify(user));
    sessionStorage.setItem('isAuthenticated', 'true');
  }

  getUser() {
    const userStr = sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated() {
    const accessToken = this.getAccessTokenFromStorage();
    const isAuth = sessionStorage.getItem('isAuthenticated') === 'true';
    return accessToken && isAuth && this.isTokenValid(accessToken);
  }

  clearAuthData() {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('isAuthenticated');
  }
}

export const authApi = new AuthApi();

// Экспорт для защищенных запросов
export async function makeAuthenticatedRequest(url, options = {}) {
  const accessToken = await authApi.getValidAccessToken();
  
  const defaultOptions = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${url}`, finalOptions);

  if (!response.ok) {
    if (response.status === 401) {
      authApi.clearAuthData();
      window.location.href = '/';
    }
    const errorData = await response.json();
    throw new Error(errorData.message || 'Ошибка запроса');
  }

  return await response.json();
}