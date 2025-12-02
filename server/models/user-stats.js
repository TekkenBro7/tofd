import { sequelize } from '../config/database.js';
import { DataTypes } from 'sequelize';


export const UserStats = sequelize.define('UserStats', {
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: 'user_id'
  },
  rating: {
    type: DataTypes.STRING(32),
    allowNull: false,
    defaultValue: '0'
  },
  achievements: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: ''
  },
  streakDays: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'streak_days'
  },
  lastDepositDate: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'last_deposit_date'
  },
  completedGoals: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'completed_goals'
  }
}, {
  tableName: 'user_stats',
  timestamps: false
});


