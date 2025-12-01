import bcrypt from 'bcrypt';
import { models } from '../models/index.js';
import { jwtTokenService } from './jwt-token-service.js';
import { ApiError } from '../exceptions/api-error.js';


class UserService {

  /**
   * @param {string} login 
   * @param {string} password 
   */
  async registration(login, password) {
    const candidate = await models.User.findOne({ where: {login} });
    if (candidate) {
      throw ApiError.BadRequest(`Пользователь с логином ${login} уже существует`);
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const user = await models.User.create({
      login,
      password: hashPassword
    });

    const userDto = { 
      id: user.id,
      login
    };

    const tokens = jwtTokenService.generateTokens(userDto);
    await jwtTokenService.saveToken(user.id, tokens.refreshToken);

    return { ...tokens, user: userDto };
  }

  /**
   * @param {string} login 
   * @param {string} password 
   */
  async login(login, password) {
    const user = await models.User.findOne({ where: {login} });
    if (!user) {
      throw ApiError.BadRequest(`Пользователь с логином ${login} не найден`);
    }
    
    const isPassEquals = await bcrypt.compare(password, user.password);
    if (!isPassEquals) {
      throw ApiError.BadRequest('Неверный пароль');
    }
    
    const userDto = { 
      id: user.id,
      login
    };

    const tokens = jwtTokenService.generateTokens(userDto);
    await jwtTokenService.saveToken(user.id, tokens.refreshToken);

    return { ...tokens, user: userDto };
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
    const userDto = { 
      id: user.id,
      login: user.login
    };

    const newAccessToken = jwtTokenService.generateAccessToken(userDto);
    let newRefreshToken = refreshToken;
    
    if (jwtTokenService.shouldRefreshRefreshToken(userData)) {
      newRefreshToken = jwtTokenService.generateRefreshToken(userDto);
      await jwtTokenService.saveToken(user.id, newRefreshToken);
    }

    return { 
      accessToken: newAccessToken, 
      refreshToken: newRefreshToken, 
      user: userDto 
    };
  }
}

export const userService = new UserService();