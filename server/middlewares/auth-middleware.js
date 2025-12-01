import { ApiError } from "../exceptions/api-error.js";
import { tokenService } from "../services/token-service.js";


/**
 * @import {Request, Response, NextFunction} from "express"
 */


/**
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export default function (req, res, next) {
  try {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader) {
      return next(ApiError.UnauthorizedError());
    }

    // Authorization: Bearer ${accessToken}
    const accessToken = authorizationHeader.split(' ')[1];
    if (!accessToken) {
      return next(ApiError.UnauthorizedError());
    }

    const userData = tokenService.validateAccessToken(accessToken);
    if (!userData) {
      return next(ApiError.UnauthorizedError());
    }

    req.user = userData;
    next();
  } catch (error) {
    return next(ApiError.UnauthorizedError());
  }
}