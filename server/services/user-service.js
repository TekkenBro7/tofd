import bcrypt from 'bcrypt';
import { models } from '../models/index.js';
import { jwtTokenService } from './jwt-token-service.js';
import { ApiError } from '../exceptions/api-error.js';


class UserService {

  /**
   * @param {string} login 
   * @param {string} password 
   */
  validateCredentials(login, password) {
    if (login === undefined || password === undefined) {
      throw ApiError.BadRequest(`Поля 'login' и 'password' обязательны`);
    }

    if (typeof login !== 'string' || typeof password !== 'string') {
      throw ApiError.BadRequest(`Поля 'login' и 'password' должны быть типа 'string'`);
    }

    const trimmedLogin = login.trim();
    const trimmedPassword = password.trim();

    if (trimmedLogin.length < 3) {
      throw ApiError.BadRequest(`Логин должен содержать минимум 3 символа`);
    }

    if (trimmedPassword.length < 6) {
      throw ApiError.BadRequest(`Пароль должен содержать минимум 6 символов`);
    }

    return { trimmedLogin, trimmedPassword };
  }

  /**
   * @returns {{id: number, login: string}}
   */
  createUserDto(user) {
    return {
      id: user.id,
      login: user.login
    };
  }

  /**
   * @returns {{id: number, login: string, walletAddress: string|null}}
   */
  createUserResponseDto(user) {
    return {
      id: user.id,
      login: user.login,
      walletAddress: user.walletAddress
    };
  }

  /**
   * @param {string} login 
   * @param {string} password 
   */
  async registration(login, password) {
    const { trimmedLogin, trimmedPassword } = this.validateCredentials(login, password);

    const candidate = await models.User.findOne({ where: {login: trimmedLogin} });
    if (candidate) {
      throw ApiError.BadRequest(`Пользователь с логином ${trimmedLogin} уже существует`);
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const user = await models.User.create({
      login: trimmedLogin,
      password: hashPassword
    });

    const userDto = this.createUserDto(user);
    const userResponse = this.createUserResponseDto(user);

    const tokens = jwtTokenService.generateTokens(userDto);
    await jwtTokenService.saveToken(user.id, tokens.refreshToken);

    return { ...tokens, user: userResponse };
  }

  /**
   * @param {string} login 
   * @param {string} password 
   */
  async login(login, password) {
    const { trimmedLogin, trimmedPassword } = this.validateCredentials(login, password);

    const user = await models.User.findOne({ where: {login: trimmedLogin} });
    if (!user) {
      throw ApiError.BadRequest(`Пользователь с логином ${trimmedLogin} не найден`);
    }
    
    const isPassEquals = await bcrypt.compare(password, user.password);
    if (!isPassEquals) {
      throw ApiError.BadRequest('Неверный пароль');
    }
    
    const userDto = this.createUserDto(user);
    const userResponse = this.createUserResponseDto(user);

    const tokens = jwtTokenService.generateTokens(userDto);
    await jwtTokenService.saveToken(user.id, tokens.refreshToken);

    return { ...tokens, user: userResponse };
  }

  /**
   * @param {number} userId 
   * @param {string} walletAddress 
   */
  async setWallet(userId, walletAddress) {
    if (!walletAddress || typeof walletAddress !== 'string') {
      throw ApiError.BadRequest('Адрес кошелька обязателен');
    }

    if (walletAddress.length !== 44) {
      throw ApiError.BadRequest('Адрес кошелька Solana должен содержать 44 символа');
    }

    const existingUser = await models.User.findOne({ 
      where: { 
        walletAddress: walletAddress,
        id: { $ne: userId } 
      } 
    });

    if (existingUser) {
      throw ApiError.BadRequest('Этот кошелек уже привязан к другому пользователю');
    }

    const user = await models.User.findByPk(userId);
    if (!user) {
      throw ApiError.UnauthorizedError();
    }

    await user.update({ walletAddress: walletAddress });
    
    return this.createUserResponseDto(user);
  }

  /**
   * @param {number} userId 
   */
  async getUserById(userId) {
    const user = await models.User.findByPk(userId);
    if (!user) {
      throw ApiError.UnauthorizedError();
    }
    
    return this.createUserResponseDto(user);
  }

  /**
   * @param {string} refreshToken 
   */
  async logout(refreshToken) {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError();
    }
    return jwtTokenService.removeToken(refreshToken);
  }

  /**
   * @param {string} refreshToken 
   */
  async refresh(refreshToken) {
    if (!refreshToken) {
      throw ApiError.UnauthorizedError();
    }
    const userData = jwtTokenService.validateRefreshToken(refreshToken);
    const tokenFromDb = await jwtTokenService.findToken(refreshToken);
    
    if (!userData || !tokenFromDb) {
      throw ApiError.UnauthorizedError();
    }
    
    const user = await models.User.findByPk(userData.id);
    const userDto = this.createUserDto(user);
    const userResponse = this.createUserResponseDto(user);

    const newAccessToken = jwtTokenService.generateAccessToken(userDto);
    let newRefreshToken = refreshToken;
    
    if (jwtTokenService.shouldRefreshRefreshToken(userData)) {
      newRefreshToken = jwtTokenService.generateRefreshToken(userDto);
      await jwtTokenService.saveToken(user.id, newRefreshToken);
    }

    return { 
      accessToken: newAccessToken, 
      refreshToken: newRefreshToken, 
      user: userResponse 
    };
  }
}

export const userService = new UserService();