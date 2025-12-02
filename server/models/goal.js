import { sequelize } from '../config/database.js';
import { DataTypes } from 'sequelize';


export const Goal = sequelize.define('Goal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(32),
    allowNull: false,
    defaultValue: 'active'
  },
  targetAmount: {
    type: DataTypes.STRING(64),
    allowNull: false,
    field: 'target_amount'
  },
  accumulatedAmount: {
    type: DataTypes.STRING(64),
    allowNull: false,
    defaultValue: '0',
    field: 'accumulated_amount'
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false
  },
  periodicityDays: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: '7',
    field: 'periodicity_days'
  }
}, {
  tableName: 'goals',
  timestamps: false
});


