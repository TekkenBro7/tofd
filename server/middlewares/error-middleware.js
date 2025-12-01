import { ApiError } from "../exceptions/api-error.js";


export function errorMiddleware (err, req, res, next) {  
  if (err instanceof ApiError) {
    console.log(`[${err.status}] ${err.message}`);
    return res.status(err.status).json({message: err.message});
  }
  else {
    console.log(err);
  }
  return res.status(500).json({message: 'Непредвиденная ошибка'});
};