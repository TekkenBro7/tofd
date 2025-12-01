import jwt from 'jsonwebtoken';
import { models } from '../models/index.js';


class JwtTokenService {

  /**
   * @param {string|Buffer|object} payload 
   */
  generateTokens(payload) {
    return { 
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload)
    };
  }

  /**
   * @param {string|Buffer|object} payload 
   */
  generateAccessToken(payload) {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {expiresIn: '30m'});
  }

  /**
   * @param {string|Buffer|object} payload 
   */
  generateRefreshToken(payload) {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {expiresIn: '30d'});
  }

  /**
   * @param {string} token 
   */
  validateAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (error) {
      return null;
    }
  }

  /**
   * @param {string} token 
   */
  validateRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      return null;
    }
  }

  shouldRefreshRefreshToken(decodedRefreshToken) {
    // До истечения refreshToken осталось меньше 7 дней
    const expirationTime = decodedRefreshToken.exp * 1000;
    const currentTime = Date.now();
    const timeLeft = expirationTime - currentTime;
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    
    return timeLeft < sevenDaysInMs;
  }

  /**
   * @param {number} userId 
   * @param {string} refreshToken 
   */
  async saveToken(userId, refreshToken) {
    const tokenData = await models.JwtToken.findByPk(userId);
    if (tokenData) {
      return tokenData.update({ refreshToken });
    }
    return models.JwtToken.create({ userId, refreshToken });
  }

  /**
   * @param {string} refreshToken 
   */
  async removeToken(refreshToken) {
    const token = await models.JwtToken.findOne({ where: {refreshToken}});
    if (token) {
      token.destroy();
    }
  }
  
  /**
   * @param {string} refreshToken 
   */
  async findToken(refreshToken) {
    return models.JwtToken.findOne({ where: {refreshToken}});    
  }

}

export const jwtTokenService = new JwtTokenService();