import { Router } from 'express';
import { userController } from '../controllers/user-controller.js';
import authMiddleware from '../middlewares/auth-middleware.js';

const userRouter = Router();

userRouter.post('/login', userController.login);
userRouter.post('/registration', userController.registration);
userRouter.post('/logout', userController.logout);
userRouter.get('/refresh', userController.refresh);
userRouter.post('/wallet', authMiddleware, userController.setWallet);

export { userRouter };