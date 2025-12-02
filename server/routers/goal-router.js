import { Router } from 'express';
import { goalController } from '../controllers/goal-controller.js';
import authMiddleware from '../middlewares/auth-middleware.js';


const goalRouter = Router();

goalRouter.post('/goals', authMiddleware, goalController.createGoal);
goalRouter.get('/goals/active', authMiddleware, goalController.getActiveGoal);
goalRouter.post('/goals/cancel', authMiddleware, goalController.cancelGoal);


export { goalRouter };


