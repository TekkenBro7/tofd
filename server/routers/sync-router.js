import { Router } from 'express';
import { syncController } from '../controllers/sync-controller.js';
import authMiddleware from '../middlewares/auth-middleware.js';


const syncRouter = Router();

syncRouter.get('/stats', authMiddleware, syncController.getStats);


export { syncRouter };


