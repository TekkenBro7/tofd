import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { sequelize } from './config/database.js';
import { userRouter } from './routers/user-router.js';
import { goalRouter } from './routers/goal-router.js';
import { syncRouter } from './routers/sync-router.js';
import { errorMiddleware } from './middlewares/error-middleware.js';

if (process.env.PORT === undefined) {
  console.error('[ERROR] Переименуйте файл ".env.example" в файл ".env"');
}
const PORT = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use(cookieParser());

app.use('/api', userRouter);
app.use('/api', goalRouter);
app.use('/api', syncRouter);
app.use(errorMiddleware);

const start = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    
    app.listen(PORT, () => console.log(`Server started on PORT = ${PORT}`));
  } catch (e) {
    console.log(e);
  }
};

start();