import { Router } from 'express';
import { syncController } from '../controllers/sync-controller.js';
import authMiddleware from '../middlewares/auth-middleware.js';


const syncRouter = Router();

syncRouter.post('/sync/deposit', authMiddleware, syncController.confirmDeposit);
syncRouter.post('/sync/withdraw', authMiddleware, syncController.confirmWithdraw);
syncRouter.get('/stats', authMiddleware, syncController.getStats);


export { syncRouter };


