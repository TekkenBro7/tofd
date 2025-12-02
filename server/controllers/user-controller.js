import { userService } from '../services/user-service.js';

/**
 * @import {Request, Response, NextFunction} from "express"
 */

class UserController {

  /**
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async registration(req, res, next) {
    try {
      const userData = await userService.registration(
        req.body.login,
        req.body.password
      );
      
      res.cookie('refreshToken', userData.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true
      });
      
      return res.json(userData);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async login(req, res, next) {
    try {
      const userData = await userService.login(
        req.body.login,
        req.body.password
      );
      
      res.cookie('refreshToken', userData.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true
      });

      return res.json(userData);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async logout(req, res, next) {
    try {
      await userService.logout(req.cookies.refreshToken);
      res.clearCookie('refreshToken');
      
      return res.status(200).json({});
    } catch (error) {
      next(error);
    }
  }

  /**
   * @param {Request} req
   * @param {Response} res
   * @param {NextFunction} next
   */
  async refresh(req, res, next) {
    try {
      const userData = await userService.refresh(req.cookies.refreshToken);
      res.cookie('refreshToken', userData.refreshToken, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true
      });

      return res.json(userData);
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();