import 'dotenv/config';
import { sequelize } from '../config/database.js';
import { models } from '../models/index.js';

async function initDatabase() {
  try {
    await sequelize.sync({ force: true });
    
    console.log('Database initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();