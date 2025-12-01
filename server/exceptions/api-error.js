export class ApiError extends Error {

  /** @type {number} */
  status;

  
  /**
   * @param {number} status 
   * @param {string} message 
   */
  constructor(status, message) {
    super(message);
    this.status = status;
  }

  static UnauthorizedError() {
    return new ApiError(401, 'Пользователь не авторизован');
  }

  /**
   * @param {string} message 
   */
  static BadRequest(message) {
    return new ApiError(400, message);
  }
};